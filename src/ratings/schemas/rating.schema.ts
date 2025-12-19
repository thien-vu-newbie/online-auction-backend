import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type RatingDocument = Rating & Document;

@Schema({ timestamps: true })
export class Rating {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  fromUserId: Types.ObjectId; // Người đánh giá

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  toUserId: Types.ObjectId; // Người được đánh giá

  @Prop({ type: Types.ObjectId, ref: 'Product', required: true })
  productId: Types.ObjectId; // Sản phẩm liên quan

  @Prop({ required: true, enum: [1, -1] })
  rating: number; // +1 hoặc -1

  @Prop({ required: true, trim: true, maxlength: 500 })
  comment: string; // Nhận xét

  @Prop({ default: false })
  isSellerToWinner: boolean; // true nếu seller đánh giá winner, false nếu winner đánh giá seller

  @Prop({ default: false })
  isCancelledTransaction: boolean; // true nếu là rating từ việc cancel giao dịch
}

export const RatingSchema = SchemaFactory.createForClass(Rating);

// Compound index: mỗi người chỉ đánh giá người kia 1 lần cho 1 sản phẩm
// Nhưng có thể thay đổi rating sau này, không unique
RatingSchema.index({ fromUserId: 1, toUserId: 1, productId: 1 });
RatingSchema.index({ toUserId: 1 }); // Để query ratings của 1 user
RatingSchema.index({ productId: 1 }); // Để query ratings của 1 product
