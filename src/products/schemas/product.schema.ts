import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ProductDocument = Product & Document;

@Schema({ timestamps: true })
export class Product {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  description: string; // HTML từ TinyMCE

  @Prop({ type: Types.ObjectId, ref: 'Category', required: true })
  categoryId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  sellerId: Types.ObjectId;

  // Images - Cloudinary URLs (mục 3.1 - tối thiểu 3 ảnh)
  @Prop({ required: true })
  thumbnail: string; // Cloudinary URL

  @Prop({ type: [String], required: true })
  images: string[]; // Array of Cloudinary URLs (minimum 3)

  // Pricing (mục 3.1)
  @Prop({ required: true })
  startPrice: number; // Giá khởi điểm

  @Prop({ required: true })
  currentPrice: number; // Giá hiện tại (cập nhật khi có bid)

  @Prop({ required: true })
  stepPrice: number; // Bước giá

  @Prop()
  buyNowPrice?: number; // Giá mua ngay (optional)

  // Auction timing
  @Prop({ required: true })
  startTime: Date;

  @Prop({ required: true })
  endTime: Date;

  @Prop({ default: false })
  autoExtend: boolean; // Tự động gia hạn khi có bid mới trước khi kết thúc 5 phút

  // Seller settings (mục 2.2)
  @Prop({ default: false })
  allowUnratedBidders: boolean; // Cho phép bidder chưa có rating đấu giá

  // Auction status
  @Prop({ 
    type: String, 
    enum: ['active', 'completed', 'cancelled'], 
    default: 'active' 
  })
  status: string;

  // Current winner (mục 1.5)
  @Prop({ type: Types.ObjectId, ref: 'User' })
  currentWinnerId?: Types.ObjectId;

  // Stats (mục 1.2 - top 5)
  @Prop({ default: 0 })
  bidCount: number;

  // Mục 3.3 - từ chối bidder
  @Prop({ type: [Types.ObjectId], default: [] })
  rejectedBidders: Types.ObjectId[];
}

export const ProductSchema = SchemaFactory.createForClass(Product);

// Indexes for faster queries
ProductSchema.index({ categoryId: 1 });
ProductSchema.index({ sellerId: 1 });
ProductSchema.index({ status: 1 });
ProductSchema.index({ endTime: 1 });
ProductSchema.index({ currentPrice: 1 });
ProductSchema.index({ bidCount: 1 });
ProductSchema.index({ createdAt: 1 });
