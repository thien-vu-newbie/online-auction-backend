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

  // Images - Cloudinary URLs (tối thiểu 3 ảnh)
  @Prop({ required: true })
  thumbnail: string; // Cloudinary URL

  @Prop({ type: [String], required: true })
  images: string[]; // Array of Cloudinary URLs (minimum 3)

  // Pricing
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

  // Seller settings 
  @Prop({ default: false })
  allowUnratedBidders: boolean; // Cho phép bidder có rating dưới 80% đấu giá

  // Auction status
  @Prop({ 
    type: String, 
    enum: ['active', 'sold', 'expired', 'cancelled'], 
    default: 'active' 
  })
  status: string; // active: đang đấu giá | sold: có người thắng | expired: hết hạn không có bid | cancelled: seller hủy

  // Current winner
  @Prop({ type: Types.ObjectId, ref: 'User' })
  currentWinnerId?: Types.ObjectId;

  // Stats
  @Prop({ default: 0 })
  bidCount: number;

  // Từ chối bidder
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

// ========== ELASTICSEARCH SYNC HOOKS ==========
// Post-save hook: Sync to Elasticsearch after create/update
ProductSchema.post('save', async function(doc: ProductDocument) {
  try {
    const elasticsearchService = (this.constructor as any).elasticsearchService;
    if (elasticsearchService) {
      await elasticsearchService.indexProduct(doc);
    }
  } catch (error) {
    console.error('Error syncing product to Elasticsearch on save:', error);
  }
});

// Post-findOneAndUpdate hook: Sync to Elasticsearch after update
ProductSchema.post('findOneAndUpdate', async function(doc: ProductDocument) {
  try {
    if (!doc) return;
    const elasticsearchService = (this.model as any).elasticsearchService;
    if (elasticsearchService) {
      await elasticsearchService.indexProduct(doc);
    }
  } catch (error) {
    console.error('Error syncing product to Elasticsearch on update:', error);
  }
});

// Post-findOneAndDelete hook: Delete from Elasticsearch
ProductSchema.post('findOneAndDelete', async function(doc: ProductDocument) {
  try {
    if (!doc) return;
    const elasticsearchService = (this.model as any).elasticsearchService;
    if (elasticsearchService) {
      await elasticsearchService.deleteProduct(doc._id.toString());
    }
  } catch (error) {
    console.error('Error deleting product from Elasticsearch:', error);
  }
});
