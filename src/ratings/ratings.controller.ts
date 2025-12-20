import { Controller, Post, Get, Patch, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { RatingsService } from './ratings.service';
import { CreateRatingDto } from './dto/create-rating.dto';
import { UpdateRatingDto } from './dto/update-rating.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Ratings')
@Controller('ratings')
export class RatingsController {
  constructor(private readonly ratingsService: RatingsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ 
    summary: '[BIDDER/SELLER] Đánh giá người dùng', 
    description: 'Seller đánh giá winner hoặc winner đánh giá seller sau khi đấu giá kết thúc (+1 hoặc -1)' 
  })
  @ApiResponse({ status: 201, description: 'Rating created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid request or already rated' })
  @ApiResponse({ status: 403, description: 'Forbidden - Can only rate seller or winner' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  createRating(@Body() createRatingDto: CreateRatingDto, @Req() req) {
    const userId = req.user.userId || req.user.sub;
    return this.ratingsService.createRating(createRatingDto, userId);
  }

  @Patch(':ratingId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ 
    summary: '[BIDDER/SELLER] Cập nhật đánh giá', 
    description: 'Thay đổi rating và comment của đánh giá đã tạo' 
  })
  @ApiResponse({ status: 200, description: 'Rating updated successfully' })
  @ApiResponse({ status: 400, description: 'Cannot update rating from cancelled transaction' })
  @ApiResponse({ status: 403, description: 'Forbidden - Can only update your own rating' })
  @ApiResponse({ status: 404, description: 'Rating not found' })
  updateRating(
    @Param('ratingId') ratingId: string,
    @Body() updateRatingDto: UpdateRatingDto,
    @Req() req,
  ) {
    const userId = req.user.userId || req.user.sub;
    return this.ratingsService.updateRating(ratingId, updateRatingDto, userId);
  }

  @Get('my-received')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ 
    summary: '[USER] Xem các đánh giá mình nhận được', 
    description: 'Xem tất cả đánh giá người khác đã đánh giá mình (với phân trang)' 
  })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 10 })
  @ApiResponse({ status: 200, description: 'List of received ratings with summary' })
  getMyReceivedRatings(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
    @Req() req,
  ) {
    const userId = req.user.userId || req.user.sub;
    return this.ratingsService.getMyReceivedRatings(userId, parseInt(page), parseInt(limit));
  }

  @Get('my-given')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ 
    summary: '[USER] Xem các đánh giá mình đã đưa ra', 
    description: 'Xem tất cả đánh giá mình đã đánh giá người khác (với phân trang)' 
  })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 10 })
  @ApiResponse({ status: 200, description: 'List of given ratings' })
  getMyGivenRatings(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
    @Req() req,
  ) {
    const userId = req.user.userId || req.user.sub;
    return this.ratingsService.getMyGivenRatings(userId, parseInt(page), parseInt(limit));
  }

  @Get('products/:productId')
  @ApiOperation({ 
    summary: '[PUBLIC] Xem ratings của sản phẩm', 
    description: 'Xem tất cả đánh giá liên quan đến sản phẩm (seller vs winner)' 
  })
  @ApiResponse({ status: 200, description: 'Ratings for product' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  getRatingsForProduct(@Param('productId') productId: string) {
    return this.ratingsService.getRatingsForProduct(productId);
  }
}
