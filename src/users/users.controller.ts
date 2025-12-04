import { Controller, Get, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UsersService } from './users.service';

@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: '[USER] Xem profile', description: 'User xem thông tin cá nhân' })
  @ApiResponse({ status: 200, description: 'User profile' })
  getProfile(@Req() req) {
    return {
      message: 'This is a protected route',
      user: req.user,
    };
  }

  @Get('my-participating-products')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ 
    summary: '[BIDDER/SELLER] Xem danh sách sản phẩm đang tham gia đấu giá', 
    description: 'Bidder xem sản phẩm mình đã bid và đang active' 
  })
  @ApiResponse({ status: 200, description: 'List of participating products' })
  getMyParticipatingProducts(@Req() req) {
    const userId = req.user.userId || req.user.sub;
    return this.usersService.getMyParticipatingProducts(userId);
  }

  @Get('my-won-products')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ 
    summary: '[BIDDER/SELLER] Xem danh sách sản phẩm đã thắng', 
    description: 'Bidder xem sản phẩm mình thắng đấu giá (giá cao nhất)' 
  })
  @ApiResponse({ status: 200, description: 'List of won products' })
  getMyWonProducts(@Req() req) {
    const userId = req.user.userId || req.user.sub;
    return this.usersService.getMyWonProducts(userId);
  }
}
