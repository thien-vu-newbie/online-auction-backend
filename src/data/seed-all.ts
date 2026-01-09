import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { Model } from 'mongoose';
import { getModelToken } from '@nestjs/mongoose';

// Import schemas
import { User } from '../users/schemas/user.schema';
import { Category } from '../categories/schemas/category.schema';
import { Product } from '../products/schemas/product.schema';
import { Bid } from '../bids/schemas/bid.schema';
import { AutoBidConfig } from '../bids/schemas/auto-bid-config.schema';
import { Rating } from '../ratings/schemas/rating.schema';
import { Comment } from '../comments/schemas/comment.schema';
import { DescriptionHistory } from '../products/schemas/description-history.schema';
import { AdminConfig } from '../admin/schemas/admin-config.schema';

// Import Elasticsearch service
import { ElasticsearchService } from '../elasticsearch/elasticsearch.service';

// Import seed functions
import { seedUsers } from './seeds/users';
import { seedCategories } from './seeds/categories';
import { seedProducts } from './seeds/products';
import { seedBids } from './seeds/bids';
import { seedAutoBidConfigs } from './seeds/autobidconfigs';
import { seedRatings } from './seeds/ratings';
import { seedComments } from './seeds/comments';
import { seedDescriptionHistories } from './seeds/descriptionhistories';
import { seedAdminConfigs } from './seeds/adminconfigs';

async function bootstrap() {
  console.log('🌱 Starting complete database seeding...\n');

  const app = await NestFactory.createApplicationContext(AppModule);

  try {
    // Get all models
    const userModel = app.get<Model<User>>(getModelToken(User.name));
    const categoryModel = app.get<Model<Category>>(
      getModelToken(Category.name),
    );
    const productModel = app.get<Model<Product>>(getModelToken(Product.name));
    const bidModel = app.get<Model<Bid>>(getModelToken(Bid.name));
    const autoBidConfigModel = app.get<Model<AutoBidConfig>>(
      getModelToken(AutoBidConfig.name),
    );
    const ratingModel = app.get<Model<Rating>>(getModelToken(Rating.name));
    const commentModel = app.get<Model<Comment>>(getModelToken(Comment.name));
    const descriptionHistoryModel = app.get<Model<DescriptionHistory>>(
      getModelToken(DescriptionHistory.name),
    );
    const adminConfigModel = app.get<Model<AdminConfig>>(
      getModelToken(AdminConfig.name),
    );

    // Seed in order (dependencies matter!)
    const users = await seedUsers(userModel);
    const categories = await seedCategories(categoryModel);
    const products = await seedProducts(productModel, users, categories);
    const bids = await seedBids(bidModel, productModel, products, users.bidders);
    const autoBidConfigs = await seedAutoBidConfigs(
      autoBidConfigModel,
      products,
      users.bidders,
    );
    const ratings = await seedRatings(ratingModel, users, products);
    const comments = await seedComments(commentModel, users, products);
    const descriptionHistories = await seedDescriptionHistories(
      descriptionHistoryModel,
      products,
    );
    const adminConfigs = await seedAdminConfigs(adminConfigModel);

    // Sync products to Elasticsearch
    console.log('\n🔍 Syncing products to Elasticsearch...');
    try {
      const elasticsearchService = app.get(ElasticsearchService);
      
      // Ensure index exists
      await elasticsearchService.createIndex();
      
      // Fetch products with populated fields for Elasticsearch
      const productsToSync = await productModel
        .find()
        .populate('categoryId', 'name')
        .populate('sellerId', 'fullName')
        .lean();
      
      // Bulk index all products
      if (productsToSync.length > 0) {
        await elasticsearchService.bulkIndex(productsToSync);
        console.log(`   ✅ Synced ${productsToSync.length} products to Elasticsearch`);
      }
    } catch (error) {
      console.warn('   ⚠️  Elasticsearch sync failed (this is optional):', error.message);
      console.warn('   💡 Make sure Elasticsearch is running if you need search functionality');
    }

    console.log('\n✅ Database seeding completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`   - Users: ${users.admin ? 1 : 0} admin + ${users.sellers.length} sellers + ${users.bidders.length} bidders = ${1 + users.sellers.length + users.bidders.length} total`);
    console.log(
      `   - Categories: ${categories.parents.length} parents + ${categories.children.length} children = ${categories.parents.length + categories.children.length} total`,
    );
    console.log(`   - Products: ${products.length}`);
    console.log(`   - Bids: ${bids.length}`);
    console.log(`   - Auto-bid Configs: ${autoBidConfigs.length}`);
    console.log(`   - Ratings: ${ratings.length}`);
    console.log(`   - Comments: ${comments.length}`);
    console.log(`   - Description Histories: ${descriptionHistories.length}`);
    console.log(`   - Admin Configs: ${adminConfigs.length}`);

    console.log('\n🎉 All done! You can now use the application with sample data.');
  } catch (error) {
    console.error('\n❌ Seeding failed:', error);
    throw error;
  } finally {
    await app.close();
    process.exit(0);
  }
}

bootstrap().catch((error) => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
