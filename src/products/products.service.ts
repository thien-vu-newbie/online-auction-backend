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
import { Category } from '../categories/schemas/category.schema';
import { Bid } from '../bids/schemas/bid.schema';
import { AutoBidConfig } from '../bids/schemas/auto-bid-config.schema';
import { Watchlist } from '../watchlist/schemas/watchlist.schema';
import { Comment } from '../comments/schemas/comment.schema';
import { User } from '../users/schemas/user.schema';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { AddDescriptionDto } from './dto/add-description.dto';
import { SearchProductDto, SortBy } from './dto/search-product.dto';
import { CloudinaryService } from '../common/services/cloudinary.service';
import { CategoriesService } from '../categories/categories.service';
import { ElasticsearchService } from '../elasticsearch/elasticsearch.service';
import { MailService } from '../common/services/mail.service';

@Injectable()
export class ProductsService implements OnModuleInit {
  constructor(
    @InjectModel(Product.name) private productModel: Model<ProductDocument>,
    @InjectModel(DescriptionHistory.name) 
    private descriptionHistoryModel: Model<DescriptionHistoryDocument>,
    @InjectModel(Category.name) private categoryModel: Model<Category>,
    @InjectModel(Bid.name) private bidsModel: Model<Bid>,
    @InjectModel(AutoBidConfig.name) private autoBidModel: Model<AutoBidConfig>,
    @InjectModel(Watchlist.name) private watchlistModel: Model<Watchlist>,
    @InjectModel(Comment.name) private commentModel: Model<Comment>,
    @InjectModel(User.name) private userModel: Model<User>,
    private cloudinaryService: CloudinaryService,
    private categoriesService: CategoriesService,
    private elasticsearchService: ElasticsearchService,
    private mailService: MailService,
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
      name: createProductDto.name,
      description: createProductDto.description,
      categoryId: new Types.ObjectId(createProductDto.categoryId),
      sellerId: new Types.ObjectId(sellerId),
      images: imagesUrls,
      startPrice: createProductDto.startPrice,
      currentPrice: 0,
      stepPrice: createProductDto.stepPrice,
      buyNowPrice: createProductDto.buyNowPrice,
      startTime,
      endTime,
      autoExtend: createProductDto.autoExtend ?? false,
      allowUnratedBidders: createProductDto.allowUnratedBidders ?? false,
    });

    // Hooks tự động sync Elasticsearch
    const savedProduct = await product.save();

    // Increment category product count
    await this.categoriesService.incrementProductCount(createProductDto.categoryId);

    return savedProduct;
  }

  // Homepage: Top 5 sản phẩm gần kết thúc
  async getTopEndingSoon(limit: number = 5, page: number = 1): Promise<{ products: Product[]; total: number; page: number; limit: number; totalPages: number }> {
    const now = new Date();
    const skip = (page - 1) * limit;
    const filter = {
      status: 'active',
      startTime: { $lte: now },
      endTime: { $gt: now },
    };

    const [products, total] = await Promise.all([
      this.productModel
        .find(filter)
        .populate('sellerId', 'fullName ratingPositive ratingNegative')
        .populate('currentWinnerId', 'fullName')
        .populate('categoryId', 'name')
        .sort({ endTime: 1 }) // Sắp xếp theo thời gian kết thúc tăng dần
        .skip(skip)
        .limit(limit)
        .lean(),
      this.productModel.countDocuments(filter),
    ]);

    return {
      products: products as any,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  // Homepage: Top 5 sản phẩm nhiều lượt bid nhất
  async getTopMostBids(limit: number = 5, page: number = 1): Promise<{ products: Product[]; total: number; page: number; limit: number; totalPages: number }> {
    const now = new Date();
    const skip = (page - 1) * limit;
    const filter = {
      startTime: { $lte: now },
    };

    const [products, total] = await Promise.all([
      this.productModel
        .find(filter)
        .populate('sellerId', 'fullName ratingPositive ratingNegative')
        .populate('currentWinnerId', 'fullName')
        .populate('categoryId', 'name')
        .sort({ bidCount: -1 }) // Sắp xếp theo bidCount giảm dần
        .skip(skip)
        .limit(limit)
        .lean(),
      this.productModel.countDocuments(filter),
    ]);

    return {
      products: products as any,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  // Homepage: Top 5 sản phẩm giá cao nhất
  async getTopHighestPrice(limit: number = 5, page: number = 1): Promise<{ products: Product[]; total: number; page: number; limit: number; totalPages: number }> {
    const now = new Date();
    const skip = (page - 1) * limit;
    const filter = {
      startTime: { $lte: now },
    };

    const [products, total] = await Promise.all([
      this.productModel
        .find(filter)
        .populate('sellerId', 'fullName ratingPositive ratingNegative')
        .populate('currentWinnerId', 'fullName')
        .populate('categoryId', 'name')
        .sort({ currentPrice: -1 }) // Sắp xếp theo giá giảm dần
        .skip(skip)
        .limit(limit)
        .lean(),
      this.productModel.countDocuments(filter),
    ]);

    return {
      products: products as any,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
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

    let products = await this.productModel
      .find({ _id: { $in: productIds } })
      .populate('sellerId', 'fullName ratingPositive ratingNegative')
      .populate('currentWinnerId', 'fullName')
      .populate('categoryId', 'name')
      .lean();

    // Sort the MongoDB results to match the sort criteria
    // (MongoDB $in doesn't preserve order, so we must sort after fetch)
    switch (sortBy) {
      case SortBy.END_TIME_DESC:
        products.sort((a, b) => new Date(b.endTime).getTime() - new Date(a.endTime).getTime());
        break;
      case SortBy.PRICE_ASC:
        products.sort((a, b) => a.currentPrice - b.currentPrice);
        break;
      case SortBy.CREATED_DESC:
      default:
        products.sort((a, b) => {
          const aCreated = (a as any).createdAt || a._id.getTimestamp();
          const bCreated = (b as any).createdAt || b._id.getTimestamp();
          return new Date(bCreated).getTime() - new Date(aCreated).getTime();
        });
        break;
    }

    // Filter out any products that were in ES but not in MongoDB
    const returnedFromEs = esProducts.length;
    const foundInDb = products.length;
    const missingFromDb = Math.max(0, returnedFromEs - foundInDb);

    // `total` from ElasticsearchService.search is a number here.
    const adjustedTotal = Math.max(0, total - missingFromDb);

    return {
      products: products,
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
    
    const now = new Date();
    
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
        },
        startTime: { $lte: now },
      };
    } else {
      // Category con: chỉ lấy sản phẩm của category này
      categoryFilter = {
        categoryId: new Types.ObjectId(categoryId),
        startTime: { $lte: now },
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
    const now = new Date();
    const skip = (page - 1) * limit;
    const filter = {
      startTime: { $lte: now },
    };

    const [products, total] = await Promise.all([
      this.productModel
        .find(filter)
        .populate('sellerId', 'fullName ratingPositive ratingNegative')
        .populate('currentWinnerId', 'fullName')
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

  async findOne(id: string, userId?: string): Promise<any> {
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

    // Kiểm tra startTime: chỉ cho xem nếu startTime <= now, trừ khi là seller
    const now = new Date();
    const isSeller = userId && product.sellerId._id.toString() === userId;
    
    if (!isSeller && new Date(product.startTime) > now) {
      throw new NotFoundException('Product not found');
    }

    // Lấy lịch sử bổ sung mô tả
    const descriptionHistory = await this.descriptionHistoryModel
      .find({ productId: product._id })
      .sort({ addedAt: 1 })
      .lean();

    // Lấy 5 sản phẩm khác cùng chuyên mục (chỉ lấy những sản phẩm đã bắt đầu)
    // Nếu là danh mục cha, lấy tất cả sản phẩm từ các danh mục con
    // Nếu là danh mục con, chỉ lấy sản phẩm cùng danh mục con
    const currentCategoryId = new Types.ObjectId(product.categoryId._id);
    
    // Kiểm tra xem category hiện tại có phải là parent không
    const currentCategory = await this.categoryModel.findById(currentCategoryId).lean();
    
    let categoryIds: Types.ObjectId[] = [currentCategoryId];
    
    // Nếu là parent category (parentId === null), tìm tất cả child categories
    if (currentCategory && !currentCategory.parentId) {
      const childCategories = await this.categoryModel
        .find({ parentId: currentCategoryId })
        .select('_id')
        .lean();
      
      categoryIds = [currentCategoryId, ...childCategories.map(c => c._id)];
    }
    
    const relatedProducts = await this.productModel
      .find({
        categoryId: { $in: categoryIds },
        _id: { $ne: new Types.ObjectId(id) },
        status: 'active',
        startTime: { $lte: now },
      })
      .limit(5)
      .select('name images currentPrice endTime bidCount startTime')
      .lean();

    // Mask winner name for non-sellers (che tên người thắng nếu không phải seller)
    if (!isSeller && product.currentWinnerId) {
      const winner = product.currentWinnerId as any;
      if (winner && winner.fullName) {
        // Create new object to avoid mutating original
        product.currentWinnerId = {
          ...winner,
          fullName: this.maskName(winner.fullName),
        };
      }
    }

    return {
      ...product,
      descriptionHistory,
      relatedProducts,
    };
  }

  private maskName(fullName: string): string {
    // Mask tên: "Nguyễn Văn Khoa" -> "****Khoa"
    const parts = fullName.trim().split(' ');
    if (parts.length === 0) return '****';
    
    const lastName = parts[parts.length - 1];
    return `****${lastName}`;
  }

  // Seller: Cập nhật sản phẩm (chỉ khi là owner)
  async update(
    id: string,
    updateProductDto: UpdateProductDto,
    sellerId: string,
    files?: { images?: Express.Multer.File[] },
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

    // Nếu đã có bid, chỉ cho phép append description
    if (product.bidCount > 0) {
      if (updateProductDto.description) {
        // Lưu lịch sử mô tả
        const descriptionHistory = new this.descriptionHistoryModel({
          productId: new Types.ObjectId(id),
          content: updateProductDto.description,
          addedAt: new Date(),
        });
        await descriptionHistory.save();

        // Append vào description hiện tại
        product.description = product.description + '\n\n' + updateProductDto.description;
        await product.save();
      } else {
        throw new BadRequestException('Product already has bids. You can only add description.');
      }
    } else {
      // Chưa có bid, cho phép update toàn bộ
      
      // Update category count nếu thay đổi category
      if (updateProductDto.categoryId && updateProductDto.categoryId !== product.categoryId.toString()) {
        await this.categoriesService.decrementProductCount(product.categoryId.toString());
        await this.categoriesService.incrementProductCount(updateProductDto.categoryId);
      }

      // Nếu có description mới, thay thế hoàn toàn (không append)
      if (updateProductDto.description !== undefined) {
        product.description = updateProductDto.description;
      }

      // Upload new images if provided
      if (files?.images && files.images.length > 0) {
        // Upload images to Cloudinary
        const uploadPromises = files.images.map((file) =>
          this.cloudinaryService.uploadImage(file, 'products/images'),
        );
        const uploadResults = await Promise.all(uploadPromises);
        const imageUrls = uploadResults.map((result) => result.secure_url);
        
        // Update images (first image is used as thumbnail in UI)
        product.images = imageUrls;
      }

      // Apply other updates
      const { description, ...restUpdates } = updateProductDto;
      Object.assign(product, restUpdates);
      await product.save();
    }

    const updatedProduct = await this.productModel.findById(id)
      .populate('sellerId', 'fullName ratingPositive ratingNegative')
      .populate('currentWinnerId', 'fullName')
      .populate('categoryId', 'name')
      .lean() as any;

    // Update in Elasticsearch - transform to simple structure
    if (updatedProduct) {
      const esDoc = {
        name: updatedProduct.name,
        description: updatedProduct.description,
        categoryId: typeof updatedProduct.categoryId === 'object' && updatedProduct.categoryId?._id
          ? updatedProduct.categoryId._id.toString()
          : updatedProduct.categoryId?.toString(),
        categoryName: typeof updatedProduct.categoryId === 'object' && updatedProduct.categoryId?.name
          ? updatedProduct.categoryId.name
          : '',
        sellerId: typeof updatedProduct.sellerId === 'object' && updatedProduct.sellerId?._id
          ? updatedProduct.sellerId._id.toString()
          : updatedProduct.sellerId?.toString(),
        sellerName: typeof updatedProduct.sellerId === 'object' && updatedProduct.sellerId?.fullName
          ? updatedProduct.sellerId.fullName
          : '',
        images: updatedProduct.images,
        startPrice: updatedProduct.startPrice,
        currentPrice: updatedProduct.currentPrice,
        stepPrice: updatedProduct.stepPrice,
        startTime: updatedProduct.startTime,
        endTime: updatedProduct.endTime,
        autoExtend: updatedProduct.autoExtend,
        allowUnratedBidders: updatedProduct.allowUnratedBidders,
        status: updatedProduct.status,
        bidCount: updatedProduct.bidCount,
        rejectedBidders: updatedProduct.rejectedBidders,
        createdAt: updatedProduct.createdAt,
        updatedAt: updatedProduct.updatedAt,
      };
      await this.elasticsearchService.updateProduct(id, esDoc as any);
    }

    return updatedProduct;
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

    // Gửi email thông báo cho tất cả bidders đang tham gia
    try {
      // Lấy danh sách bidders unique từ bids (chưa bị reject)
      const bids = await this.bidsModel
        .find({ 
          productId: new Types.ObjectId(productId),
          isRejected: false 
        })
        .populate('bidderId', 'email fullName')
        .lean();

      // Lấy unique bidder IDs
      const uniqueBidderIds = [...new Set(bids.map(bid => bid.bidderId._id.toString()))];
      
      // Lấy thông tin seller
      const seller = await this.userModel.findById(product.sellerId).lean();

      // Gửi email cho từng bidder
      for (const bid of bids) {
        const bidder = bid.bidderId as any;
        if (!uniqueBidderIds.includes(bidder._id.toString())) continue;
        
        // Remove from array to avoid duplicate emails
        const index = uniqueBidderIds.indexOf(bidder._id.toString());
        if (index > -1) uniqueBidderIds.splice(index, 1);

        await this.mailService.sendDescriptionAddedToBidders({
          bidderEmail: bidder.email,
          bidderName: bidder.fullName,
          productName: product.name,
          productId: productId,
          sellerName: seller?.fullName || 'Seller',
          addedContent: addDescriptionDto.content,
        });
      }
    } catch (error) {
      console.error('Error sending description update emails:', error);
      // Don't fail the request if email sending fails
    }

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

    const productObjectId = new Types.ObjectId(id);

    // Delete related data (không quan trọng sau khi xóa product)
    await Promise.all([
      // Delete description history
      this.descriptionHistoryModel.deleteMany({ productId: productObjectId }),
      // Delete all bids
      this.bidsModel.deleteMany({ productId: productObjectId }),
      // Delete auto bid configs
      this.autoBidModel.deleteMany({ productId: productObjectId }),
      // Delete from watchlists
      this.watchlistModel.updateMany(
        { 'products.productId': productObjectId },
        { $pull: { products: { productId: productObjectId } } }
      ),
      // Delete comments
      this.commentModel.deleteMany({ productId: productObjectId }),
    ]);

    // Note: Giữ lại orders và ratings vì quan trọng cho lịch sử giao dịch và uy tín

    // Delete product - hooks tự động xóa khỏi Elasticsearch
    await this.productModel.findByIdAndDelete(id);

    return { message: 'Product deleted successfully' };
  }

  // Helper: Check if user is product owner
  async isProductOwner(productId: string, sellerId: string): Promise<boolean> {
    const product = await this.productModel.findById(productId);
    if (!product) return false;
    return product.sellerId.toString() === sellerId;
  }

  // Buy Now: Mua sản phẩm ngay với giá buyNowPrice
  async buyNow(productId: string, userId: string): Promise<Product> {
    const product = await this.productModel.findById(productId);

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    // Kiểm tra sản phẩm có giá mua ngay không
    if (!product.buyNowPrice || product.buyNowPrice <= 0) {
      throw new BadRequestException('This product does not have buy now price');
    }

    // Kiểm tra sản phẩm chưa kết thúc
    if (product.status !== 'active') {
      throw new BadRequestException('Product is not available for buy now');
    }

    // Kiểm tra người mua không phải là người bán
    if (product.sellerId.toString() === userId) {
      throw new BadRequestException('Seller cannot buy their own product');
    }

    // Cập nhật sản phẩm: đặt người mua làm winner, set giá = buyNowPrice, đổi status = sold
    product.currentWinnerId = new Types.ObjectId(userId);
    product.currentPrice = product.buyNowPrice;
    product.status = 'sold';
    product.endTime = new Date(); // Kết thúc ngay lập tức

    const updatedProduct = await product.save();

    // TODO: Có thể gửi email thông báo cho seller và buyer

    return updatedProduct;
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
