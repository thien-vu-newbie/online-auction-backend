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
      { name: 'thumbnail', maxCount: 1 },
      { name: 'images', maxCount: 10 },
    ]),
  )
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ 
    summary: '[SELLER] Đăng sản phẩm đấu giá', 
    description: 'Mục 3.1 - Seller tạo sản phẩm với tối thiểu 3 ảnh, upload lên Cloudinary' 
  })
  @ApiResponse({ status: 201, description: 'Product created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid data or missing images' })
  @ApiResponse({ status: 403, description: 'Forbidden - Seller permission expired or not granted' })
  async create(
    @Req() req,
    @Body() createProductDto: CreateProductDto,
    @UploadedFiles() files: { thumbnail?: Express.Multer.File[], images?: Express.Multer.File[] },
  ) {
    if (!files.thumbnail || !files.images) {
      throw new BadRequestException('Thumbnail and images are required');
    }

    const sellerId = req.user.userId || req.user.sub;
    return this.productsService.create(createProductDto, sellerId, files);
  }

  @Get('category/:categoryId')
  @ApiOperation({ 
    summary: '[PUBLIC] Xem danh sách sản phẩm theo category', 
    description: 'Mục 1.3 - Hiển thị sản phẩm theo danh mục với phân trang' 
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
    description: 'Mục 1.5 - Hiển thị đầy đủ thông tin sản phẩm + lịch sử mô tả + 5 sản phẩm liên quan' 
  })
  @ApiResponse({ status: 200, description: 'Product details with description history and related products' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  findOne(@Param('id') id: string) {
    return this.productsService.findOne(id);
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
    description: 'Mục 3.2 - Append mô tả mới vào mô tả cũ, lưu lịch sử' 
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

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ 
    summary: '[ADMIN] Gỡ bỏ sản phẩm', 
    description: 'Mục 4.2 - Admin xóa sản phẩm và xóa ảnh trên Cloudinary' 
  })
  @ApiResponse({ status: 200, description: 'Product removed successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin only' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  remove(@Param('id') id: string) {
    return this.productsService.remove(id);
  }
}
