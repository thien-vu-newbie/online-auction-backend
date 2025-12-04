import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type BidDocument = Bid & Document;

@Schema({ timestamps: true })
export class Bid {
  @Prop({ type: Types.ObjectId, ref: 'Product', required: true, index: true })
  productId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  bidderId: Types.ObjectId;

  @Prop({ required: true })
  bidAmount: number;

  @Prop({ default: false })
  isRejected: boolean;

  @Prop({ default: Date.now })
  bidTime: Date;
}

export const BidSchema = SchemaFactory.createForClass(Bid);

// Compound index for efficient queries
BidSchema.index({ productId: 1, bidAmount: -1 });
BidSchema.index({ productId: 1, bidTime: -1 });
