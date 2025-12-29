import { Controller, Get, Patch, Post, Body, UseGuards, Req, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UsersService } from './users.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { RequestSellerUpgradeDto } from './dto/request-seller-upgrade.dto';

@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: '[USER] Xem profile', description: 'User xem thông tin cá nhân đầy đủ' })
  @ApiResponse({ status: 200, description: 'User profile with full details' })
  @ApiResponse({ status: 404, description: 'User not found' })
  getProfile(@Req() req) {
    const userId = req.user.userId || req.user.sub;
    return this.usersService.getProfile(userId);
  }

  @Get('my-participating-products')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ 
    summary: '[BIDDER/SELLER] Xem sản phẩm đang tham gia đấu giá', 
    description: 'Bidder xem sản phẩm mình đã đặt giá (đang active, không bao gồm bị từ chối) với phân trang' 
  })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 10 })
  @ApiResponse({ status: 200, description: 'List of participating products with pagination' })
  getMyParticipatingProducts(
    @Req() req,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
  ) {
    const userId = req.user.userId || req.user.sub;
    return this.usersService.getMyParticipatingProducts(userId, parseInt(page), parseInt(limit));
  }

  @Get('my-rejected-products')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ 
    summary: '[BIDDER] Xem sản phẩm bị từ chối', 
    description: 'Bidder xem sản phẩm mình bị seller từ chối với phân trang' 
  })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 10 })
  @ApiResponse({ status: 200, description: 'List of rejected products with pagination' })
  getMyRejectedProducts(
    @Req() req,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
  ) {
    const userId = req.user.userId || req.user.sub;
    return this.usersService.getMyRejectedProducts(userId, parseInt(page), parseInt(limit));
  }

  @Get('my-won-products')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ 
    summary: '[BIDDER/SELLER] Xem danh sách sản phẩm đã thắng', 
    description: 'Bidder xem sản phẩm mình thắng đấu giá (giá cao nhất) với phân trang' 
  })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 10 })
  @ApiResponse({ status: 200, description: 'List of won products with pagination' })
  getMyWonProducts(
    @Req() req,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
  ) {
    const userId = req.user.userId || req.user.sub;
    return this.usersService.getMyWonProducts(userId, parseInt(page), parseInt(limit));
  }

  @Get('my-products')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ 
    summary: '[SELLER] Xem sản phẩm đã đăng bán', 
    description: 'Seller xem tất cả sản phẩm của mình với phân trang. Có thể filter theo status (active, expired, sold, cancelled)' 
  })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 10 })
  @ApiQuery({ name: 'status', required: false, enum: ['active', 'expired', 'sold', 'cancelled'], description: 'Filter by status' })
  @ApiResponse({ status: 200, description: 'List of seller products with pagination' })
  getMyProducts(
    @Req() req,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
    @Query('status') status?: string,
  ) {
    const userId = req.user.userId || req.user.sub;
    return this.usersService.getMyProducts(
      userId,
      parseInt(page),
      parseInt(limit),
      status,
    );
  }

  @Patch('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ 
    summary: '[USER] Cập nhật thông tin cá nhân', 
    description: 'User cập nhật họ tên, email, địa chỉ, ngày sinh. Email mới yêu cầu verify lại.' 
  })
  @ApiResponse({ status: 200, description: 'Profile updated successfully' })
  @ApiResponse({ status: 409, description: 'Email already in use' })
  updateProfile(@Req() req, @Body() updateProfileDto: UpdateProfileDto) {
    const userId = req.user.userId || req.user.sub;
    return this.usersService.updateProfile(userId, updateProfileDto);
  }

  @Post('change-password')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ 
    summary: '[USER] Đổi mật khẩu', 
    description: 'User đổi mật khẩu (yêu cầu nhập mật khẩu cũ)' 
  })
  @ApiResponse({ status: 200, description: 'Password changed successfully' })
  @ApiResponse({ status: 400, description: 'Old password is incorrect' })
  changePassword(@Req() req, @Body() changePasswordDto: ChangePasswordDto) {
    const userId = req.user.userId || req.user.sub;
    return this.usersService.changePassword(userId, changePasswordDto);
  }

  @Post('request-seller-upgrade')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ 
    summary: '[BIDDER] Xin nâng cấp lên seller', 
    description: 'Bidder gửi yêu cầu nâng cấp lên seller (7 ngày). Admin sẽ duyệt qua POST /admin/upgrade-seller với userId.' 
  })
  @ApiResponse({ status: 200, description: 'Request submitted successfully' })
  @ApiResponse({ status: 400, description: 'Already a seller or request pending' })
  requestSellerUpgrade(@Req() req, @Body() dto: RequestSellerUpgradeDto) {
    const userId = req.user.userId || req.user.sub;
    return this.usersService.requestSellerUpgrade(userId);
  }
}
