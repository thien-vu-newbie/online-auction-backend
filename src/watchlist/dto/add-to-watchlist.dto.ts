import { IsMongoId } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AddToWatchlistDto {
  @ApiProperty({ example: '507f1f77bcf86cd799439011', description: 'Product ID' })
  @IsMongoId()
  productId: string;
}
