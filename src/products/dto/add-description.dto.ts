import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AddDescriptionDto {
  @ApiProperty({ 
    example: '<p>Bổ sung: Sản phẩm đã được kiểm tra kỹ...</p>', 
    description: 'Nội dung mô tả bổ sung (HTML từ TinyMCE) - sẽ append vào mô tả cũ' 
  })
  @IsNotEmpty()
  @IsString()
  content: string;
}
