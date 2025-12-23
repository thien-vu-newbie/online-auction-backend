import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../users/schemas/user.schema';
import { AdminConfig, AdminConfigDocument } from './schemas/admin-config.schema';
import { Product, ProductDocument } from '../products/schemas/product.schema';
import { Category, CategoryDocument } from '../categories/schemas/category.schema';
import { UpgradeSellerDto } from './dto/upgrade-seller.dto';
import { UpdateConfigDto } from './dto/update-config.dto';
import { DashboardStatsDto } from './dto/dashboard-stats.dto';

@Injectable()
export class AdminService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(AdminConfig.name) private adminConfigModel: Model<AdminConfigDocument>,
    @InjectModel(Product.name) private productModel: Model<ProductDocument>,
    @InjectModel(Category.name) private categoryModel: Model<CategoryDocument>,
  ) {}


  // ============ Seller Upgrade Request Management ============

  async getPendingSellerRequests(page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      this.userModel
        .find({ isRequestingSellerUpgrade: true })
        .select('fullName email role isRequestingSellerUpgrade sellerUpgradeRequestDate ratingPositive ratingNegative')
        .sort({ sellerUpgradeRequestDate: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      this.userModel.countDocuments({ isRequestingSellerUpgrade: true }),
    ]);

    return {
      requests: users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async upgradeSeller(upgradeSellerDto: UpgradeSellerDto) {
    const { userId } = upgradeSellerDto;

    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.role === 'admin') {
      throw new BadRequestException('Cannot upgrade admin to seller');
    }

    // Fixed 7-day duration
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 7);

    // Update user role, expiry and clear request flags
    user.role = 'seller';
    user.sellerUpgradeExpiry = expiryDate;
    user.isRequestingSellerUpgrade = false;
    user.sellerUpgradeRequestDate = undefined;
    await user.save();

    return {
      message: 'User upgraded to seller successfully (7 days)',
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
      { new: true, upsert: true }
    );
    return {
      message: 'Config updated successfully',
      config,
    };
  }

  // ============ Dashboard Statistics ============

  async getDashboardStats(): Promise<DashboardStatsDto> {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sixMonthsAgo = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);

    // Summary statistics
    const [
      totalUsers,
      newUsers,
      totalProducts,
      newProducts,
      activeAuctions,
      endedAuctions,
      pendingSellerRequests,
      approvedSellerRequests,
    ] = await Promise.all([
      this.userModel.countDocuments(),
      this.userModel.countDocuments({ createdAt: { $gte: thirtyDaysAgo } }),
      this.productModel.countDocuments(),
      this.productModel.countDocuments({ createdAt: { $gte: thirtyDaysAgo } }),
      this.productModel.countDocuments({ status: 'active', endTime: { $gt: now } }),
      this.productModel.countDocuments({ status: { $in: ['expired', 'sold'] } }),
      this.userModel.countDocuments({ isRequestingSellerUpgrade: true }),
      this.userModel.countDocuments({ 
        role: 'seller',
        sellerUpgradeExpiry: { $exists: true, $ne: null },
      }),
    ]);

    // Calculate total revenue (sum of all sold products' currentPrice)
    const revenueResult = await this.productModel.aggregate([
      { $match: { status: 'sold' } },
      { $group: { _id: null, total: { $sum: '$currentPrice' } } },
    ]);
    const totalRevenue = revenueResult.length > 0 ? revenueResult[0].total : 0;

    // User growth over last 30 days (daily)
    const userGrowth = await this.userModel.aggregate([
      { $match: { createdAt: { $gte: thirtyDaysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
      { $project: { _id: 0, date: '$_id', count: 1 } },
    ]);

    // Product growth over last 30 days (daily)
    const productGrowth = await this.productModel.aggregate([
      { $match: { createdAt: { $gte: thirtyDaysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
      { $project: { _id: 0, date: '$_id', count: 1 } },
    ]);

    // Revenue by month (last 6 months)
    const revenueByMonth = await this.productModel.aggregate([
      { 
        $match: { 
          status: 'sold',
          updatedAt: { $gte: sixMonthsAgo },
        } 
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m', date: '$updatedAt' } },
          revenue: { $sum: '$currentPrice' },
        },
      },
      { $sort: { _id: 1 } },
      { $project: { _id: 0, month: '$_id', revenue: 1 } },
    ]);

    // Category distribution
    const categories = await this.categoryModel.find().lean();
    const categoryDistribution = await Promise.all(
      categories.map(async (cat) => ({
        name: cat.name,
        count: await this.productModel.countDocuments({ categoryId: cat._id }),
      }))
    );

    return {
      totalUsers,
      newUsers,
      totalProducts,
      newProducts,
      activeAuctions,
      endedAuctions,
      totalRevenue,
      pendingSellerRequests,
      approvedSellerRequests,
      userGrowth,
      productGrowth,
      revenueByMonth,
      categoryDistribution: categoryDistribution.filter((c) => c.count > 0),
    };
  }
}
