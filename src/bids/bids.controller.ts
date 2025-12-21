import { Controller, Post, Get, Body, Param, UseGuards, Req, Delete, Patch } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { BidsService } from './bids.service';
import { PlaceAutoBidDto } from './dto/place-auto-bid.dto';
import { UpdateAutoBidDto } from './dto/update-auto-bid.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Bids')
@Controller('bids')
export class BidsController {
  constructor(
    private readonly bidsService: BidsService,
  ) {}

  // Regular placeBid endpoint has been removed - only auto-bid is supported now
  // All bidding must go through POST /products/:productId/auto-bid

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

  @Get('products/:productId/seller-history')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ 
    summary: '[SELLER] Xem lịch sử đấu giá (full data)', 
    description: 'Seller xem bid history với đầy đủ thông tin để reject bidder' 
  })
  @ApiResponse({ status: 200, description: 'Bid history with full bidder info' })
  @ApiResponse({ status: 403, description: 'Forbidden - Not the seller' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  getSellerBidHistory(@Param('productId') productId: string, @Req() req) {
    const sellerId = req.user.userId || req.user.sub;
    return this.bidsService.getSellerBidHistory(productId, sellerId);
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

  @Patch('products/:productId/auto-bid')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ 
    summary: '[BIDDER/SELLER] Cập nhật auto bid', 
    description: 'Chỉnh sửa giá tối đa của auto bid hiện tại' 
  })
  @ApiResponse({ status: 200, description: 'Auto bid updated successfully' })
  @ApiResponse({ status: 400, description: 'Invalid max bid amount or auction ended' })
  @ApiResponse({ status: 404, description: 'Auto bid config not found' })
  updateAutoBid(
    @Param('productId') productId: string,
    @Body() updateAutoBidDto: UpdateAutoBidDto,
    @Req() req,
  ) {
    const userId = req.user.userId || req.user.sub;
    return this.bidsService.updateAutoBid(productId, updateAutoBidDto, userId);
  }

  @Patch('products/:productId/auto-bid/toggle')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ 
    summary: '[BIDDER/SELLER] Bật/Tắt auto bid', 
    description: 'Toggle trạng thái active của auto bid config (enable/disable)' 
  })
  @ApiResponse({ status: 200, description: 'Auto bid toggled successfully' })
  @ApiResponse({ status: 404, description: 'Auto bid config not found' })
  toggleAutoBid(@Param('productId') productId: string, @Req() req) {
    const userId = req.user.userId || req.user.sub;
    return this.bidsService.toggleAutoBid(productId, userId);
  }
}
