import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UserDocument = User & Document;

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true })
  fullName: string;

  @Prop({ required: true, unique: true, lowercase: true })
  email: string;

  @Prop()
  password?: string; 

  @Prop()
  googleId?: string;

  @Prop()
  address?: string;

  @Prop()
  dateOfBirth?: Date;

  @Prop({ default: 'bidder' })
  role: string;

  // Email verification
  @Prop({ default: false })
  isEmailVerified: boolean;

  @Prop()
  emailVerificationOtp?: string;

  @Prop()
  emailVerificationOtpExpiry?: Date;

  // Password reset
  @Prop()
  passwordResetOtp?: string;

  @Prop()
  passwordResetOtpExpiry?: Date;

  // Refresh token (hashed)
  @Prop()
  refreshToken?: string;

  // Rating system
  @Prop({ default: 0 })
  ratingPositive: number;

  @Prop({ default: 0 })
  ratingNegative: number;

  // Seller upgrade request
  @Prop({ default: false })
  isRequestingSellerUpgrade: boolean;

  @Prop()
  sellerUpgradeRequestDate?: Date; // Ngày user gửi yêu cầu

  @Prop()
  sellerUpgradeExpiry?: Date; // Admin set thời điểm phân quyền + 7 ngày

  // Helper method to check if seller permission is still valid
  get isActiveSeller(): boolean {
    if (!this.sellerUpgradeExpiry) return false;
    return new Date() < this.sellerUpgradeExpiry;
  }
}

export const UserSchema = SchemaFactory.createForClass(User);