import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Product, ProductDocument } from '../products/schemas/product.schema';
import { Bid, BidDocument } from '../bids/schemas/bid.schema';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(Product.name) private productModel: Model<ProductDocument>,
    @InjectModel(Bid.name) private bidModel: Model<BidDocument>,
  ) {}

  async getMyParticipatingProducts(userId: string) {
    // Lấy danh sách productId mà user đã bid
    const productIds = await this.bidModel
      .distinct('productId', { 
        bidderId: new Types.ObjectId(userId),
        isRejected: false,
      });

    // Lấy chi tiết các sản phẩm đang active
    const products = await this.productModel
      .find({
        _id: { $in: productIds },
        status: 'active',
        endTime: { $gt: new Date() },
      })
      .populate('categoryId', 'name')
      .populate('currentWinnerId', 'fullName')
      .sort({ endTime: 1 })
      .lean();

    // Thêm thông tin user có đang thắng không
    const result = products.map(product => ({
      ...product,
      isWinning: product.currentWinnerId?._id?.toString() === userId,
    }));

    return {
      total: result.length,
      products: result,
    };
  }

  async getMyWonProducts(userId: string) {
    // Lấy sản phẩm đã thắng (currentWinnerId = userId và status = sold)
    const products = await this.productModel
      .find({
        currentWinnerId: new Types.ObjectId(userId),
        status: 'sold',
      })
      .populate('categoryId', 'name')
      .populate('sellerId', 'fullName email')
      .sort({ endTime: -1 })
      .lean();

    return {
      total: products.length,
      products,
    };
  }
}
