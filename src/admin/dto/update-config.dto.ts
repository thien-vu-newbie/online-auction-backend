import { IsInt, Min, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateConfigDto {
  @ApiPropertyOptional({ 
    example: 5, 
    description: 'Số phút để sản phẩm mới được hiển thị nổi bật' 
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  newProductHighlightMinutes?: number;

  @ApiPropertyOptional({ 
    example: 5, 
    description: 'Nếu đấu giá trước khi kết thúc X phút thì tự động gia hạn' 
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  autoExtendThresholdMinutes?: number;

  @ApiPropertyOptional({ 
    example: 10, 
    description: 'Thời gian gia hạn thêm (phút)' 
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  autoExtendDurationMinutes?: number;
}
