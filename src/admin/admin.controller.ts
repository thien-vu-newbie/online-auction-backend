import { Controller, Post, Body, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { UpgradeSellerDto } from './dto/upgrade-seller.dto';
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
    summary: '[ADMIN] Nâng cấp user lên seller', 
    description: 'Mục 4.1 - Admin cấp quyền seller cho user với thời hạn' 
  })
  @ApiResponse({ status: 200, description: 'User upgraded to seller successfully' })
  @ApiResponse({ status: 400, description: 'Cannot upgrade admin or invalid user' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin only' })
  @ApiResponse({ status: 404, description: 'User not found' })
  upgradeSeller(@Body() upgradeSellerDto: UpgradeSellerDto) {
    return this.adminService.upgradeSeller(upgradeSellerDto);
  }

  @Get('users')
  @ApiOperation({ 
    summary: '[ADMIN] Xem danh sách tất cả users', 
    description: 'Mục 4.3 - Quản lý user với phân trang' 
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
}
