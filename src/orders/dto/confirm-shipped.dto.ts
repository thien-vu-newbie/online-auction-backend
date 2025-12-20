import { IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ConfirmShippedDto {
  @ApiProperty({ example: 'VN123456789', description: 'Mã vận đơn' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(100)
  trackingNumber: string;
}
