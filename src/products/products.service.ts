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
    files: { images?: Express.Multer.File[] },
  ): Promise<Product> {
    // Validate category exists
    await this.categoriesService.findOne(createProductDto.categoryId);

    // Validate images (expect 4 images; the first image is used as the primary image)
    if (!files.images || files.images.length < 4) {
      throw new BadRequestException('Minimum 4 product images required');
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

    // Upload images to Cloudinary (all images in one folder)
    const imagesResults = await this.cloudinaryService.uploadMultipleImages(
      files.images,
      'auction/products/images',
    );

    const imagesUrls = imagesResults.map(img => img.secure_url);

    // Create product with currentPrice = 0 (first bid must be >= startPrice)
    const product = new this.productModel({
      ...createProductDto,
      sellerId: new Types.ObjectId(sellerId),
      categoryId: new Types.ObjectId(createProductDto.categoryId),
      images: imagesUrls,
      currentPrice: 0,
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
  async getTopEndingSoon(limit: number = 5, page: number = 1): Promise<Product[]> {
    const now = new Date();
    const skip = (page - 1) * limit;
    return this.productModel
      .find({
        status: 'active',
        endTime: { $gt: now },
      })
      .populate('sellerId', 'fullName ratingPositive ratingNegative')
      .populate('currentWinnerId', 'fullName')
      .populate('categoryId', 'name')
      .sort({ endTime: 1 }) // Sắp xếp theo thời gian kết thúc tăng dần
      .skip(skip)
      .limit(limit)
      .lean();
  }

  // Homepage: Top 5 sản phẩm nhiều lượt bid nhất
  async getTopMostBids(limit: number = 5, page: number = 1): Promise<Product[]> {
    const skip = (page - 1) * limit;
    return this.productModel
      .find({ status: 'active' })
      .populate('sellerId', 'fullName ratingPositive ratingNegative')
      .populate('currentWinnerId', 'fullName')
      .populate('categoryId', 'name')
      .sort({ bidCount: -1 }) // Sắp xếp theo bidCount giảm dần
      .skip(skip)
      .limit(limit)
      .lean();
  }

  // Homepage: Top 5 sản phẩm giá cao nhất
  async getTopHighestPrice(limit: number = 5, page: number = 1): Promise<Product[]> {
    const skip = (page - 1) * limit;
    return this.productModel
      .find({ status: 'active' })
      .populate('sellerId', 'fullName ratingPositive ratingNegative')
      .populate('currentWinnerId', 'fullName')
      .populate('categoryId', 'name')
      .sort({ currentPrice: -1 }) // Sắp xếp theo giá giảm dần
      .skip(skip)
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

    // Maintain Elasticsearch order and filter out products missing in MongoDB
    const productMap = new Map(products.map(p => [p._id.toString(), p]));
    const orderedProducts = productIds
      .map(id => productMap.get(id.toString()))
      .filter(p => p);

    // If Elasticsearch index contains stale documents (deleted in MongoDB),
    // adjust the total so it reflects actual returned products.
    // hitsTotal is ES total (could be object or number)
    const hitsTotal = total;
    const returnedFromEs = esProducts.length; // number of hits returned from ES for this page
    const foundInDb = products.length; // number of those hits that exist in MongoDB
    const missingFromDb = Math.max(0, returnedFromEs - foundInDb);

    // `total` from ElasticsearchService.search is a number here.
    const adjustedTotal = Math.max(0, total - missingFromDb);

    return {
      products: orderedProducts,
      total: adjustedTotal,
      page,
      totalPages: Math.ceil(adjustedTotal / limit),
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
    const category = await this.categoriesService.findOne(categoryId);

    const skip = (page - 1) * limit;

    // Nếu là category cha (không có parentId), lấy tất cả sản phẩm của category con
    let categoryFilter: any;
    
    if (!category.parentId) {
      // Category cha: lấy tất cả category con
      const childCategories = await this.categoriesService['categoryModel']
        .find({ parentId: new Types.ObjectId(categoryId) })
        .select('_id')
        .lean();
      
      const childCategoryIds = childCategories.map(cat => cat._id);
      
      // Query: sản phẩm có categoryId là category cha HOẶC bất kỳ category con nào
      categoryFilter = {
        categoryId: { 
          $in: [new Types.ObjectId(categoryId), ...childCategoryIds] 
        }
      };
    } else {
      // Category con: chỉ lấy sản phẩm của category này
      categoryFilter = {
        categoryId: new Types.ObjectId(categoryId)
      };
    }

    const [products, total] = await Promise.all([
      this.productModel
        .find(categoryFilter)
        .populate('sellerId', 'fullName ratingPositive ratingNegative')
        .populate('categoryId', 'name')
        .populate('currentWinnerId', 'fullName')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      this.productModel.countDocuments(categoryFilter),
    ]);

    return {
      products: products as any,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  // Get all products with pagination, sorted by creation time (newest first)
  async getAll(page: number = 1, limit: number = 10): Promise<{ products: Product[]; total: number; page: number; totalPages: number }> {
    const skip = (page - 1) * limit;

    const [products, total] = await Promise.all([
      this.productModel
        .find()
        .populate('sellerId', 'fullName ratingPositive ratingNegative')
        .populate('currentWinnerId', 'fullName')
        .populate('categoryId', 'name')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      this.productModel.countDocuments(),
    ]);

    return {
      products: products as any,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  // Seller xem các sản phẩm của mình
  async getMyProducts(
    sellerId: string,
    page: number = 1,
    limit: number = 10,
    status?: string,
  ): Promise<{ products: Product[]; total: number; page: number; totalPages: number }> {
    const skip = (page - 1) * limit;

    const filter: any = { sellerId: new Types.ObjectId(sellerId) };
    
    // Nếu có status filter (active, expired, sold, cancelled)
    if (status && ['active', 'expired', 'sold', 'cancelled'].includes(status)) {
      filter.status = status;
    }

    const [products, total] = await Promise.all([
      this.productModel
        .find(filter)
        .populate('currentWinnerId', 'fullName email ratingPositive ratingNegative')
        .populate('categoryId', 'name')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      this.productModel.countDocuments(filter),
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
        // If `categoryId` was populated it will be an object { _id, name }
        // so extract the raw ObjectId to ensure the query matches correctly.
        categoryId: new Types.ObjectId(product.categoryId._id),
        _id: { $ne: new Types.ObjectId(id) },
        status: 'active',
      })
      .limit(5)
      .select('name images currentPrice endTime bidCount')
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

    // Delete all images from Cloudinary
    try {
      const imagePublicIds = (product.images || []).map(url =>
        this.cloudinaryService.extractPublicId(url),
      ).filter(Boolean);

      if (imagePublicIds.length > 0) {
        await this.cloudinaryService.deleteMultipleImages(imagePublicIds);
      }
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
    // Get all products from MongoDB
    const products = await this.productModel
      .find()
      .populate('sellerId', 'fullName ratingPositive ratingNegative')
      .populate('currentWinnerId', 'fullName')
      .populate('categoryId', 'name')
      .lean();

    // Rebuild the Elasticsearch index to avoid stale documents:
    // 1) delete existing index (if any)
    // 2) create mapping/index settings
    // 3) bulk index all current products
    await this.elasticsearchService.deleteIndex();
    await this.elasticsearchService.createIndex();
    await this.elasticsearchService.bulkIndex(products as any);

    return {
      message: `Reindexing completed successfully`,
      indexed: products.length,
    };
  }

}
