import { IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CancelOrderDto {
  @ApiProperty({ example: 'Người mua không thanh toán sau 24h', description: 'Lý do hủy đơn' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(500)
  reason: string;
}
