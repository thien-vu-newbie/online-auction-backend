import { IsNotEmpty, IsString, MaxLength, IsOptional, IsMongoId } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCommentDto {
  @ApiProperty({ 
    example: '507f1f77bcf86cd799439011', 
    description: 'Product ID'
  })
  @IsNotEmpty()
  @IsMongoId()
  productId: string;

  @ApiProperty({ 
    example: 'Sản phẩm này còn bảo hành không ạ?', 
    description: 'Nội dung câu hỏi (tối đa 1000 ký tự)'
  })
  @IsNotEmpty()
  @IsString()
  @MaxLength(1000)
  content: string;

  @ApiProperty({ 
    example: '507f191e810c19729de860ea', 
    description: 'Parent comment ID (để reply, để trống nếu là câu hỏi mới)',
    required: false
  })
  @IsOptional()
  @IsMongoId()
  parentId?: string;
}
