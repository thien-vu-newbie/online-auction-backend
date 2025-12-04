import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, MaxLength } from 'class-validator';

export class CancelProductDto {
  @ApiProperty({ 
    description: 'Lý do hủy đấu giá (optional)',
    example: 'Sản phẩm đã bán offline',
    required: false,
    maxLength: 500
  })
  @IsOptional()
  @IsString()
  @MaxLength(500, { message: 'Reason must not exceed 500 characters' })
  reason?: string;
}
