import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type OrderDocument = Order & Document;

@Schema({ timestamps: true })
export class Order {
  @Prop({ type: Types.ObjectId, ref: 'Product', required: true })
  productId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  sellerId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  buyerId: Types.ObjectId; // Winner của auction

  @Prop({ required: true })
  finalPrice: number; // Giá thắng cuối cùng

  @Prop({ 
    required: true, 
    enum: ['pending_payment', 'paid', 'shipped', 'completed', 'cancelled'],
    default: 'pending_payment'
  })
  status: string;

  // Payment info
  @Prop({ default: null })
  paymentIntentId: string; // Stripe Payment Intent ID

  @Prop({ default: null })
  paidAt: Date;

  // Shipping info
  @Prop({ type: Object, default: null })
  shippingAddress: {
    fullName: string;
    phone: string;
    address: string;
    city: string;
    district: string;
    ward: string;
  };

  @Prop({ default: null })
  trackingNumber: string; // Mã vận đơn

  @Prop({ default: null })
  shippedAt: Date;

  @Prop({ default: null })
  receivedAt: Date;

  // Cancellation
  @Prop({ default: null })
  cancelledBy: Types.ObjectId; // User ID người cancel

  @Prop({ default: null })
  cancelReason: string;

  @Prop({ default: null })
  cancelledAt: Date;
}

export const OrderSchema = SchemaFactory.createForClass(Order);

// Indexes
OrderSchema.index({ productId: 1 });
OrderSchema.index({ sellerId: 1, status: 1 });
OrderSchema.index({ buyerId: 1, status: 1 });
OrderSchema.index({ paymentIntentId: 1 });
