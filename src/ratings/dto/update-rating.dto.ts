import { IsNotEmpty, IsNumber, IsString, IsIn, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateRatingDto {
  @ApiProperty({ 
    example: 1, 
    description: 'Điểm đánh giá mới: +1 (tốt) hoặc -1 (xấu)',
    enum: [1, -1]
  })
  @IsNotEmpty()
  @IsNumber()
  @IsIn([1, -1])
  rating: number;

  @ApiProperty({ 
    example: 'Đã cập nhật: Giao dịch thực sự tốt!', 
    description: 'Nhận xét mới (tối đa 500 ký tự)'
  })
  @IsNotEmpty()
  @IsString()
  @MaxLength(500)
  comment: string;
}
