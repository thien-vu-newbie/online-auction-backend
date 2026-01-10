import { Module, OnModuleInit, Inject } from '@nestjs/common';
import { MongooseModule, getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';
import { Product, ProductSchema, ProductDocument } from './schemas/product.schema';
import { DescriptionHistory, DescriptionHistorySchema } from './schemas/description-history.schema';
import { Bid, BidSchema } from '../bids/schemas/bid.schema';
import { AutoBidConfig, AutoBidConfigSchema } from '../bids/schemas/auto-bid-config.schema';
import { Watchlist, WatchlistSchema } from '../watchlist/schemas/watchlist.schema';
import { Comment, CommentSchema } from '../comments/schemas/comment.schema';
import { Category, CategorySchema } from '../categories/schemas/category.schema';
import { User, UserSchema } from '../users/schemas/user.schema';
import { CloudinaryService } from '../common/services/cloudinary.service';
import { MailService } from '../common/services/mail.service';
import { CategoriesModule } from '../categories/categories.module';
import { ElasticsearchModule } from '../elasticsearch/elasticsearch.module';
import { ElasticsearchService } from '../elasticsearch/elasticsearch.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Product.name, schema: ProductSchema },
      { name: DescriptionHistory.name, schema: DescriptionHistorySchema },
      { name: Category.name, schema: CategorySchema },
      { name: Bid.name, schema: BidSchema },
      { name: AutoBidConfig.name, schema: AutoBidConfigSchema },
      { name: Watchlist.name, schema: WatchlistSchema },
      { name: Comment.name, schema: CommentSchema },
      { name: User.name, schema: UserSchema }, // For RolesGuard
    ]),
    CategoriesModule, // Import để dùng CategoriesService
    ElasticsearchModule, // Import Elasticsearch
  ],
  controllers: [ProductsController],
  providers: [ProductsService, CloudinaryService, MailService],
  exports: [ProductsService],
})
export class ProductsModule implements OnModuleInit {
  constructor(
    private readonly elasticsearchService: ElasticsearchService,
    @Inject(getModelToken(Product.name)) private readonly productModel: Model<ProductDocument>,
  ) {}

  async onModuleInit() {
    // Inject ElasticsearchService into Product model for hooks
    (this.productModel as any).elasticsearchService = this.elasticsearchService;
    (this.productModel.schema.constructor as any).elasticsearchService = this.elasticsearchService;
  }
}
