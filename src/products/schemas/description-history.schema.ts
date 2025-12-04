import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type DescriptionHistoryDocument = DescriptionHistory & Document;

@Schema({ timestamps: true })
export class DescriptionHistory {
  @Prop({ type: Types.ObjectId, ref: 'Product', required: true })
  productId: Types.ObjectId;

  @Prop({ required: true })
  content: string; // HTML từ TinyMCE

  @Prop({ default: () => new Date() })
  addedAt: Date;
}

export const DescriptionHistorySchema = SchemaFactory.createForClass(DescriptionHistory);

// Index
DescriptionHistorySchema.index({ productId: 1, addedAt: -1 });
