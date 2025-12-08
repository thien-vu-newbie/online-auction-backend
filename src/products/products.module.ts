import { Module, OnModuleInit, Inject } from '@nestjs/common';
import { MongooseModule, getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';
import { Product, ProductSchema, ProductDocument } from './schemas/product.schema';
import { DescriptionHistory, DescriptionHistorySchema } from './schemas/description-history.schema';
import { User, UserSchema } from '../users/schemas/user.schema';
import { CloudinaryService } from '../common/services/cloudinary.service';
import { CategoriesModule } from '../categories/categories.module';
import { ElasticsearchModule } from '../elasticsearch/elasticsearch.module';
import { ElasticsearchService } from '../elasticsearch/elasticsearch.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Product.name, schema: ProductSchema },
      { name: DescriptionHistory.name, schema: DescriptionHistorySchema },
      { name: User.name, schema: UserSchema }, // For RolesGuard
    ]),
    CategoriesModule, // Import để dùng CategoriesService
    ElasticsearchModule, // Import Elasticsearch
  ],
  controllers: [ProductsController],
  providers: [ProductsService, CloudinaryService],
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
