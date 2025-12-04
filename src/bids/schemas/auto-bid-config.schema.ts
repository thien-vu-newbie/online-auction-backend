import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type AutoBidConfigDocument = AutoBidConfig & Document;

@Schema({ timestamps: true })
export class AutoBidConfig {
  @Prop({ type: Types.ObjectId, ref: 'Product', required: true })
  productId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  bidderId: Types.ObjectId;

  @Prop({ required: true })
  maxBidAmount: number;

  @Prop({ default: true })
  isActive: boolean;
}

export const AutoBidConfigSchema = SchemaFactory.createForClass(AutoBidConfig);

// Unique constraint: 1 user chỉ có 1 auto bid config cho 1 product
AutoBidConfigSchema.index({ productId: 1, bidderId: 1 }, { unique: true });
