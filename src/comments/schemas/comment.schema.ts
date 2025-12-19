import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type CommentDocument = Comment & Document;

@Schema({ timestamps: true })
export class Comment {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId; // Người hỏi hoặc người trả lời

  @Prop({ type: Types.ObjectId, ref: 'Product', required: true })
  productId: Types.ObjectId; // Sản phẩm được hỏi

  @Prop({ required: true, trim: true })
  content: string; // Nội dung câu hỏi/trả lời

  @Prop({ type: Types.ObjectId, ref: 'Comment', default: null })
  parentId?: Types.ObjectId; // null = câu hỏi gốc, not null = reply
}

export const CommentSchema = SchemaFactory.createForClass(Comment);

// Indexes
CommentSchema.index({ productId: 1, createdAt: -1 });
CommentSchema.index({ parentId: 1 });
CommentSchema.index({ userId: 1 });
