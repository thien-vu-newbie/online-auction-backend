import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Order, OrderDocument } from './schemas/order.schema';
import { Product, ProductDocument } from '../products/schemas/product.schema';
import { User, UserDocument } from '../users/schemas/user.schema';
import { Rating, RatingDocument } from '../ratings/schemas/rating.schema';
import { PaymentsService } from '../payments/payments.service';
import { MailService } from '../common/services/mail.service';
import { UpdateShippingAddressDto } from './dto/update-shipping-address.dto';
import { ConfirmShippedDto } from './dto/confirm-shipped.dto';
import { CancelOrderDto } from './dto/cancel-order.dto';

@Injectable()
export class OrdersService {
  constructor(
    @InjectModel(Order.name) private orderModel: Model<OrderDocument>,
    @InjectModel(Product.name) private productModel: Model<ProductDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Rating.name) private ratingModel: Model<RatingDocument>,
    private paymentsService: PaymentsService,
    private mailService: MailService,
  ) {}

  /**
   * Tạo Payment Intent cho buyer thanh toán
   * Chỉ buyer (winner) mới được tạo payment intent
   */
  async createPaymentIntent(productId: string, userId: string) {
    const product = await this.productModel
      .findById(productId)
      .populate('sellerId', 'email fullName')
      .populate('currentWinnerId', 'email fullName');

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    // Kiểm tra product đã kết thúc và có winner
    if (product.status !== 'sold' && product.status !== 'expired') {
      throw new BadRequestException('Auction is not finished yet');
    }

    if (!product.currentWinnerId) {
      throw new BadRequestException('No winner for this auction');
    }

    // Kiểm tra user là winner
    if (product.currentWinnerId._id.toString() !== userId) {
      throw new ForbiddenException('Only the winner can make payment');
    }

    // Kiểm tra đã có order chưa
    let order = await this.orderModel.findOne({ productId: new Types.ObjectId(productId) });

    if (order) {
      // Nếu đã cancelled thì không cho tạo payment
      if (order.status === 'cancelled') {
        throw new BadRequestException('This order has been cancelled by seller. You cannot make payment.');
      }

      // Nếu đã paid rồi thì không cho tạo mới
      if (order.status !== 'pending_payment') {
        throw new BadRequestException(`Order is already in ${order.status} status`);
      }

      // Nếu đã có paymentIntentId thì trả về luôn
      if (order.paymentIntentId) {
        const paymentIntent = await this.paymentsService.getPaymentIntent(order.paymentIntentId);
        return {
          clientSecret: paymentIntent.client_secret,
          orderId: order._id,
          amount: product.currentPrice,
        };
      }
    } else {
      // Tạo order mới
      order = new this.orderModel({
        productId: product._id,
        sellerId: product.sellerId._id,
        buyerId: product.currentWinnerId._id,
        finalPrice: product.currentPrice,
        status: 'pending_payment',
      });
      await order.save();
    }

    // Tạo Payment Intent với Stripe
    const paymentIntent = await this.paymentsService.createPaymentIntent(
      product.currentPrice,
      {
        orderId: order._id.toString(),
        productId: product._id.toString(),
        productName: product.name,
        buyerId: userId,
        sellerId: product.sellerId._id.toString(),
      }
    );

    // Lưu paymentIntentId vào order
    order.paymentIntentId = paymentIntent.id;
    await order.save();

    return {
      clientSecret: paymentIntent.client_secret,
      orderId: order._id,
      amount: product.currentPrice,
    };
  }

  /**
   * Webhook từ Stripe confirm payment thành công
   * Cập nhật order status = 'paid'
   */
  async confirmPaymentSuccess(paymentIntentId: string) {
    const order = await this.orderModel
      .findOne({ paymentIntentId });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    order.status = 'paid';
    order.paidAt = new Date();
    await order.save();

    return order;
  }

  /**
   * Manual confirm payment
   * Buyer gọi sau khi thanh toán thành công qua Stripe frontend
   */
  async manualConfirmPayment(orderId: string, userId: string) {
    const order = await this.orderModel
      .findById(orderId)
      .populate('productId', 'name')
      .populate('sellerId', 'email fullName')
      .populate('buyerId', 'email fullName');

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // Chỉ buyer mới được confirm
    if (order.buyerId._id.toString() !== userId) {
      throw new ForbiddenException('Only buyer can confirm payment');
    }

    // Kiểm tra đã confirm chưa
    if (order.status !== 'pending_payment') {
      throw new BadRequestException(`Order is already ${order.status}`);
    }

    if (!order.paymentIntentId) {
      throw new BadRequestException('Payment intent not found');
    }

    // Verify payment status từ Stripe
    const paymentIntent = await this.paymentsService.getPaymentIntent(order.paymentIntentId);

    if (paymentIntent.status !== 'succeeded') {
      throw new BadRequestException(`Payment status is ${paymentIntent.status}, not succeeded`);
    }

    // Confirm payment
    return this.confirmPaymentSuccess(order.paymentIntentId);
  }

  /**
   * Buyer gửi địa chỉ giao hàng
   */
  async updateShippingAddress(orderId: string, updateShippingAddressDto: UpdateShippingAddressDto, userId: string) {
    const order = await this.orderModel.findById(orderId);

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // Chỉ buyer mới được cập nhật địa chỉ
    if (order.buyerId.toString() !== userId) {
      throw new ForbiddenException('Only buyer can update shipping address');
    }

    // Chỉ cho phép cập nhật khi đã paid
    if (order.status !== 'paid') {
      throw new BadRequestException('Order must be paid before updating shipping address');
    }

    order.shippingAddress = updateShippingAddressDto;
    await order.save();

    return {
      message: 'Shipping address updated successfully',
      order,
    };
  }

  /**
   * Seller xác nhận đã gửi hàng và cập nhật tracking number
   */
  async confirmShipped(orderId: string, confirmShippedDto: ConfirmShippedDto, userId: string) {
    const order = await this.orderModel.findById(orderId);

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // Chỉ seller mới được confirm shipped
    if (order.sellerId.toString() !== userId) {
      throw new ForbiddenException('Only seller can confirm shipped');
    }

    // Phải có địa chỉ giao hàng và đã paid
    if (order.status !== 'paid') {
      throw new BadRequestException('Order must be paid before shipping');
    }

    if (!order.shippingAddress) {
      throw new BadRequestException('Buyer must provide shipping address first');
    }

    order.status = 'shipped';
    order.trackingNumber = confirmShippedDto.trackingNumber;
    order.shippedAt = new Date();
    await order.save();

    return {
      message: 'Order shipped successfully',
      order,
    };
  }

  /**
   * Buyer xác nhận đã nhận hàng
   */
  async confirmReceived(orderId: string, userId: string) {
    const order = await this.orderModel.findById(orderId);

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // Chỉ buyer mới được confirm received
    if (order.buyerId.toString() !== userId) {
      throw new ForbiddenException('Only buyer can confirm received');
    }

    if (order.status !== 'shipped') {
      throw new BadRequestException('Order must be shipped before confirming received');
    }

    order.status = 'completed';
    order.receivedAt = new Date();
    await order.save();

    return {
      message: 'Order completed successfully',
      order,
    };
  }

  /**
   * Seller cancel giao dịch
   * Chỉ cho phép cancel khi buyer chưa thanh toán (pending_payment)
   * Tự động đánh giá -1 buyer khi cancel
   */
  async cancelOrder(orderId: string, cancelOrderDto: CancelOrderDto, userId: string) {
    const order = await this.orderModel
      .findById(orderId)
      .populate('productId', 'endTime');

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // Chỉ seller mới được cancel
    if (order.sellerId.toString() !== userId) {
      throw new ForbiddenException('Only seller can cancel order');
    }

    // Chỉ cho phép cancel khi status = pending_payment
    if (order.status !== 'pending_payment') {
      throw new BadRequestException(`Cannot cancel order with status ${order.status}. Only pending_payment orders can be cancelled.`);
    }

    // Kiểm tra 24h sau khi đấu giá kết thúc
    const product = order.productId as any;
    const auctionEndTime = new Date(product.endTime);
    const now = new Date();
    const hoursSinceEnd = (now.getTime() - auctionEndTime.getTime()) / (1000 * 60 * 60);

    if (hoursSinceEnd > 24) {
      throw new BadRequestException('Cannot cancel order after 24 hours from auction end time.');
    }

    // Tự động đánh giá -1 buyer
    await this.createCancellationRating(
      order.productId.toString(),
      order.sellerId.toString(),
      order.buyerId.toString(),
      cancelOrderDto.reason || 'Người thắng không thanh toán'
    );

    order.status = 'cancelled';
    order.cancelledBy = new Types.ObjectId(userId);
    order.cancelReason = cancelOrderDto.reason;
    order.cancelledAt = new Date();
    await order.save();

    return {
      message: 'Order cancelled successfully',
      order,
    };
  }

  /**
   * Tạo rating -1 khi seller cancel do buyer không thanh toán
   */
  private async createCancellationRating(
    productId: string,
    sellerId: string,
    buyerId: string,
    reason: string
  ) {
    // Kiểm tra đã rating chưa
    const existingRating = await this.ratingModel.findOne({
      fromUserId: new Types.ObjectId(sellerId),
      toUserId: new Types.ObjectId(buyerId),
      productId: new Types.ObjectId(productId),
    });

    if (existingRating) {
      return; // Đã có rating rồi thì skip
    }

    // Tạo rating -1
    const rating = new this.ratingModel({
      fromUserId: new Types.ObjectId(sellerId),
      toUserId: new Types.ObjectId(buyerId),
      productId: new Types.ObjectId(productId),
      rating: -1,
      comment: reason,
      isSellerToWinner: true,
      isCancelledTransaction: true,
    });

    await rating.save();

    // Cập nhật rating counts của buyer
    await this.updateUserRatingCounts(buyerId);
  }

  /**
   * Cập nhật rating counts của user
   */
  private async updateUserRatingCounts(userId: string) {
    const result = await this.ratingModel.aggregate([
      { $match: { toUserId: new Types.ObjectId(userId) } },
      {
        $group: {
          _id: null,
          positive: { $sum: { $cond: [{ $eq: ['$rating', 1] }, 1, 0] } },
          negative: { $sum: { $cond: [{ $eq: ['$rating', -1] }, 1, 0] } },
        },
      },
    ]);

    const counts = result[0] || { positive: 0, negative: 0 };

    await this.userModel.findByIdAndUpdate(userId, {
      ratingPositive: counts.positive,
      ratingNegative: counts.negative,
    });
  }

  /**
   * Lấy danh sách đơn hàng của user (buyer hoặc seller)
   */
  async getMyOrders(userId: string, query: any) {
    const { page = 1, limit = 10, role } = query;
    const skip = (page - 1) * limit;

    const filter: any = {};

    if (role === 'buyer') {
      filter.buyerId = new Types.ObjectId(userId);
    } else if (role === 'seller') {
      filter.sellerId = new Types.ObjectId(userId);
    } else {
      // Lấy cả buyer và seller
      filter.$or = [
        { buyerId: new Types.ObjectId(userId) },
        { sellerId: new Types.ObjectId(userId) },
      ];
    }

    const [orders, total] = await Promise.all([
      this.orderModel
        .find(filter)
        .populate('productId', 'name images currentPrice')
        .populate('sellerId', 'fullName email')
        .populate('buyerId', 'fullName email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      this.orderModel.countDocuments(filter),
    ]);

    return {
      orders,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Lấy chi tiết đơn hàng
   * Chỉ buyer hoặc seller mới xem được
   */
  async getOrderById(orderId: string, userId: string) {
    const order = await this.orderModel
      .findById(orderId)
      .populate('productId', 'name images description currentPrice')
      .populate('sellerId', 'fullName email phone')
      .populate('buyerId', 'fullName email phone')
      .lean();

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // Kiểm tra quyền truy cập
    const isBuyer = order.buyerId._id.toString() === userId;
    const isSeller = order.sellerId._id.toString() === userId;

    if (!isBuyer && !isSeller) {
      throw new ForbiddenException('You do not have permission to view this order');
    }

    return {
      order,
      role: isBuyer ? 'buyer' : 'seller',
    };
  }
}
