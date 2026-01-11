import { Controller, Post, Body, Get, Param, Query, UseGuards, Patch, Delete } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { UpgradeSellerDto } from './dto/upgrade-seller.dto';
import { UpdateConfigDto } from './dto/update-config.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@ApiTags('Admin')
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
@ApiBearerAuth('JWT-auth')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Post('upgrade-seller')
  @ApiOperation({ 
    summary: '[ADMIN] Nâng cấp user lên seller (7 ngày)', 
    description: 'Admin cấp quyền seller cho user. Duration cố định 7 ngày. Có thể dùng để approve request hoặc upgrade trực tiếp.' 
  })
  @ApiResponse({ status: 200, description: 'User upgraded to seller successfully (7 days)' })
  @ApiResponse({ status: 400, description: 'Cannot upgrade admin' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin only' })
  @ApiResponse({ status: 404, description: 'User not found' })
  upgradeSeller(@Body() upgradeSellerDto: UpgradeSellerDto) {
    return this.adminService.upgradeSeller(upgradeSellerDto);
  }

  @Get('users')
  @ApiOperation({ 
    summary: '[ADMIN] Xem danh sách tất cả users', 
    description: 'Quản lý user với phân trang' 
  })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 20 })
  @ApiResponse({ status: 200, description: 'List of users with pagination' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin only' })
  getAllUsers(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20',
  ) {
    return this.adminService.getAllUsers(parseInt(page), parseInt(limit));
  }

  @Get('users/:id')
  @ApiOperation({ 
    summary: '[ADMIN] Xem chi tiết user', 
    description: 'Admin xem thông tin chi tiết của 1 user' 
  })
  @ApiResponse({ status: 200, description: 'User details' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin only' })
  @ApiResponse({ status: 404, description: 'User not found' })
  getUserById(@Param('id') id: string) {
    return this.adminService.getUserById(id);
  }

  @Delete('users/:id')
  @ApiOperation({ 
    summary: '[ADMIN] Xóa user', 
    description: 'Admin xóa user. Không thể xóa admin hoặc user có sản phẩm đang đấu giá' 
  })
  @ApiResponse({ status: 200, description: 'User deleted successfully' })
  @ApiResponse({ status: 400, description: 'Cannot delete admin or user with active products' })
  @ApiResponse({ status: 404, description: 'User not found' })
  deleteUser(@Param('id') id: string) {
    return this.adminService.deleteUser(id);
  }

  @Post('users/:id/reset-password')
  @ApiOperation({ 
    summary: '[ADMIN] Reset mật khẩu user', 
    description: 'Admin reset mật khẩu user và gửi mật khẩu mới qua email' 
  })
  @ApiResponse({ status: 200, description: 'Password reset and sent to user email' })
  @ApiResponse({ status: 400, description: 'Cannot reset admin password or Google user' })
  @ApiResponse({ status: 404, description: 'User not found' })
  resetUserPassword(@Param('id') id: string) {
    return this.adminService.resetUserPassword(id);
  }

  @Get('config')
  @ApiOperation({ 
    summary: '[ADMIN] Xem cấu hình hệ thống', 
    description: 'Xem các tham số cấu hình (thời gian nổi bật sản phẩm mới, auto-extend, v.v.)' 
  })
  @ApiResponse({ status: 200, description: 'System configuration' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin only' })
  getConfig() {
    return this.adminService.getConfig();
  }

  @Patch('config')
  @ApiOperation({ 
    summary: '[ADMIN] Cập nhật cấu hình hệ thống', 
    description: 'Cập nhật các tham số: newProductHighlightMinutes, autoExtendThresholdMinutes, autoExtendDurationMinutes' 
  })
  @ApiResponse({ status: 200, description: 'Config updated successfully' })
  @ApiResponse({ status: 400, description: 'Invalid config values' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin only' })
  updateConfig(@Body() updateConfigDto: UpdateConfigDto) {
    return this.adminService.updateConfig(updateConfigDto);
  }

  @Get('seller-upgrade-requests')
  @ApiOperation({ 
    summary: '[ADMIN] Xem danh sách yêu cầu nâng cấp seller', 
    description: 'Lấy danh sách users đang chờ admin duyệt nâng cấp seller' 
  })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 20 })
  @ApiResponse({ status: 200, description: 'List of pending seller upgrade requests' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin only' })
  getPendingSellerRequests(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20',
  ) {
    return this.adminService.getPendingSellerRequests(parseInt(page), parseInt(limit));
  }

  @Get('dashboard')
  @ApiOperation({ 
    summary: '[ADMIN] Dashboard statistics', 
    description: 'Lấy thống kê tổng quan cho admin dashboard: user growth, product growth, revenue, category distribution' 
  })
  @ApiResponse({ status: 200, description: 'Dashboard statistics' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin only' })
  getDashboardStats() {
    return this.adminService.getDashboardStats();
  }
}
