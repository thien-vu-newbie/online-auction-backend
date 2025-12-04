import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type CategoryDocument = Category & Document;

@Schema({ timestamps: true })
export class Category {
  @Prop({ required: true })
  name: string;

  @Prop({ type: Types.ObjectId, ref: 'Category', default: null })
  parentId?: Types.ObjectId; // null = Level 1 category, not null = Level 2 category

  @Prop({ default: 0 })
  productCount: number; // Track số lượng sản phẩm trong category (để validate delete)
}

export const CategorySchema = SchemaFactory.createForClass(Category);

// Index for faster queries
CategorySchema.index({ parentId: 1 });
