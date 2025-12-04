import { IsNotEmpty, IsString, IsOptional, IsMongoId } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCategoryDto {
  @ApiProperty({ example: 'Điện tử', description: 'Tên danh mục' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiPropertyOptional({ 
    example: '507f1f77bcf86cd799439011', 
    description: 'ID danh mục cha (null hoặc bỏ qua = danh mục cấp 1)' 
  })
  @IsOptional()
  @IsMongoId()
  parentId?: string;
}
