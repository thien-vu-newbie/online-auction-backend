import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';
import { Product, ProductSchema } from './schemas/product.schema';
import { DescriptionHistory, DescriptionHistorySchema } from './schemas/description-history.schema';
import { User, UserSchema } from '../users/schemas/user.schema';
import { CloudinaryService } from '../common/services/cloudinary.service';
import { CategoriesModule } from '../categories/categories.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Product.name, schema: ProductSchema },
      { name: DescriptionHistory.name, schema: DescriptionHistorySchema },
      { name: User.name, schema: UserSchema }, // For RolesGuard
    ]),
    CategoriesModule, // Import để dùng CategoriesService
  ],
  controllers: [ProductsController],
  providers: [ProductsService, CloudinaryService],
  exports: [ProductsService],
})
export class ProductsModule {}
