import { Controller, Post, Delete, Get, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { WatchlistService } from './watchlist.service';
import { AddToWatchlistDto } from './dto/add-to-watchlist.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Watchlist')
@Controller('watchlist')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class WatchlistController {
  constructor(private readonly watchlistService: WatchlistService) {}

  @Post()
  @ApiOperation({ 
    summary: 'Thêm sản phẩm vào danh sách yêu thích', 
    description: 'Bidder lưu sản phẩm để theo dõi' 
  })
  @ApiResponse({ status: 201, description: 'Product added to watchlist' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  @ApiResponse({ status: 409, description: 'Product already in watchlist' })
  addToWatchlist(@Req() req, @Body() addToWatchlistDto: AddToWatchlistDto) {
    return this.watchlistService.addToWatchlist(req.user.userId, addToWatchlistDto.productId);
  }

  @Delete(':productId')
  @ApiOperation({ 
    summary: 'Xóa sản phẩm khỏi danh sách yêu thích', 
    description: 'Bỏ theo dõi sản phẩm' 
  })
  @ApiResponse({ status: 200, description: 'Product removed from watchlist' })
  @ApiResponse({ status: 404, description: 'Product not found in watchlist' })
  removeFromWatchlist(@Req() req, @Param('productId') productId: string) {
    return this.watchlistService.removeFromWatchlist(req.user.userId, productId);
  }

  @Get('my-list')
  @ApiOperation({ 
    summary: 'Xem danh sách sản phẩm yêu thích của tôi', 
    description: 'Lấy danh sách sản phẩm đang theo dõi' 
  })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 10 })
  @ApiResponse({ status: 200, description: 'Watchlist retrieved successfully' })
  getMyWatchlist(
    @Req() req,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
  ) {
    return this.watchlistService.getMyWatchlist(req.user.userId, parseInt(page), parseInt(limit));
  }

  @Get('check/:productId')
  @ApiOperation({ 
    summary: 'Kiểm tra sản phẩm có trong watchlist không', 
    description: 'Trả về true/false' 
  })
  @ApiResponse({ status: 200, description: 'Check result' })
  async checkInWatchlist(@Req() req, @Param('productId') productId: string) {
    const isInWatchlist = await this.watchlistService.isInWatchlist(req.user.userId, productId);
    return { productId, isInWatchlist };
  }
}
