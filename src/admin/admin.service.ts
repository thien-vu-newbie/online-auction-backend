import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../users/schemas/user.schema';
import { AdminConfig, AdminConfigDocument } from './schemas/admin-config.schema';
import { UpgradeSellerDto } from './dto/upgrade-seller.dto';
import { UpdateConfigDto } from './dto/update-config.dto';

@Injectable()
export class AdminService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(AdminConfig.name) private adminConfigModel: Model<AdminConfigDocument>,
  ) {}

  async upgradeSeller(upgradeSellerDto: UpgradeSellerDto) {
    const { userId, durationDays } = upgradeSellerDto;

    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.role === 'admin') {
      throw new BadRequestException('Cannot upgrade admin to seller');
    }

    // Calculate expiry date (from now + durationDays)
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + durationDays);

    // Update user role and expiry
    user.role = 'seller';
    user.sellerUpgradeExpiry = expiryDate;
    await user.save();

    return {
      message: 'User upgraded to seller successfully',
      userId: user._id,
      email: user.email,
      role: user.role,
      sellerUpgradeExpiry: user.sellerUpgradeExpiry,
    };
  }

  async getAllUsers(page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      this.userModel
        .find()
        .select('-password -refreshToken -emailVerificationOtp -emailVerificationOtpExpiry -passwordResetToken -passwordResetTokenExpiry')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      this.userModel.countDocuments(),
    ]);

    return {
      users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getUserById(userId: string) {
    const user = await this.userModel
      .findById(userId)
      .select('-password -refreshToken -emailVerificationOtp -emailVerificationOtpExpiry -passwordResetToken -passwordResetTokenExpiry')
      .lean();

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  // ============ Admin Config Methods ============

  async getConfig() {
    let config = await this.adminConfigModel.findOne({ configKey: 'global' }).lean();
    
    if (!config) {
      // Create default config if not exists
      const newConfig = await this.adminConfigModel.create({
        configKey: 'global',
        newProductHighlightMinutes: 5,
        autoExtendThresholdMinutes: 5,
        autoExtendDurationMinutes: 10,
      });
      return newConfig.toObject();
    }

    return config;
  }

  async updateConfig(updateConfigDto: UpdateConfigDto) {
    const config = await this.adminConfigModel.findOneAndUpdate(
      { configKey: 'global' },
      { $set: updateConfigDto },
      { new: true, upsert: true },
    );

    return {
      message: 'Config updated successfully',
      config,
    };
  }
}
