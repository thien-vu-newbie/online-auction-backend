import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type WatchlistDocument = Watchlist & Document;

@Schema({ timestamps: true })
export class Watchlist {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Product', required: true })
  productId: Types.ObjectId;
}

export const WatchlistSchema = SchemaFactory.createForClass(Watchlist);

// Compound index để đảm bảo mỗi user chỉ add 1 product 1 lần
WatchlistSchema.index({ userId: 1, productId: 1 }, { unique: true });
