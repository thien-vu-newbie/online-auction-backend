import { IsNotEmpty, IsMongoId } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpgradeSellerDto {
  @ApiProperty({ 
    example: '507f1f77bcf86cd799439011', 
    description: 'User ID để nâng cấp lên seller (duration: 7 days)' 
  })
  @IsNotEmpty()
  @IsMongoId()
  userId: string;
}
