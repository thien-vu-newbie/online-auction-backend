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

  @Prop({ default: 'bidder' })
  role: string;
}

export const UserSchema = SchemaFactory.createForClass(User);