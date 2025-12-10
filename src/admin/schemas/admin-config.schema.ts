import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type AdminConfigDocument = AdminConfig & Document;

@Schema({ timestamps: true })
export class AdminConfig {
  @Prop({ required: true, unique: true, default: 'global' })
  configKey: string;

  @Prop({ required: true, default: 5 })
  newProductHighlightMinutes: number; // N phút để sản phẩm mới được hiển thị nổi bật

  @Prop({ required: true, default: 5 })
  autoExtendThresholdMinutes: number; // Nếu đấu giá trước khi kết thúc X phút thì gia hạn

  @Prop({ required: true, default: 10 })
  autoExtendDurationMinutes: number; // Thời gian gia hạn thêm (Y phút)
}

export const AdminConfigSchema = SchemaFactory.createForClass(AdminConfig);
