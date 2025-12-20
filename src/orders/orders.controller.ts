import { Controller, Post, Get, Patch, Body, Param, Query, UseGuards, Req, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { OrdersService } from './orders.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UpdateShippingAddressDto } from './dto/update-shipping-address.dto';
import { ConfirmShippedDto } from './dto/confirm-shipped.dto';
import { CancelOrderDto } from './dto/cancel-order.dto';

@ApiTags('Orders')
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post('products/:productId/create-payment-intent')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ 
    summary: '[BUYER] Tạo Payment Intent để thanh toán', 
    description: 'Winner tạo payment intent từ Stripe, nhận client_secret để thanh toán trên frontend' 
  })
  @ApiResponse({ status: 201, description: 'Payment intent created successfully' })
  @ApiResponse({ status: 403, description: 'Only winner can make payment' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  async createPaymentIntent(@Param('productId') productId: string, @Req() req) {
    const userId = req.user.userId || req.user.sub;
    return this.ordersService.createPaymentIntent(productId, userId);
  }

  @Post(':orderId/confirm-payment')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: '[BUYER] Xác nhận thanh toán', 
    description: 'Buyer gọi sau khi thanh toán thành công qua Stripe frontend' 
  })
  @ApiResponse({ status: 200, description: 'Payment confirmed successfully' })
  @ApiResponse({ status: 400, description: 'Payment not completed yet or order not found' })
  @ApiResponse({ status: 403, description: 'Only buyer can confirm payment' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  async confirmPayment(@Param('orderId') orderId: string, @Req() req) {
    const userId = req.user.userId || req.user.sub;
    return this.ordersService.manualConfirmPayment(orderId, userId);
  }

  @Get('my-orders')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ 
    summary: '[USER] Xem danh sách đơn hàng của mình', 
    description: 'Lấy danh sách đơn hàng (buyer hoặc seller). Filter theo role: buyer/seller' 
  })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 10 })
  @ApiQuery({ name: 'role', required: false, enum: ['buyer', 'seller'], description: 'Filter by role' })
  @ApiResponse({ status: 200, description: 'Orders list retrieved successfully' })
  async getMyOrders(@Req() req, @Query() query) {
    const userId = req.user.userId || req.user.sub;
    return this.ordersService.getMyOrders(userId, query);
  }

  @Get(':orderId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ 
    summary: '[BUYER/SELLER] Xem chi tiết đơn hàng', 
    description: 'Chỉ buyer hoặc seller của đơn hàng mới xem được' 
  })
  @ApiResponse({ status: 200, description: 'Order details retrieved successfully' })
  @ApiResponse({ status: 403, description: 'No permission to view this order' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  async getOrderById(@Param('orderId') orderId: string, @Req() req) {
    const userId = req.user.userId || req.user.sub;
    return this.ordersService.getOrderById(orderId, userId);
  }

  @Patch(':orderId/shipping-address')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ 
    summary: '[BUYER] Gửi địa chỉ giao hàng', 
    description: 'Buyer gửi địa chỉ sau khi thanh toán thành công' 
  })
  @ApiResponse({ status: 200, description: 'Shipping address updated successfully' })
  @ApiResponse({ status: 400, description: 'Order must be paid first' })
  @ApiResponse({ status: 403, description: 'Only buyer can update shipping address' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  async updateShippingAddress(
    @Param('orderId') orderId: string,
    @Body() updateShippingAddressDto: UpdateShippingAddressDto,
    @Req() req,
  ) {
    const userId = req.user.userId || req.user.sub;
    return this.ordersService.updateShippingAddress(orderId, updateShippingAddressDto, userId);
  }

  @Patch(':orderId/confirm-shipped')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ 
    summary: '[SELLER] Xác nhận đã gửi hàng', 
    description: 'Seller cập nhật mã vận đơn và xác nhận đã gửi hàng' 
  })
  @ApiResponse({ status: 200, description: 'Order shipped successfully' })
  @ApiResponse({ status: 400, description: 'Order must be paid and have shipping address' })
  @ApiResponse({ status: 403, description: 'Only seller can confirm shipped' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  async confirmShipped(
    @Param('orderId') orderId: string,
    @Body() confirmShippedDto: ConfirmShippedDto,
    @Req() req,
  ) {
    const userId = req.user.userId || req.user.sub;
    return this.ordersService.confirmShipped(orderId, confirmShippedDto, userId);
  }

  @Patch(':orderId/confirm-received')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: '[BUYER] Xác nhận đã nhận hàng', 
    description: 'Buyer xác nhận đã nhận hàng, hoàn tất giao dịch' 
  })
  @ApiResponse({ status: 200, description: 'Order completed successfully' })
  @ApiResponse({ status: 400, description: 'Order must be shipped first' })
  @ApiResponse({ status: 403, description: 'Only buyer can confirm received' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  async confirmReceived(@Param('orderId') orderId: string, @Req() req) {
    const userId = req.user.userId || req.user.sub;
    return this.ordersService.confirmReceived(orderId, userId);
  }

  @Post(':orderId/cancel')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ 
    summary: '[SELLER] Hủy giao dịch', 
    description: 'Seller hủy giao dịch khi buyer chưa thanh toán (status: pending_payment). Tự động đánh giá -1 cho buyer.' 
  })
  @ApiResponse({ status: 201, description: 'Order cancelled successfully' })
  @ApiResponse({ status: 400, description: 'Can only cancel pending_payment orders' })
  @ApiResponse({ status: 403, description: 'Only seller can cancel order' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  async cancelOrder(
    @Param('orderId') orderId: string,
    @Body() cancelOrderDto: CancelOrderDto,
    @Req() req,
  ) {
    const userId = req.user.userId || req.user.sub;
    return this.ordersService.cancelOrder(orderId, cancelOrderDto, userId);
  }
}
