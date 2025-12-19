import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Comment, CommentDocument } from './schemas/comment.schema';
import { Product, ProductDocument } from '../products/schemas/product.schema';
import { User, UserDocument } from '../users/schemas/user.schema';
import { CreateCommentDto } from './dto/create-comment.dto';
import { MailService } from '../common/services/mail.service';
import { Bid, BidDocument } from '../bids/schemas/bid.schema';

@Injectable()
export class CommentsService {
  constructor(
    @InjectModel(Comment.name) private commentModel: Model<CommentDocument>,
    @InjectModel(Product.name) private productModel: Model<ProductDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Bid.name) private bidModel: Model<BidDocument>,
    private mailService: MailService,
  ) {}

  async createComment(createCommentDto: CreateCommentDto, userId: string) {
    const { productId, content, parentId } = createCommentDto;

    // Validate product exists
    const product = await this.productModel
      .findById(productId)
      .populate('sellerId', 'email fullName');
    
    if (!product) {
      throw new NotFoundException('Product not found');
    }

    // Validate parentId if provided (must be a comment on the same product)
    if (parentId) {
      const parentComment = await this.commentModel.findById(parentId);
      if (!parentComment) {
        throw new NotFoundException('Parent comment not found');
      }
      if (parentComment.productId.toString() !== productId) {
        throw new BadRequestException('Parent comment must be on the same product');
      }
    }

    // Create comment
    const comment = new this.commentModel({
      userId: new Types.ObjectId(userId),
      productId: new Types.ObjectId(productId),
      content,
      parentId: parentId ? new Types.ObjectId(parentId) : null,
    });

    await comment.save();

    // Populate user info
    await comment.populate('userId', 'fullName email');

    // Send email notification
    const seller = product.sellerId as any;
    const commenter = comment.userId as any;
    const isSeller = seller._id.toString() === userId;

    if (isSeller) {
      // Seller comment -> gửi email cho người tham gia đấu giá và parent author (nếu có)
      await this.notifyBiddersAndParent(product, comment, parentId || null);
    } else {
      // User comment -> chỉ gửi email cho seller
      if (seller?.email) {
        await this.mailService.sendNewQuestionToSeller({
          sellerEmail: seller.email,
          sellerName: seller.fullName,
          productName: product.name,
          productId: product._id.toString(),
          commenterName: commenter.fullName,
          question: content,
        });
      }
    }

    return {
      message: 'Comment created successfully',
      comment: {
        _id: comment._id,
        userId: comment.userId,
        productId: comment.productId,
        content: comment.content,
        parentId: comment.parentId,
        createdAt: comment['createdAt'],
      },
    };
  }

  async getCommentsByProduct(productId: string) {
    // Validate product exists
    const product = await this.productModel.findById(productId);
    if (!product) {
      throw new NotFoundException('Product not found');
    }

    // Lấy tất cả comments
    const comments = await this.commentModel
      .find({ 
        productId: new Types.ObjectId(productId),
      })
      .populate('userId', 'fullName email')
      .populate('parentId')
      .sort({ createdAt: 1 })
      .lean();

    // Organize comments into tree structure
    const commentMap = new Map<string, any>();
    const rootComments: any[] = [];

    // First pass: create map
    comments.forEach(comment => {
      commentMap.set(comment._id.toString(), { ...comment, replies: [] });
    });

    // Second pass: organize into tree
    comments.forEach(comment => {
      if (comment.parentId) {
        const parent = commentMap.get(comment.parentId.toString());
        if (parent) {
          parent.replies.push(commentMap.get(comment._id.toString()));
        }
      } else {
        rootComments.push(commentMap.get(comment._id.toString()));
      }
    });

    return {
      productId,
      productName: product.name,
      totalComments: comments.length,
      comments: rootComments,
    };
  }

  private async notifyBiddersAndParent(product: ProductDocument, comment: CommentDocument, parentId: string | null) {
    const productId = product._id;
    const commenter = comment.userId as any;
    const emails = new Set<string>();

    // Lấy danh sách bidders (những người đã đấu giá)
    const bidderIds = await this.bidModel
      .distinct('bidderId', { 
        productId,
      });

    // Lấy thông tin bidders
    const bidders = await this.userModel
      .find({ 
        _id: { $in: bidderIds },
      })
      .select('email fullName')
      .lean();

    // Add bidder emails
    bidders.forEach(bidder => {
      if (bidder.email) {
        emails.add(bidder.email);
      }
    });

    // Nếu có parentId, thêm email của parent comment author
    if (parentId) {
      const parentComment = await this.commentModel
        .findById(parentId)
        .populate('userId', 'email fullName');
      
      if (parentComment) {
        const parentAuthor = parentComment.userId as any;
        if (parentAuthor?.email) {
          emails.add(parentAuthor.email);
        }
      }
    }

    // Send emails
    const emailPromises = Array.from(emails).map(email => 
      this.mailService.sendNewReplyNotification({
        recipientEmail: email,
        productName: product.name,
        productId: product._id.toString(),
        commenterName: commenter.fullName,
        replyContent: comment.content,
      })
    );

    await Promise.all(emailPromises);
  }
}
