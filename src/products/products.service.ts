import { 
  Injectable, 
  NotFoundException, 
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Product, ProductDocument } from './schemas/product.schema';
import { DescriptionHistory, DescriptionHistoryDocument } from './schemas/description-history.schema';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { AddDescriptionDto } from './dto/add-description.dto';
import { CloudinaryService } from '../common/services/cloudinary.service';
import { CategoriesService } from '../categories/categories.service';

@Injectable()
export class ProductsService {
  constructor(
    @InjectModel(Product.name) private productModel: Model<ProductDocument>,
    @InjectModel(DescriptionHistory.name) 
    private descriptionHistoryModel: Model<DescriptionHistoryDocument>,
    private cloudinaryService: CloudinaryService,
    private categoriesService: CategoriesService,
  ) {}

  async create(
    createProductDto: CreateProductDto,
    sellerId: string,
    files: { thumbnail?: Express.Multer.File[], images?: Express.Multer.File[] },
  ): Promise<Product> {
    // Validate category exists
    await this.categoriesService.findOne(createProductDto.categoryId);

    // Validate images
    if (!files.thumbnail || files.thumbnail.length === 0) {
      throw new BadRequestException('Thumbnail image is required');
    }

    if (!files.images || files.images.length < 3) {
      throw new BadRequestException('Minimum 3 product images required');
    }

    // Validate dates
    const startTime = new Date(createProductDto.startTime);
    const endTime = new Date(createProductDto.endTime);

    if (startTime >= endTime) {
      throw new BadRequestException('End time must be after start time');
    }

    // Validate buyNowPrice
    if (createProductDto.buyNowPrice && createProductDto.buyNowPrice <= createProductDto.startPrice) {
      throw new BadRequestException('Buy now price must be greater than start price');
    }

    // Upload images to Cloudinary
    const [thumbnailResult] = await this.cloudinaryService.uploadMultipleImages(
      files.thumbnail,
      'auction/products/thumbnails',
    );

    const imagesResults = await this.cloudinaryService.uploadMultipleImages(
      files.images,
      'auction/products/images',
    );

    // Create product
    const product = new this.productModel({
      ...createProductDto,
      sellerId: new Types.ObjectId(sellerId),
      categoryId: new Types.ObjectId(createProductDto.categoryId),
      thumbnail: thumbnailResult.secure_url,
      images: imagesResults.map(img => img.secure_url),
      currentPrice: createProductDto.startPrice,
      startTime,
      endTime,
    });

    const savedProduct = await product.save();

    // Increment category product count
    await this.categoriesService.incrementProductCount(createProductDto.categoryId);

    return savedProduct;
  }

  async findByCategory(
    categoryId: string,
    page: number = 1,
    limit: number = 10,
  ): Promise<{ products: Product[], total: number, page: number, totalPages: number }> {
    if (!Types.ObjectId.isValid(categoryId)) {
      throw new BadRequestException('Invalid category ID');
    }

    // Validate category exists
    await this.categoriesService.findOne(categoryId);

    const skip = (page - 1) * limit;

    const [products, total] = await Promise.all([
      this.productModel
        .find({ 
          categoryId: new Types.ObjectId(categoryId),
          status: 'active',
        })
        .populate('sellerId', 'fullName ratingPositive ratingNegative')
        .populate('currentWinnerId', 'fullName')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      this.productModel.countDocuments({ 
        categoryId: new Types.ObjectId(categoryId),
        status: 'active',
      }),
    ]);

    return {
      products: products as any,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string): Promise<any> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid product ID');
    }

    const product = await this.productModel
      .findById(id)
      .populate('sellerId', 'fullName ratingPositive ratingNegative')
      .populate('currentWinnerId', 'fullName ratingPositive ratingNegative')
      .populate('categoryId', 'name')
      .lean();

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    // Lấy lịch sử bổ sung mô tả
    const descriptionHistory = await this.descriptionHistoryModel
      .find({ productId: product._id })
      .sort({ addedAt: 1 })
      .lean();

    // Lấy 5 sản phẩm khác cùng chuyên mục
    const relatedProducts = await this.productModel
      .find({
        categoryId: product.categoryId,
        _id: { $ne: new Types.ObjectId(id) },
        status: 'active',
      })
      .limit(5)
      .select('name thumbnail currentPrice endTime bidCount')
      .lean();

    return {
      ...product,
      descriptionHistory,
      relatedProducts,
    };
  }

  // Seller: Cập nhật sản phẩm (chỉ khi là owner)
  async update(
    id: string,
    updateProductDto: UpdateProductDto,
    sellerId: string,
  ): Promise<Product> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid product ID');
    }

    const product = await this.productModel.findById(id);

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    // Check ownership
    if (product.sellerId.toString() !== sellerId) {
      throw new ForbiddenException('You can only update your own products');
    }

    // Không cho phép update nếu đã có bid
    if (product.bidCount > 0) {
      throw new BadRequestException('Cannot update product that already has bids');
    }

    // Update category count nếu thay đổi category
    if (updateProductDto.categoryId && updateProductDto.categoryId !== product.categoryId.toString()) {
      await this.categoriesService.decrementProductCount(product.categoryId.toString());
      await this.categoriesService.incrementProductCount(updateProductDto.categoryId);
    }

    const updatedProduct = await this.productModel.findByIdAndUpdate(
      id,
      updateProductDto,
      { new: true },
    );

    return updatedProduct!;
  }

  async addDescription(
    productId: string,
    addDescriptionDto: AddDescriptionDto,
    sellerId: string,
  ): Promise<{ message: string, descriptionHistory: DescriptionHistory }> {
    if (!Types.ObjectId.isValid(productId)) {
      throw new BadRequestException('Invalid product ID');
    }

    const product = await this.productModel.findById(productId);

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    // Check ownership
    if (product.sellerId.toString() !== sellerId) {
      throw new ForbiddenException('You can only update your own products');
    }

    // Lưu vào description_history
    const descriptionHistory = new this.descriptionHistoryModel({
      productId: new Types.ObjectId(productId),
      content: addDescriptionDto.content,
    });

    await descriptionHistory.save();

    // Append vào description hiện tại
    product.description += `\n\n<hr>\n<p><em>Bổ sung ${new Date().toLocaleDateString('vi-VN')}</em></p>\n${addDescriptionDto.content}`;
    await product.save();

    return {
      message: 'Description added successfully',
      descriptionHistory,
    };
  }

  async remove(id: string): Promise<{ message: string }> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid product ID');
    }

    const product = await this.productModel.findById(id);

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    // Delete images from Cloudinary
    try {
      const thumbnailPublicId = this.cloudinaryService.extractPublicId(product.thumbnail);
      await this.cloudinaryService.deleteImage(thumbnailPublicId);

      const imagePublicIds = product.images.map(url => 
        this.cloudinaryService.extractPublicId(url)
      );
      await this.cloudinaryService.deleteMultipleImages(imagePublicIds);
    } catch (error) {
      console.error('Error deleting images from Cloudinary:', error);
    }

    // Decrement category product count
    await this.categoriesService.decrementProductCount(product.categoryId.toString());

    // Delete product
    await this.productModel.findByIdAndDelete(id);

    // Delete description history
    await this.descriptionHistoryModel.deleteMany({ productId: new Types.ObjectId(id) });

    return { message: 'Product removed successfully' };
  }

  // Helper: Check if user is product owner
  async isProductOwner(productId: string, sellerId: string): Promise<boolean> {
    const product = await this.productModel.findById(productId);
    if (!product) return false;
    return product.sellerId.toString() === sellerId;
  }
}
