import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Message, MessageDocument } from './schemas/message.schema';
import { Product, ProductDocument } from '../products/schemas/product.schema';

@Injectable()
export class ChatService {
  constructor(
    @InjectModel(Message.name) private messageModel: Model<MessageDocument>,
    @InjectModel(Product.name) private productModel: Model<ProductDocument>,
  ) {}

  /**
   * Gửi tin nhắn - chỉ giữa seller và winner
   */
  async sendMessage(productId: string, senderId: string, content: string) {
    const product = await this.productModel.findById(productId);
    if (!product) {
      throw new NotFoundException('Product not found');
    }

    // Kiểm tra có winner chưa
    if (!product.currentWinnerId) {
      throw new BadRequestException('This product has no winner yet. Chat is only available between seller and winner.');
    }

    const isSeller = product.sellerId.toString() === senderId;
    const isWinner = product.currentWinnerId.toString() === senderId;

    if (!isSeller && !isWinner) {
      throw new ForbiddenException('Only seller or winner can send messages');
    }

    const message = new this.messageModel({
      productId: new Types.ObjectId(productId),
      senderId: new Types.ObjectId(senderId),
      content,
    });

    await message.save();
    await message.populate('senderId', 'fullName email');

    return message;
  }

  /**
   * Lấy lịch sử chat - chỉ seller và winner xem được
   */
  async getMessages(productId: string, userId: string) {
    const product = await this.productModel.findById(productId);
    if (!product) {
      throw new NotFoundException('Product not found');
    }

    // Kiểm tra có winner chưa
    if (!product.currentWinnerId) {
      throw new BadRequestException('This product has no winner yet');
    }

    const isSeller = product.sellerId.toString() === userId;
    const isWinner = product.currentWinnerId.toString() === userId;

    if (!isSeller && !isWinner) {
      throw new ForbiddenException('Only seller or winner can view messages');
    }

    const messages = await this.messageModel
      .find({ productId: new Types.ObjectId(productId) })
      .populate('senderId', 'fullName email')
      .sort({ createdAt: 1 })
      .exec();

    return messages;
  }
}
