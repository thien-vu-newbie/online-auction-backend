import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Rating, RatingDocument } from './schemas/rating.schema';
import { Product, ProductDocument } from '../products/schemas/product.schema';
import { User, UserDocument } from '../users/schemas/user.schema';
import { CreateRatingDto } from './dto/create-rating.dto';
import { UpdateRatingDto } from './dto/update-rating.dto';

@Injectable()
export class RatingsService {
  constructor(
    @InjectModel(Rating.name) private ratingModel: Model<RatingDocument>,
    @InjectModel(Product.name) private productModel: Model<ProductDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}

  async createRating(createRatingDto: CreateRatingDto, fromUserId: string) {
    const { productId, toUserId, rating, comment } = createRatingDto;

    // Validate product exists and has ended
    const product = await this.productModel.findById(productId);
    if (!product) {
      throw new NotFoundException('Product not found');
    }

    if (product.status !== 'sold') {
      throw new BadRequestException('Can only rate after auction has ended (status: sold)');
    }

    if (!product.currentWinnerId) {
      throw new BadRequestException('This auction has no winner');
    }

    // Validate user cannot rate themselves
    if (fromUserId === toUserId) {
      throw new BadRequestException('Cannot rate yourself');
    }

    // Validate relationship: either seller rating winner OR winner rating seller
    const isFromSeller = product.sellerId.toString() === fromUserId;
    const isFromWinner = product.currentWinnerId.toString() === fromUserId;
    const isToSeller = product.sellerId.toString() === toUserId;
    const isToWinner = product.currentWinnerId.toString() === toUserId;

    if (!((isFromSeller && isToWinner) || (isFromWinner && isToSeller))) {
      throw new ForbiddenException('You can only rate the seller or winner of this auction');
    }

    // Check if already rated (we allow updating, so just find existing)
    const existingRating = await this.ratingModel.findOne({
      fromUserId: new Types.ObjectId(fromUserId),
      toUserId: new Types.ObjectId(toUserId),
      productId: new Types.ObjectId(productId),
    });

    if (existingRating) {
      throw new BadRequestException('You have already rated this user for this product. Use update endpoint to modify your rating.');
    }

    // Create rating
    const newRating = new this.ratingModel({
      fromUserId: new Types.ObjectId(fromUserId),
      toUserId: new Types.ObjectId(toUserId),
      productId: new Types.ObjectId(productId),
      rating,
      comment,
      isSellerToWinner: isFromSeller && isToWinner,
      isCancelledTransaction: false,
    });

    await newRating.save();

    // Update user rating counts
    await this.updateUserRatingCounts(toUserId);

    return {
      message: 'Rating created successfully',
      rating: {
        _id: newRating._id,
        fromUserId: newRating.fromUserId,
        toUserId: newRating.toUserId,
        productId: newRating.productId,
        rating: newRating.rating,
        comment: newRating.comment,
        createdAt: newRating['createdAt'],
      },
    };
  }

  async updateRating(ratingId: string, updateRatingDto: UpdateRatingDto, userId: string) {
    const rating = await this.ratingModel.findById(ratingId);
    if (!rating) {
      throw new NotFoundException('Rating not found');
    }

    // Check if user is the one who created the rating
    if (rating.fromUserId.toString() !== userId) {
      throw new ForbiddenException('You can only update your own ratings');
    }

    // Check if rating is from cancelled transaction (cannot update those)
    if (rating.isCancelledTransaction) {
      throw new BadRequestException('Cannot update rating from cancelled transaction');
    }

    const oldRating = rating.rating;
    rating.rating = updateRatingDto.rating;
    rating.comment = updateRatingDto.comment;
    await rating.save();

    // If rating value changed, update user counts
    if (oldRating !== updateRatingDto.rating) {
      await this.updateUserRatingCounts(rating.toUserId.toString());
    }

    return {
      message: 'Rating updated successfully',
      rating: {
        _id: rating._id,
        fromUserId: rating.fromUserId,
        toUserId: rating.toUserId,
        productId: rating.productId,
        rating: rating.rating,
        comment: rating.comment,
        updatedAt: rating['updatedAt'],
      },
    };
  }

  async getMyReceivedRatings(userId: string, page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;

    const [ratings, total] = await Promise.all([
      this.ratingModel
        .find({ toUserId: new Types.ObjectId(userId) })
        .populate('fromUserId', 'fullName email')
        .populate('productId', 'name')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      this.ratingModel.countDocuments({ toUserId: new Types.ObjectId(userId) }),
    ]);

    const user = await this.userModel.findById(userId).select('ratingPositive ratingNegative').lean();
    const totalRatings = (user?.ratingPositive || 0) + (user?.ratingNegative || 0);
    const ratingPercentage = totalRatings > 0 ? ((user?.ratingPositive || 0) / totalRatings) * 100 : 0;

    return {
      ratings,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: limit,
      },
      summary: {
        ratingPositive: user?.ratingPositive || 0,
        ratingNegative: user?.ratingNegative || 0,
        ratingPercentage: parseFloat(ratingPercentage.toFixed(1)),
      },
    };
  }

  async getRatingsForProduct(productId: string) {
    const product = await this.productModel.findById(productId);
    if (!product) {
      throw new NotFoundException('Product not found');
    }

    const ratings = await this.ratingModel
      .find({ productId: new Types.ObjectId(productId) })
      .populate('fromUserId', 'fullName email')
      .populate('toUserId', 'fullName email')
      .sort({ createdAt: -1 })
      .lean();

    return {
      productId,
      productName: product.name,
      ratings,
    };
  }

  async getMyGivenRatings(userId: string, page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;

    const [ratings, total] = await Promise.all([
      this.ratingModel
        .find({ fromUserId: new Types.ObjectId(userId) })
        .populate('toUserId', 'fullName email')
        .populate('productId', 'name')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      this.ratingModel.countDocuments({ fromUserId: new Types.ObjectId(userId) }),
    ]);

    return {
      ratings,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: limit,
      },
    };
  }

  async getUserRatings(userId: string, page: number = 1, limit: number = 10) {
    // Check if user exists
    const user = await this.userModel.findById(userId).select('fullName email ratingPositive ratingNegative').lean();
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const skip = (page - 1) * limit;

    const [ratings, total] = await Promise.all([
      this.ratingModel
        .find({ toUserId: new Types.ObjectId(userId) })
        .populate('fromUserId', 'fullName email')
        .populate('productId', 'name')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      this.ratingModel.countDocuments({ toUserId: new Types.ObjectId(userId) }),
    ]);

    const totalRatings = (user?.ratingPositive || 0) + (user?.ratingNegative || 0);
    const ratingPercentage = totalRatings > 0 ? ((user?.ratingPositive || 0) / totalRatings) * 100 : 0;

    return {
      user: {
        _id: user._id,
        fullName: user.fullName,
        email: user.email,
      },
      ratings,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: limit,
      },
      summary: {
        ratingPositive: user?.ratingPositive || 0,
        ratingNegative: user?.ratingNegative || 0,
        ratingPercentage: parseFloat(ratingPercentage.toFixed(1)),
      },
    };
  }

  private async updateUserRatingCounts(userId: string) {
    // Aggregate all ratings for this user
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
}
