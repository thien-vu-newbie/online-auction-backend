import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Bid, BidDocument } from './schemas/bid.schema';
import { AutoBidConfig, AutoBidConfigDocument } from './schemas/auto-bid-config.schema';
import { Product, ProductDocument } from '../products/schemas/product.schema';
import { User, UserDocument } from '../users/schemas/user.schema';
import { PlaceBidDto } from './dto/place-bid.dto';
import { PlaceAutoBidDto } from './dto/place-auto-bid.dto';
import { MailService } from '../common/services/mail.service';
import { AdminService } from '../admin/admin.service';

@Injectable()
export class BidsService {
  constructor(
    @InjectModel(Bid.name) private bidModel: Model<BidDocument>,
    @InjectModel(AutoBidConfig.name) private autoBidConfigModel: Model<AutoBidConfigDocument>,
    @InjectModel(Product.name) private productModel: Model<ProductDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private mailService: MailService,
    private adminService: AdminService,
  ) {}


  async getBidHistory(productId: string) {
    const product = await this.productModel.findById(productId);
    if (!product) {
      throw new NotFoundException('Product not found');
    }

    // Get all bids for this product, sorted by bidTime descending
    const bids = await this.bidModel
      .find({ productId: new Types.ObjectId(productId), isRejected: false })
      .populate('bidderId', 'fullName')
      .sort({ bidTime: -1 })
      .lean();

    // Mask bidder names (che 1 phần tên)
    const maskedBids = bids.map(bid => {
      const bidder = bid.bidderId as any;
      const fullName = bidder?.fullName || 'Unknown';
      const maskedName = this.maskName(fullName);

      return {
        bidTime: bid.bidTime,
        bidderName: maskedName,
        bidAmount: bid.bidAmount,
      };
    });

    return {
      productId,
      productName: product.name,
      currentPrice: product.currentPrice,
      bidCount: product.bidCount,
      history: maskedBids,
    };
  }

  async rejectBidder(productId: string, bidderId: string, sellerId: string) {
    const product = await this.productModel.findById(productId);
    if (!product) {
      throw new NotFoundException('Product not found');
    }

    // Check if user is the seller
    if (product.sellerId.toString() !== sellerId) {
      throw new ForbiddenException('Only the seller can reject bidders');
    }

    // Check if bidder exists
    const bidder = await this.userModel.findById(bidderId);
    if (!bidder) {
      throw new NotFoundException('Bidder not found');
    }

    // Add to rejected list
    if (!product.rejectedBidders.some(id => id.toString() === bidderId)) {
      product.rejectedBidders.push(new Types.ObjectId(bidderId));
    }

    // Mark all bids from this bidder as rejected
    await this.bidModel.updateMany(
      { productId: new Types.ObjectId(productId), bidderId: new Types.ObjectId(bidderId) },
      { isRejected: true }
    );

    // If rejected bidder is current winner, find next highest bidder
    if (product.currentWinnerId?.toString() === bidderId) {
      const nextBid = await this.bidModel
        .findOne({ 
          productId: new Types.ObjectId(productId), 
          isRejected: false,
          bidderId: { $ne: new Types.ObjectId(bidderId) }
        })
        .sort({ bidAmount: -1, bidTime: 1 })
        .lean();

      if (nextBid) {
        product.currentPrice = nextBid.bidAmount;
        product.currentWinnerId = nextBid.bidderId;
      } else {
        // No other bids, reset to 0
        product.currentPrice = 0;
        product.currentWinnerId = undefined;
      }

      // Hooks tự động sync Elasticsearch
      await product.save();
    }

    // ========== GỬI EMAIL CHO NGƯỜI BỊ TỪ CHỐI ==========
    const seller = await this.userModel.findById(sellerId);
    if (bidder && seller) {
      await this.mailService.sendBidderRejected({
        bidderEmail: bidder.email,
        bidderName: bidder.fullName,
        productName: product.name,
        sellerName: seller.fullName,
      });
    }

    return {
      message: 'Bidder rejected successfully',
      rejectedBidderId: bidderId,
      currentPrice: product.currentPrice,
      currentWinnerId: product.currentWinnerId,
    };
  }

  private maskName(fullName: string): string {
    // Mask tên: "Nguyễn Văn Khoa" -> "****Khoa"
    const parts = fullName.trim().split(' ');
    if (parts.length === 0) return '****';
    
    const lastName = parts[parts.length - 1];
    return `****${lastName}`;
  }

  async placeAutoBid(productId: string, placeAutoBidDto: PlaceAutoBidDto, bidderId: string) {
    const product = await this.productModel.findById(productId);
    if (!product) {
      throw new NotFoundException('Product not found');
    }

    // Validation giống placeBid
    if (product.status !== 'active') {
      throw new BadRequestException('Auction is not active');
    }

    const now = new Date();
    if (now < product.startTime) {
      throw new BadRequestException('Auction has not started yet');
    }

    if (now > product.endTime) {
      throw new BadRequestException('Auction has ended');
    }

    if (product.sellerId.toString() === bidderId) {
      throw new ForbiddenException('You cannot bid on your own product');
    }

    if (product.rejectedBidders.some(id => id.toString() === bidderId)) {
      throw new ForbiddenException('You have been rejected by the seller and cannot bid on this product');
    }

    const bidder = await this.userModel.findById(bidderId);
    if (!bidder) {
      throw new NotFoundException('Bidder not found');
    }

    // Check rating
    if (!product.allowUnratedBidders) {
      const totalRatings = (bidder.ratingPositive || 0) + (bidder.ratingNegative || 0);
      
      if (totalRatings === 0) {
        throw new ForbiddenException('This product does not allow bidders without ratings');
      }
      
      const ratingPercentage = (bidder.ratingPositive / totalRatings) * 100;
      if (ratingPercentage < 80) {
        throw new ForbiddenException(`Your rating is ${ratingPercentage.toFixed(1)}%. Minimum required: 80%`);
      }
    }

    // Validate maxBidAmount: if no bids yet (currentPrice = 0), must be >= startPrice; otherwise >= currentPrice + step
    const minimumBid = product.currentPrice === 0 ? product.startPrice : product.currentPrice + product.stepPrice;
    if (placeAutoBidDto.maxBidAmount < minimumBid) {
      const minBidMessage = product.currentPrice === 0 
        ? `Max bid amount must be at least ${minimumBid} (start price)`
        : `Max bid amount must be at least ${minimumBid} (current price + step price)`;
      throw new BadRequestException(minBidMessage);
    }

    // Lưu/update auto bid config
    await this.autoBidConfigModel.findOneAndUpdate(
      { 
        productId: new Types.ObjectId(productId),
        bidderId: new Types.ObjectId(bidderId),
      },
      {
        productId: new Types.ObjectId(productId),
        bidderId: new Types.ObjectId(bidderId),
        maxBidAmount: placeAutoBidDto.maxBidAmount,
        isActive: true,
      },
      { upsert: true, new: true }
    );

    // Xử lý auto bid logic
    // CHỈ process nếu người đặt auto bid KHÔNG phải người đang thắng
    const shouldProcessAutoBid = !product.currentWinnerId || product.currentWinnerId.toString() !== bidderId;
    if (shouldProcessAutoBid) {
      await this.processAutoBid(product, now);
    }

    // Reload product
    const updatedProduct = await this.productModel.findById(productId);

    return {
      message: 'Auto bid configured successfully',
      autoBidConfig: {
        maxBidAmount: placeAutoBidDto.maxBidAmount,
      },
      product: {
        currentPrice: updatedProduct!.currentPrice,
        currentWinnerId: updatedProduct!.currentWinnerId,
        bidCount: updatedProduct!.bidCount,
        endTime: updatedProduct!.endTime,
      },
    };
  }

  private async processAutoBid(product: ProductDocument, now: Date) {
    // If no bids yet (currentPrice = 0), minimum winning price is startPrice; otherwise currentPrice + step
    const minWinPrice = product.currentPrice === 0 ? product.startPrice : product.currentPrice + product.stepPrice;

    // Lấy tất cả auto bid config active cho product này
    const autoBidConfigs = await this.autoBidConfigModel
      .find({ 
        productId: product._id,
        isActive: true,
        maxBidAmount: { $gte: minWinPrice },
      })
      .sort({ maxBidAmount: -1, createdAt: 1 }) // Sort theo max bid giảm dần, nếu bằng nhau thì người đặt trước thắng
      .lean();

    if (autoBidConfigs.length === 0) {
      return;
    }

    // Tìm bidder có max bid cao nhất
    const highestAutoBid = autoBidConfigs[0];
    const secondHighestAutoBid = autoBidConfigs[1];

    let finalPrice: number;
    let winnerId: Types.ObjectId;

    if (!secondHighestAutoBid) {
      // Chỉ có 1 người auto bid
      // Giá vào sản phẩm = max(currentPrice + stepPrice, startPrice)
      finalPrice = minWinPrice;
      winnerId = highestAutoBid.bidderId;
    } else {
      // Có >= 2 người auto bid
      // Kiểm tra xem người đang giữ win có phải là người có max cao nhất không
      const currentWinnerId = product.currentWinnerId?.toString();
      const highestBidderId = highestAutoBid.bidderId.toString();
      
      // Candidate price when highest is not already the current winner:
      const candidatePrice = secondHighestAutoBid.maxBidAmount + product.stepPrice;

      if (currentWinnerId === highestBidderId) {
        // If the current winner already is the highest auto-bidder,
        // they only need to pay the second highest's max (but cannot exceed their own max).
        finalPrice = Math.max(minWinPrice, secondHighestAutoBid.maxBidAmount);
      } else {
        // Otherwise, the highest bidder needs to beat the second by one step,
        // but cannot pay more than their declared maximum.
        finalPrice = Math.max(minWinPrice, Math.min(highestAutoBid.maxBidAmount, candidatePrice));
      }

      winnerId = highestAutoBid.bidderId;
    }

    // Tạo bid record
    const newBid = new this.bidModel({
      productId: product._id,
      bidderId: winnerId,
      bidAmount: finalPrice,
      bidTime: now,
    });
    await newBid.save();

    // Update product
    product.currentPrice = finalPrice;
    product.currentWinnerId = winnerId;
    product.bidCount += 1;

    // Check if current price >= buy now price -> end auction immediately
    const isBuyNowPurchase = product.buyNowPrice && finalPrice >= product.buyNowPrice;
    if (isBuyNowPurchase) {
      product.status = 'sold';
      product.endTime = now; // Kết thúc ngay lập tức
    } else {
      // Auto extend - use admin config
      if (product.autoExtend) {
        const config = await this.adminService.getConfig();
        const timeUntilEnd = product.endTime.getTime() - now.getTime();
        const thresholdMs = config.autoExtendThresholdMinutes * 60 * 1000;
        
        if (timeUntilEnd < thresholdMs) {
          const extendMs = config.autoExtendDurationMinutes * 60 * 1000;
          product.endTime = new Date(now.getTime() + extendMs);
        }
      }
    }

    // Hooks tự động sync Elasticsearch
    await product.save();

    // Nếu đạt buy now price, gửi email kết thúc đấu giá ngay lập tức
    if (isBuyNowPurchase) {
      await this.handleBuyNowPurchase(product._id.toString());
    }
  }

  async getMyAutoBidConfig(productId: string, userId: string) {
    const config = await this.autoBidConfigModel
      .findOne({ 
        productId: new Types.ObjectId(productId),
        bidderId: new Types.ObjectId(userId),
        isActive: true,
      })
      .lean();

    if (!config) {
      return {
        hasAutoBid: false,
      };
    }

    return {
      hasAutoBid: true,
      maxBidAmount: config.maxBidAmount,
    };
  }

  async cancelAutoBid(productId: string, userId: string) {
    const result = await this.autoBidConfigModel.findOneAndUpdate(
      { 
        productId: new Types.ObjectId(productId),
        bidderId: new Types.ObjectId(userId),
      },
      { isActive: false },
      { new: true }
    );

    if (!result) {
      throw new NotFoundException('Auto bid config not found');
    }

    return {
      message: 'Auto bid cancelled successfully',
    };
  }

  /**
   * Xử lý ngay lập tức khi đấu giá kết thúc do buy now price
   */
  async handleBuyNowPurchase(productId: string) {
    const product = await this.productModel
      .findById(productId)
      .populate('sellerId', 'email fullName')
      .populate('currentWinnerId', 'email fullName');

    if (!product || !product.currentWinnerId) {
      return;
    }

    const seller = product.sellerId as any;
    const winner = product.currentWinnerId as any;

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
  }
}
