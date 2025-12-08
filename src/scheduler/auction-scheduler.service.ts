import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Product, ProductDocument } from '../products/schemas/product.schema';
import { User, UserDocument } from '../users/schemas/user.schema';
import { MailService } from '../common/services/mail.service';

@Injectable()
export class AuctionSchedulerService {
  private readonly logger = new Logger(AuctionSchedulerService.name);

  constructor(
    @InjectModel(Product.name) private productModel: Model<ProductDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private mailService: MailService,
  ) {}

  /**
   * Cron job chạy mỗi phút để kiểm tra các đấu giá đã kết thúc
   * Gửi email cho seller và winner (nếu có)
   */
  @Cron(CronExpression.EVERY_MINUTE)
  async checkAndNotifyEndedAuctions() {
    const now = new Date();

    // Tìm các sản phẩm đã kết thúc nhưng chưa gửi email (status = 'active' và endTime < now)
    const endedProducts = await this.productModel
      .find({
        status: 'active',
        endTime: { $lt: now },
      })
      .populate('sellerId', 'email fullName')
      .populate('currentWinnerId', 'email fullName');


    if (endedProducts.length > 0) {
      this.logger.log(`Found ${endedProducts.length} ended auctions to process`);
    }

    for (const product of endedProducts) {
      try {
        const seller = product.sellerId as any;

        if (!product.currentWinnerId) {
          // Trường hợp 1: Đấu giá kết thúc, không có người mua
          this.logger.log(`Auction ended without bidder: ${product.name}`);
          
          if (seller?.email) {
            await this.mailService.sendAuctionEndedNoBidder({
              sellerEmail: seller.email,
              sellerName: seller.fullName,
              productName: product.name,
              startPrice: product.startPrice,
              endTime: product.endTime,
            });
          }

          // Update product status - hooks tự động sync Elasticsearch
          product.status = 'expired';
          await product.save();
        } else {
          // Trường hợp 2: Đấu giá kết thúc, có người thắng
          const winner = product.currentWinnerId as any;
          this.logger.log(`Auction ended with winner: ${product.name} - Winner: ${winner?.fullName}`);

          // Gửi email cho seller
          if (seller?.email) {
            await this.mailService.sendAuctionEndedToSeller({
              sellerEmail: seller.email,
              sellerName: seller.fullName,
              productName: product.name,
              finalPrice: product.currentPrice,
              winnerName: winner?.fullName || 'Unknown',
              winnerEmail: winner?.email || '',
              endTime: product.endTime,
            });
          }

          // Gửi email cho winner
          if (winner?.email) {
            await this.mailService.sendAuctionEndedToWinner({
              winnerEmail: winner.email,
              winnerName: winner.fullName,
              productName: product.name,
              finalPrice: product.currentPrice,
              sellerName: seller?.fullName || 'Unknown',
              sellerEmail: seller?.email || '',
              endTime: product.endTime,
            });
          }

          // Update product status - hooks tự động sync Elasticsearch
          product.status = 'sold';
          await product.save();
        }
      } catch (error) {
        this.logger.error(`Error processing auction ${product._id}: ${error.message}`);
      }
    }
  }
}
