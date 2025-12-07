import { 
  Injectable, 
  NotFoundException, 
  BadRequestException,
  ForbiddenException,
  OnModuleInit,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Product, ProductDocument } from './schemas/product.schema';
import { DescriptionHistory, DescriptionHistoryDocument } from './schemas/description-history.schema';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { AddDescriptionDto } from './dto/add-description.dto';
import { SearchProductDto, SortBy } from './dto/search-product.dto';
import { CloudinaryService } from '../common/services/cloudinary.service';
import { CategoriesService } from '../categories/categories.service';
import { ElasticsearchService } from '../elasticsearch/elasticsearch.service';

@Injectable()
export class ProductsService implements OnModuleInit {
  constructor(
    @InjectModel(Product.name) private productModel: Model<ProductDocument>,
    @InjectModel(DescriptionHistory.name) 
    private descriptionHistoryModel: Model<DescriptionHistoryDocument>,
    private cloudinaryService: CloudinaryService,
    private categoriesService: CategoriesService,
    private elasticsearchService: ElasticsearchService,
  ) {}

  async onModuleInit() {
    // Create Elasticsearch index on startup
    await this.elasticsearchService.createIndex();
  }

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

    // Hooks tự động sync Elasticsearch
    const savedProduct = await product.save();

    // Increment category product count
    await this.categoriesService.incrementProductCount(createProductDto.categoryId);

    return savedProduct;
  }

  // Homepage: Top 5 sản phẩm gần kết thúc
  async getTopEndingSoon(limit: number = 5): Promise<Product[]> {
    const now = new Date();
    return this.productModel
      .find({
        status: 'active',
        endTime: { $gt: now },
      })
      .populate('sellerId', 'fullName ratingPositive ratingNegative')
      .populate('currentWinnerId', 'fullName')
      .populate('categoryId', 'name')
      .sort({ endTime: 1 }) // Sắp xếp theo thời gian kết thúc tăng dần
      .limit(limit)
      .lean();
  }

  // Homepage: Top 5 sản phẩm nhiều lượt bid nhất
  async getTopMostBids(limit: number = 5): Promise<Product[]> {
    return this.productModel
      .find({ status: 'active' })
      .populate('sellerId', 'fullName ratingPositive ratingNegative')
      .populate('currentWinnerId', 'fullName')
      .populate('categoryId', 'name')
      .sort({ bidCount: -1 }) // Sắp xếp theo bidCount giảm dần
      .limit(limit)
      .lean();
  }

  // Homepage: Top 5 sản phẩm giá cao nhất
  async getTopHighestPrice(limit: number = 5): Promise<Product[]> {
    return this.productModel
      .find({ status: 'active' })
      .populate('sellerId', 'fullName ratingPositive ratingNegative')
      .populate('currentWinnerId', 'fullName')
      .populate('categoryId', 'name')
      .sort({ currentPrice: -1 }) // Sắp xếp theo giá giảm dần
      .limit(limit)
      .lean();
  }

  // Elasticsearch search với tiếng Việt
  async search(searchDto: SearchProductDto): Promise<{
    products: any[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const {
      name,
      categoryId,
      sortBy = SortBy.CREATED_DESC,
      page = 1,
      limit = 10,
    } = searchDto;

    // Search using Elasticsearch
    const { products: esProducts, total } = await this.elasticsearchService.search({
      query: name,
      categoryId,
      sortBy,
      page,
      limit,
    });

    // Get full product details from MongoDB
    const productIds = esProducts.map(p => new Types.ObjectId(p.id || p._id));
    
    const products = await this.productModel
      .find({ _id: { $in: productIds } })
      .populate('sellerId', 'fullName ratingPositive ratingNegative')
      .populate('currentWinnerId', 'fullName')
      .populate('categoryId', 'name')
      .lean();

    // Maintain Elasticsearch order
    const productMap = new Map(products.map(p => [p._id.toString(), p]));
    const orderedProducts = productIds
      .map(id => productMap.get(id.toString()))
      .filter(p => p);

    return {
      products: orderedProducts,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
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
    )
      .populate('sellerId', 'fullName ratingPositive ratingNegative')
      .populate('currentWinnerId', 'fullName')
      .populate('categoryId', 'name')
      .lean();

    // Update in Elasticsearch
    if (updatedProduct) {
      await this.elasticsearchService.updateProduct(id, updatedProduct as any);
    }

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
    
    // Hooks tự động sync Elasticsearch
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

    // Delete product - hooks tự động xóa khỏi Elasticsearch
    await this.productModel.findByIdAndDelete(id);

    // Delete description history
    await this.descriptionHistoryModel.deleteMany({ productId: new Types.ObjectId(id) });

    return { message: 'Product deleted successfully' };
  }

  // Helper: Check if user is product owner
  async isProductOwner(productId: string, sellerId: string): Promise<boolean> {
    const product = await this.productModel.findById(productId);
    if (!product) return false;
    return product.sellerId.toString() === sellerId;
  }

  // Migration: Reindex all products to Elasticsearch
  async reindexElasticsearch(): Promise<{ message: string, indexed: number }> {
    // Get all active products
    const products = await this.productModel
      .find()
      .populate('sellerId', 'fullName ratingPositive ratingNegative')
      .populate('currentWinnerId', 'fullName')
      .populate('categoryId', 'name')
      .lean();

    // Bulk index to Elasticsearch
    await this.elasticsearchService.bulkIndex(products as any);

    return {
      message: `Reindexing completed successfully`,
      indexed: products.length,
    };
  }
}
