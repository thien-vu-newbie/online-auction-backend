import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Watchlist, WatchlistDocument } from './schemas/watchlist.schema';
import { Product, ProductDocument } from '../products/schemas/product.schema';

@Injectable()
export class WatchlistService {
  constructor(
    @InjectModel(Watchlist.name) private watchlistModel: Model<WatchlistDocument>,
    @InjectModel(Product.name) private productModel: Model<ProductDocument>,
  ) {}

  async addToWatchlist(userId: string, productId: string) {
    // Validate product exists
    const product = await this.productModel.findById(productId);
    if (!product) {
      throw new NotFoundException('Product not found');
    }

    // Check if already in watchlist
    const existing = await this.watchlistModel.findOne({
      userId: new Types.ObjectId(userId),
      productId: new Types.ObjectId(productId),
    });

    if (existing) {
      throw new ConflictException('Product already in watchlist');
    }

    // Add to watchlist
    const watchlistItem = await this.watchlistModel.create({
      userId: new Types.ObjectId(userId),
      productId: new Types.ObjectId(productId),
    });

    return {
      message: 'Product added to watchlist',
      watchlistItem,
    };
  }

  async removeFromWatchlist(userId: string, productId: string) {
    const result = await this.watchlistModel.findOneAndDelete({
      userId: new Types.ObjectId(userId),
      productId: new Types.ObjectId(productId),
    });

    if (!result) {
      throw new NotFoundException('Product not found in watchlist');
    }

    return {
      message: 'Product removed from watchlist',
    };
  }

  async getMyWatchlist(userId: string, page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      this.watchlistModel
        .find({ userId: new Types.ObjectId(userId) })
        .populate({
          path: 'productId',
          populate: [
            { path: 'sellerId', select: 'fullName ratingPositive ratingNegative' },
            { path: 'currentWinnerId', select: 'fullName' },
            { path: 'categoryId', select: 'name' },
          ],
        })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      this.watchlistModel.countDocuments({ userId: new Types.ObjectId(userId) }),
    ]);

    // Filter out items where product was deleted
    const validItems = items.filter(item => item.productId);

    return {
      items: validItems.map(item => ({
        _id: item._id,
        product: item.productId,
        addedAt: (item as any).createdAt,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async isInWatchlist(userId: string, productId: string): Promise<boolean> {
    const item = await this.watchlistModel.findOne({
      userId: new Types.ObjectId(userId),
      productId: new Types.ObjectId(productId),
    });
    return !!item;
  }
}
