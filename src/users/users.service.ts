import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Product, ProductDocument } from '../products/schemas/product.schema';
import { Bid, BidDocument } from '../bids/schemas/bid.schema';
import { User, UserDocument } from './schemas/user.schema';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(Product.name) private productModel: Model<ProductDocument>,
    @InjectModel(Bid.name) private bidModel: Model<BidDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}

  async getProfile(userId: string) {
    const user = await this.userModel
      .findById(userId)
      .select('-password -refreshToken -emailVerificationOtp -emailVerificationOtpExpiry -passwordResetOtp -passwordResetOtpExpiry')
      .lean();

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Calculate rating percentage
    const totalRatings = (user.ratingPositive || 0) + (user.ratingNegative || 0);
    const ratingPercentage = totalRatings > 0 
      ? ((user.ratingPositive || 0) / totalRatings) * 100 
      : 0;

    return {
      ...user,
      ratingPercentage: parseFloat(ratingPercentage.toFixed(1)),
      totalRatings,
    };
  }

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

  async getMyProducts(
    userId: string,
    page: number = 1,
    limit: number = 10,
    status?: string,
  ): Promise<{ products: any[], total: number, page: number, totalPages: number }> {
    const skip = (page - 1) * limit;

    const filter: any = { sellerId: new Types.ObjectId(userId) };
    
    // Nếu có status filter 'active, sold, expired, cancelled'
    if (status && ['active', 'cancelled', 'expired', 'sold'].includes(status)) {
      filter.status = status;
    }

    const [products, total] = await Promise.all([
      this.productModel
        .find(filter)
        .populate('currentWinnerId', 'fullName email ratingPositive ratingNegative')
        .populate('categoryId', 'name')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      this.productModel.countDocuments(filter),
    ]);

    return {
      products,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async updateProfile(userId: string, updateProfileDto: UpdateProfileDto) {
    const user = await this.userModel.findById(userId);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Check email uniqueness if email is being updated
    if (updateProfileDto.email && updateProfileDto.email !== user.email) {
      const emailExists = await this.userModel.findOne({ 
        email: updateProfileDto.email.toLowerCase() 
      });

      if (emailExists) {
        throw new ConflictException('Email already in use');
      }
    }

    // Update fields
    if (updateProfileDto.fullName) {
      user.fullName = updateProfileDto.fullName;
    }

    if (updateProfileDto.email) {
      user.email = updateProfileDto.email.toLowerCase();
      user.isEmailVerified = false; // Require re-verification if email changes
    }

    if (updateProfileDto.address !== undefined) {
      user.address = updateProfileDto.address;
    }

    if (updateProfileDto.dateOfBirth) {
      user.dateOfBirth = new Date(updateProfileDto.dateOfBirth);
    }

    await user.save();

    return {
      message: 'Profile updated successfully',
      user: {
        _id: user._id,
        fullName: user.fullName,
        email: user.email,
        address: user.address,
        dateOfBirth: user.dateOfBirth,
        role: user.role,
        isEmailVerified: user.isEmailVerified,
      },
    };
  }

  async changePassword(userId: string, changePasswordDto: ChangePasswordDto) {
    const user = await this.userModel.findById(userId);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!user.password) {
      throw new BadRequestException('Cannot change password for Google OAuth users');
    }

    // Verify old password
    const isOldPasswordValid = await bcrypt.compare(
      changePasswordDto.oldPassword,
      user.password,
    );

    if (!isOldPasswordValid) {
      throw new BadRequestException('Old password is incorrect');
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(changePasswordDto.newPassword, 10);
    user.password = hashedPassword;

    await user.save();

    return {
      message: 'Password changed successfully',
    };
  }

  async requestSellerUpgrade(userId: string) {
    const user = await this.userModel.findById(userId);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.role === 'admin') {
      throw new BadRequestException('Admin cannot request seller upgrade');
    }

    if (user.role === 'seller' && user.sellerUpgradeExpiry && new Date() < user.sellerUpgradeExpiry) {
      throw new BadRequestException('You are already an active seller');
    }

    if (user.isRequestingSellerUpgrade) {
      throw new BadRequestException('You have already submitted a seller upgrade request. Please wait for admin approval.');
    }

    user.isRequestingSellerUpgrade = true;
    user.sellerUpgradeRequestDate = new Date();
    await user.save();

    return {
      message: 'Seller upgrade request submitted successfully. Admin will review your request.',
      requestDate: user.sellerUpgradeRequestDate,
    };
  }
}
