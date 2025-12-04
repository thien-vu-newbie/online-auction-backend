import { IsNotEmpty, IsMongoId, IsNumber, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class UpgradeSellerDto {
  @ApiProperty({ 
    example: '507f1f77bcf86cd799439011', 
    description: 'User ID để nâng cấp lên seller' 
  })
  @IsNotEmpty()
  @IsMongoId()
  userId: string;

  @ApiProperty({ 
    example: 7, 
    description: 'Số ngày có quyền seller (default: 7 days)',
    default: 7,
  })
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  durationDays: number = 7;
}
