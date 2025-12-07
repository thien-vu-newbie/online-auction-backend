import { IsOptional, IsString, IsEnum, IsNumber, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export enum SortBy {
  CREATED_DESC = 'created_desc',     // Mặc định: Ngày đăng giảm dần
  END_TIME_DESC = 'endTime_desc',     // Thời gian kết thúc giảm dần
  PRICE_ASC = 'price_asc',            // Giá tăng dần
}

export class SearchProductDto {
  @ApiProperty({ 
    required: false, 
    description: 'Tên sản phẩm (hỗ trợ tiếng Việt không dấu)', 
    example: 'iphone 15' 
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ 
    required: false, 
    description: 'Category ID', 
    example: '507f1f77bcf86cd799439011' 
  })
  @IsOptional()
  @IsString()
  categoryId?: string;

  @ApiProperty({ 
    required: false, 
    enum: SortBy, 
    description: 'Sắp xếp kết quả. Mặc định: created_desc (ngày đăng giảm dần)',
    example: SortBy.CREATED_DESC,
    default: SortBy.CREATED_DESC
  })
  @IsOptional()
  @IsEnum(SortBy)
  sortBy?: SortBy = SortBy.CREATED_DESC;

  @ApiProperty({ 
    required: false, 
    description: 'Page number', 
    example: 1,
    default: 1 
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiProperty({ 
    required: false, 
    description: 'Items per page', 
    example: 10,
    default: 10
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  limit?: number = 10;
}
