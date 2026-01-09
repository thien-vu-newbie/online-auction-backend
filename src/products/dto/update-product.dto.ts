import { 
  IsOptional, 
  IsString, 
  IsNumber, 
  IsMongoId,
  IsDateString,
  Min,
  ValidateIf,
  IsNotEmpty,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type, Transform } from 'class-transformer';

export class UpdateProductDto {
  @ApiPropertyOptional({ example: 'iPhone 15 Pro Max 256GB', description: 'Tên sản phẩm' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ 
    example: '<p>iPhone 15 Pro Max mới 100%...</p>', 
    description: 'Mô tả chi tiết sản phẩm (HTML từ TinyMCE). Nếu đã có bid, sẽ append vào cuối.' 
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: '507f1f77bcf86cd799439011', description: 'ID danh mục sản phẩm' })
  @IsOptional()
  @IsMongoId()
  categoryId?: string;

  @ApiPropertyOptional({ example: 10000000, description: 'Giá khởi điểm (VNĐ)', minimum: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  startPrice?: number;

  @ApiPropertyOptional({ example: 100000, description: 'Bước giá (VNĐ)', minimum: 1000 })
  @IsOptional()
  @IsNumber()
  @Min(1000)
  @Type(() => Number)
  stepPrice?: number;

  @ApiPropertyOptional({ example: 30000000, description: 'Giá mua ngay (VNĐ) - optional' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  buyNowPrice?: number;

  @ApiPropertyOptional({ 
    example: '2025-12-10T00:00:00.000Z', 
    description: 'Thời điểm bắt đầu đấu giá (ISO string)' 
  })
  @IsOptional()
  @IsDateString()
  startTime?: string;

  @ApiPropertyOptional({ 
    example: '2025-12-20T23:59:59.000Z', 
    description: 'Thời điểm kết thúc đấu giá (ISO string)' 
  })
  @IsOptional()
  @IsDateString()
  endTime?: string;

  @ApiPropertyOptional({ 
    example: true, 
    description: 'Tự động gia hạn khi có bid mới trước khi kết thúc 5 phút (default: false)' 
  })
  @IsOptional()
  autoExtend?: boolean | string;

  @ApiPropertyOptional({ 
    example: false, 
    description: 'Cho phép bidder chưa có rating đấu giá (default: false)' 
  })
  @IsOptional()
  allowUnratedBidders?: boolean | string;
}

