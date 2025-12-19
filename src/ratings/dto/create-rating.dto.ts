import { IsNotEmpty, IsMongoId, IsNumber, IsString, IsIn, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateRatingDto {
  @ApiProperty({ 
    example: '507f1f77bcf86cd799439011', 
    description: 'Product ID (sản phẩm đã kết thúc đấu giá)'
  })
  @IsNotEmpty()
  @IsMongoId()
  productId: string;

  @ApiProperty({ 
    example: '507f191e810c19729de860ea', 
    description: 'User ID của người được đánh giá (seller hoặc winner)'
  })
  @IsNotEmpty()
  @IsMongoId()
  toUserId: string;

  @ApiProperty({ 
    example: 1, 
    description: 'Điểm đánh giá: +1 (tốt) hoặc -1 (xấu)',
    enum: [1, -1]
  })
  @IsNotEmpty()
  @IsNumber()
  @IsIn([1, -1])
  rating: number;

  @ApiProperty({ 
    example: 'Người mua thanh toán nhanh, giao dịch suôn sẻ', 
    description: 'Nhận xét (tối đa 500 ký tự)'
  })
  @IsNotEmpty()
  @IsString()
  @MaxLength(500)
  comment: string;
}
