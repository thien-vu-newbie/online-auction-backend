import { Controller, Post, Get, Body, Param, UseGuards, Req, Delete } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { BidsService } from './bids.service';
import { PlaceBidDto } from './dto/place-bid.dto';
import { PlaceAutoBidDto } from './dto/place-auto-bid.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Bids')
@Controller('bids')
export class BidsController {
  constructor(
    private readonly bidsService: BidsService,
  ) {}

  @Post('products/:productId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ 
    summary: '[BIDDER/SELLER] Đặt giá cho sản phẩm', 
    description: 'Ra giá. Kiểm tra rating >80% nếu cần, seller không bid được sản phẩm của mình' 
  })
  @ApiResponse({ status: 201, description: 'Bid placed successfully' })
  @ApiResponse({ status: 400, description: 'Invalid bid amount or auction ended' })
  @ApiResponse({ status: 403, description: 'Forbidden - Rating < 80% or rejected or self-bid' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  placeBid(
    @Param('productId') productId: string,
    @Body() placeBidDto: PlaceBidDto,
    @Req() req,
  ) {
    const bidderId = req.user.userId || req.user.sub;
    return this.bidsService.placeBid(productId, placeBidDto, bidderId);
  }

  @Get('products/:productId/history')
  @ApiOperation({ 
    summary: '[PUBLIC] Xem lịch sử đấu giá', 
    description: 'Lịch sử bid với tên bidder được mask (****Khoa)' 
  })
  @ApiResponse({ status: 200, description: 'Bid history with masked names' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  getBidHistory(@Param('productId') productId: string) {
    return this.bidsService.getBidHistory(productId);
  }

  @Delete('products/:productId/reject/:bidderId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ 
    summary: '[SELLER] Từ chối bidder', 
    description: 'Seller từ chối bidder, nếu là người thắng thì chuyển cho người thứ 2' 
  })
  @ApiResponse({ status: 200, description: 'Bidder rejected successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - Not the seller' })
  @ApiResponse({ status: 404, description: 'Product or bidder not found' })
  rejectBidder(
    @Param('productId') productId: string,
    @Param('bidderId') bidderId: string,
    @Req() req,
  ) {
    const sellerId = req.user.userId || req.user.sub;
    return this.bidsService.rejectBidder(productId, bidderId, sellerId);
  }

  @Post('products/:productId/auto-bid')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ 
    summary: '[BIDDER/SELLER] Đặt auto bid (đấu giá tự động)', 
    description: 'Bidder đặt giá tối đa, hệ thống tự động bid vừa đủ để thắng' 
  })
  @ApiResponse({ status: 201, description: 'Auto bid configured successfully' })
  @ApiResponse({ status: 400, description: 'Invalid max bid amount or auction ended' })
  @ApiResponse({ status: 403, description: 'Forbidden - Rating < 80% or rejected or self-bid' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  placeAutoBid(
    @Param('productId') productId: string,
    @Body() placeAutoBidDto: PlaceAutoBidDto,
    @Req() req,
  ) {
    const bidderId = req.user.userId || req.user.sub;
    return this.bidsService.placeAutoBid(productId, placeAutoBidDto, bidderId);
  }

  @Get('products/:productId/auto-bid/my-config')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ 
    summary: '[BIDDER/SELLER] Xem cấu hình auto bid của mình', 
    description: 'Lấy thông tin max bid amount đã đặt' 
  })
  @ApiResponse({ status: 200, description: 'Auto bid config' })
  getMyAutoBidConfig(@Param('productId') productId: string, @Req() req) {
    const userId = req.user.userId || req.user.sub;
    return this.bidsService.getMyAutoBidConfig(productId, userId);
  }

  @Delete('products/:productId/auto-bid')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ 
    summary: '[BIDDER/SELLER] Hủy auto bid', 
    description: 'Dừng đấu giá tự động cho sản phẩm' 
  })
  @ApiResponse({ status: 200, description: 'Auto bid cancelled successfully' })
  @ApiResponse({ status: 404, description: 'Auto bid config not found' })
  cancelAutoBid(@Param('productId') productId: string, @Req() req) {
    const userId = req.user.userId || req.user.sub;
    return this.bidsService.cancelAutoBid(productId, userId);
  }
}
