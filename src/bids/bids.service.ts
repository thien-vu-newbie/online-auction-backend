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

@Injectable()
export class BidsService {
  constructor(
    @InjectModel(Bid.name) private bidModel: Model<BidDocument>,
    @InjectModel(AutoBidConfig.name) private autoBidConfigModel: Model<AutoBidConfigDocument>,
    @InjectModel(Product.name) private productModel: Model<ProductDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private mailService: MailService,
  ) {}

  async placeBid(productId: string, placeBidDto: PlaceBidDto, bidderId: string) {
    const product = await this.productModel.findById(productId);
    if (!product) {
      throw new NotFoundException('Product not found');
    }

    // Check if product is active
    if (product.status !== 'active') {
      throw new BadRequestException('Auction is not active');
    }

    // Check if auction has started
    const now = new Date();
    if (now < product.startTime) {
      throw new BadRequestException('Auction has not started yet');
    }

    // Check if auction has ended
    if (now > product.endTime) {
      throw new BadRequestException('Auction has ended');
    }

    // Check if bidder is the seller (không được bid sản phẩm của chính mình)
    if (product.sellerId.toString() === bidderId) {
      throw new ForbiddenException('You cannot bid on your own product');
    }

    // Check if bidder is rejected
    if (product.rejectedBidders.some(id => id.toString() === bidderId)) {
      throw new ForbiddenException('You have been rejected by the seller and cannot bid on this product');
    }

    // Get bidder info
    const bidder = await this.userModel.findById(bidderId);
    if (!bidder) {
      throw new NotFoundException('Bidder not found');
    }

    // Check rating requirement (điểm đánh giá > 80%)
    // Nếu allowUnratedBidders = false -> bắt buộc check rating
    if (!product.allowUnratedBidders) {
      const totalRatings = (bidder.ratingPositive || 0) + (bidder.ratingNegative || 0);
      
      if (totalRatings === 0) {
        // Bidder chưa có rating
        throw new ForbiddenException('This product does not allow bidders without ratings');
      }
      
      const ratingPercentage = (bidder.ratingPositive / totalRatings) * 100;
      if (ratingPercentage < 80) {
        throw new ForbiddenException(`Your rating is ${ratingPercentage.toFixed(1)}%. Minimum required: 80%`);
      }
    }

    // Validate bid amount (giá hiện tại + bước giá)
    const minimumBid = product.currentPrice + product.stepPrice;
    if (placeBidDto.bidAmount < minimumBid) {
      throw new BadRequestException(
        `Bid amount must be at least ${minimumBid} (current price + step price)`
      );
    }

    // Kiểm tra auto bid trước khi lưu bid thông thường
    const highestAutoBid = await this.autoBidConfigModel
      .findOne({ 
        productId: new Types.ObjectId(productId),
        isActive: true,
        bidderId: { $ne: new Types.ObjectId(bidderId) }, // Không lấy auto bid của chính mình
        maxBidAmount: { $gte: placeBidDto.bidAmount }, // Auto bid phải >= giá bid
      })
      .sort({ maxBidAmount: -1, createdAt: 1 })
      .lean();

    let finalBidAmount: number;
    let finalBidderId: Types.ObjectId;

    if (highestAutoBid) {
      // Có người auto bid với giá >= bid amount
      // Người auto bid thắng với giá = bid amount (vừa đủ để thắng)
      finalBidAmount = placeBidDto.bidAmount;
      finalBidderId = highestAutoBid.bidderId;
    } else {
      // Không có auto bid hoặc auto bid < bid amount
      // Bid thông thường thành công
      finalBidAmount = placeBidDto.bidAmount;
      finalBidderId = new Types.ObjectId(bidderId);
    }

    // Create bid record
    const newBid = new this.bidModel({
      productId: new Types.ObjectId(productId),
      bidderId: finalBidderId,
      bidAmount: finalBidAmount,
      bidTime: now,
    });
    await newBid.save();

    // Update product
    product.currentPrice = finalBidAmount;
    product.currentWinnerId = finalBidderId;
    product.bidCount += 1;

    // Check if current price >= buy now price -> end auction immediately
    const isBuyNowPurchase = product.buyNowPrice && finalBidAmount >= product.buyNowPrice;
    if (isBuyNowPurchase) {
      product.status = 'sold';
      product.endTime = now; // Kết thúc ngay lập tức
    } else {
      // Auto extend (gia hạn 10 phút nếu bid trước 5 phút kết thúc)
      if (product.autoExtend) {
        const timeUntilEnd = product.endTime.getTime() - now.getTime();
        const fiveMinutes = 5 * 60 * 1000;
        
        if (timeUntilEnd < fiveMinutes) {
          const tenMinutes = 10 * 60 * 1000;
          product.endTime = new Date(now.getTime() + tenMinutes);
        }
      }
    }

    // Hooks tự động sync Elasticsearch
    await product.save();

    // Sau khi bid, trigger auto bid để xử lý các auto bid khác
    // (nếu có người auto bid cao hơn thì sẽ tự động counter)
    await this.processAutoBid(product, finalBidderId, now);

    // Reload product để lấy giá mới nhất sau auto bid
    const updatedProduct = await this.productModel.findById(productId)
      .populate('sellerId', 'email fullName')
      .populate('currentWinnerId', 'email fullName');

    // ========== GỬI EMAIL ==========
    // Lấy thông tin các bên liên quan
    const seller = await this.userModel.findById(product.sellerId);
    const currentBidder = await this.userModel.findById(finalBidderId);
    
    // Tìm người giữ giá trước đó (nếu có)
    let previousWinner: any = null;
    if (product.currentWinnerId && product.currentWinnerId.toString() !== finalBidderId.toString()) {
      previousWinner = await this.userModel.findById(product.currentWinnerId);
    }

    // 1. Gửi email cho người bán
    if (seller) {
      await this.mailService.sendBidPlacedToSeller({
        sellerEmail: seller.email,
        sellerName: seller.fullName,
        productName: product.name,
        bidderName: currentBidder?.fullName || 'Anonymous',
        bidAmount: finalBidAmount,
        currentPrice: updatedProduct!.currentPrice,
      });
    }

    // 2. Gửi email cho người ra giá
    if (currentBidder) {
      await this.mailService.sendBidPlacedToBidder({
        bidderEmail: currentBidder.email,
        bidderName: currentBidder.fullName,
        productName: product.name,
        bidAmount: finalBidAmount,
        currentPrice: updatedProduct!.currentPrice,
      });
    }

    // 3. Gửi email cho người giữ giá trước đó (bị outbid)
    if (previousWinner) {
      const previousBid = await this.bidModel
        .findOne({ 
          productId: new Types.ObjectId(productId),
          bidderId: previousWinner._id,
        })
        .sort({ bidTime: -1 });

      if (previousBid) {
        await this.mailService.sendOutbidNotification({
          previousBidderEmail: previousWinner.email,
          previousBidderName: previousWinner.fullName,
          productName: product.name,
          previousBidAmount: previousBid.bidAmount,
          newBidAmount: finalBidAmount,
          currentPrice: updatedProduct!.currentPrice,
        });
      }
    }

    // Nếu đạt buy now price, gửi email kết thúc đấu giá ngay lập tức
    if (isBuyNowPurchase) {
      await this.handleBuyNowPurchase(productId);
    }

    return {
      message: highestAutoBid 
        ? 'Your bid was countered by an auto bid' 
        : 'Bid placed successfully',
      bid: {
        _id: newBid._id,
        productId: newBid.productId,
        bidAmount: newBid.bidAmount,
        bidTime: newBid.bidTime,
        isCountered: !!highestAutoBid,
      },
      product: {
        currentPrice: updatedProduct!.currentPrice,
        bidCount: updatedProduct!.bidCount,
        endTime: updatedProduct!.endTime,
      },
    };
  }

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
        // No other bids, reset to start price
        product.currentPrice = product.startPrice;
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

    // Validate maxBidAmount phải >= giá hiện tại + step
    const minimumBid = product.currentPrice + product.stepPrice;
    if (placeAutoBidDto.maxBidAmount < minimumBid) {
      throw new BadRequestException(
        `Max bid amount must be at least ${minimumBid} (current price + step price)`
      );
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
    await this.processAutoBid(product, new Types.ObjectId(bidderId), now);

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

  private async processAutoBid(product: ProductDocument, newBidderId: Types.ObjectId, now: Date) {
    const minWinPrice = Math.max(product.currentPrice + product.stepPrice, product.startPrice);

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
      // Giá vào sản phẩm = secondHighest.maxBidAmount
      const priceToWin = secondHighestAutoBid.maxBidAmount;
      finalPrice = priceToWin;
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
      // Auto extend
      if (product.autoExtend) {
        const timeUntilEnd = product.endTime.getTime() - now.getTime();
        const fiveMinutes = 5 * 60 * 1000;
        
        if (timeUntilEnd < fiveMinutes) {
          const tenMinutes = 10 * 60 * 1000;
          product.endTime = new Date(now.getTime() + tenMinutes);
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
