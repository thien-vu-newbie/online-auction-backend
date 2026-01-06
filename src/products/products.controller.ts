import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Patch, 
  Param, 
  Delete,
  UseGuards,
  Req,
  Query,
  UseInterceptors,
  UploadedFiles,
  BadRequestException,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiConsumes, ApiQuery } from '@nestjs/swagger';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { AddDescriptionDto } from './dto/add-description.dto';
import { SearchProductDto } from './dto/search-product.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { RequireSellerActive } from '../common/decorators/require-seller-active.decorator';

@ApiTags('Products')
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('seller')
  @RequireSellerActive()
  @ApiBearerAuth('JWT-auth')
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'images', maxCount: 4 },
    ]),
  )
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ 
    summary: '[SELLER] Đăng sản phẩm đấu giá', 
    description: 'Seller tạo sản phẩm với tối thiểu 4 ảnh (sử dụng ảnh đầu tiên làm ảnh chính), upload lên Cloudinary' 
  })
  @ApiResponse({ status: 201, description: 'Product created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid data or missing images' })
  @ApiResponse({ status: 403, description: 'Forbidden - Seller permission expired or not granted' })
  async create(
    @Req() req,
    @Body() createProductDto: CreateProductDto,
    @UploadedFiles() files: { images?: Express.Multer.File[] },
  ) {
    if (!files || !files.images || files.images.length < 4) {
      throw new BadRequestException('At least 4 images are required');
    }

    const sellerId = req.user.userId || req.user.sub;
    return this.productsService.create(createProductDto, sellerId, files);
  }

  @Get('homepage/top-ending-soon')
  @ApiOperation({ 
    summary: '[PUBLIC] Top sản phẩm gần kết thúc', 
    description: 'Hiển thị sản phẩm sắp kết thúc đấu giá (endTime gần nhất). Mặc định limit=5, page=1' 
  })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 5 })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiResponse({ status: 200, description: 'Top products ending soon' })
  getTopEndingSoon(
    @Query('limit') limit?: number,
    @Query('page') page?: number,
  ) {
    return this.productsService.getTopEndingSoon(limit, page);
  }

  @Get('homepage/top-most-bids')
  @ApiOperation({ 
    summary: '[PUBLIC] Top sản phẩm nhiều lượt bid nhất', 
    description: 'Hiển thị sản phẩm có số lượt đấu giá cao nhất. Mặc định limit=5, page=1' 
  })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 5 })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiResponse({ status: 200, description: 'Top products with most bids' })
  getTopMostBids(
    @Query('limit') limit?: number,
    @Query('page') page?: number,
  ) {
    return this.productsService.getTopMostBids(limit, page);
  }

  @Get('homepage/top-highest-price')
  @ApiOperation({ 
    summary: '[PUBLIC] Top sản phẩm giá cao nhất', 
    description: 'Hiển thị sản phẩm có giá hiện tại cao nhất. Mặc định limit=5, page=1' 
  })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 5 })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiResponse({ status: 200, description: 'Top products with highest price' })
  getTopHighestPrice(
    @Query('limit') limit?: number,
    @Query('page') page?: number,
  ) {
    return this.productsService.getTopHighestPrice(limit, page);
  }

  @Get('search')
  @ApiOperation({ 
    summary: '[PUBLIC] Tìm kiếm sản phẩm (toàn bộ)', 
    description: 'Elasticsearch full-text search với tiếng Việt (asciifolding), fuzzy matching, relevance scoring, sort. Tìm trong toàn bộ sản phẩm.' 
  })
  @ApiResponse({ status: 200, description: 'Search results with pagination' })
  search(@Query() searchDto: SearchProductDto) {
    return this.productsService.search(searchDto);
  }

  @Get()
  @ApiOperation({
    summary: '[PUBLIC] Lấy toàn bộ sản phẩm (phân trang)',
    description: 'Trả về danh sách sản phẩm có phân trang, sắp xếp theo thời gian tạo (mới nhất trước)'
  })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 10 })
  @ApiResponse({ status: 200, description: 'List of products with pagination' })
  getAll(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
  ) {
    return this.productsService.getAll(parseInt(page, 10), parseInt(limit, 10));
  }

  @Get('category/:categoryId')
  @ApiOperation({ 
    summary: '[PUBLIC] Xem danh sách sản phẩm theo category', 
    description: 'Hiển thị sản phẩm theo danh mục với phân trang' 
  })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 10 })
  @ApiResponse({ status: 200, description: 'List of products with pagination' })
  findByCategory(
    @Param('categoryId') categoryId: string,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
  ) {
    return this.productsService.findByCategory(
      categoryId,
      parseInt(page),
      parseInt(limit),
    );
  }

  @Get(':id')
  @ApiOperation({ 
    summary: '[PUBLIC] Xem chi tiết sản phẩm', 
    description: 'Hiển thị đầy đủ thông tin sản phẩm + lịch sử mô tả + 5 sản phẩm liên quan. Chỉ xem được nếu startTime <= now, trừ khi là seller của sản phẩm.' 
  })
  @ApiResponse({ status: 200, description: 'Product details with description history and related products' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  findOne(@Param('id') id: string, @Req() req) {
    const userId = req?.user?.userId || req?.user?.sub;
    return this.productsService.findOne(id, userId);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('seller')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ 
    summary: '[SELLER] Cập nhật sản phẩm', 
    description: 'Seller cập nhật sản phẩm của mình (chỉ khi chưa có bid)' 
  })
  @ApiResponse({ status: 200, description: 'Product updated successfully' })
  @ApiResponse({ status: 400, description: 'Product already has bids' })
  @ApiResponse({ status: 403, description: 'Forbidden - Not product owner' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  update(
    @Param('id') id: string,
    @Body() updateProductDto: UpdateProductDto,
    @Req() req,
  ) {
    const sellerId = req.user.userId || req.user.sub;
    return this.productsService.update(id, updateProductDto, sellerId);
  }

  @Post(':id/description')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('seller')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ 
    summary: '[SELLER] Bổ sung mô tả sản phẩm', 
    description: 'Append mô tả mới vào mô tả cũ, lưu lịch sử' 
  })
  @ApiResponse({ status: 200, description: 'Description added successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - Not product owner' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  addDescription(
    @Param('id') id: string,
    @Body() addDescriptionDto: AddDescriptionDto,
    @Req() req,
  ) {
    const sellerId = req.user.userId || req.user.sub;
    return this.productsService.addDescription(id, addDescriptionDto, sellerId);
  }

  @Post(':id/buy-now')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ 
    summary: '[USER] Mua sản phẩm ngay lập tức', 
    description: 'Người dùng mua sản phẩm ngay với giá buyNowPrice, kết thúc đấu giá ngay lập tức' 
  })
  @ApiResponse({ status: 200, description: 'Product purchased successfully' })
  @ApiResponse({ status: 400, description: 'Invalid request or buyNowPrice not available' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  async buyNow(
    @Param('id') id: string,
    @Req() req,
  ) {
    const userId = req.user.userId || req.user.sub;
    return this.productsService.buyNow(id, userId);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ 
    summary: '[ADMIN] Gỡ bỏ sản phẩm', 
    description: 'Admin xóa sản phẩm và xóa ảnh trên Cloudinary' 
  })
  @ApiResponse({ status: 200, description: 'Product removed successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin only' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  remove(@Param('id') id: string) {
    return this.productsService.remove(id);
  }

  @Post('admin/reindex-elasticsearch')
  @ApiOperation({ 
    summary: '[ADMIN] Reindex all products to Elasticsearch', 
    description: 'Đồng bộ tất cả products từ MongoDB sang Elasticsearch. Chạy 1 lần khi chuyển sang ES.' 
  })
  @ApiResponse({ status: 200, description: 'Reindexing completed' })
  async reindexElasticsearch() {
    return this.productsService.reindexElasticsearch();
  }
}
