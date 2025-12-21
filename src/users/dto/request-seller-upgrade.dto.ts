import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class RequestSellerUpgradeDto {
  @ApiProperty({ 
    example: 'Tôi muốn bán các sản phẩm điện tử và công nghệ', 
    description: 'Lý do xin nâng cấp lên seller (optional)', 
    required: false 
  })
  @IsOptional()
  @IsString()
  reason?: string;
}
