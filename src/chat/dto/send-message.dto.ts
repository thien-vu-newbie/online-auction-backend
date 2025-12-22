import { IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SendMessageDto {
  @ApiProperty({
    description: 'Product ID',
    example: '507f1f77bcf86cd799439011',
  })
  @IsNotEmpty()
  @IsString()
  productId: string;

  @ApiProperty({
    description: 'Message content',
    example: 'Xin chào, sản phẩm này còn không?',
    maxLength: 1000,
  })
  @IsNotEmpty()
  @IsString()
  @MaxLength(1000)
  content: string;
}
