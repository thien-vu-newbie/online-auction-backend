import { IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateCommentDto {
  @ApiProperty({ 
    example: 'Sản phẩm còn bảo hành 6 tháng ạ', 
    description: 'Nội dung cập nhật (tối đa 1000 ký tự)'
  })
  @IsNotEmpty()
  @IsString()
  @MaxLength(1000)
  content: string;
}
