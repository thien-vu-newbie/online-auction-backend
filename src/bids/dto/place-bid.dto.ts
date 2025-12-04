import { IsNotEmpty, IsNumber, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class PlaceBidDto {
  @ApiProperty({ 
    example: 1000000, 
    description: 'Giá đặt (phải >= giá hiện tại + bước giá)',
    minimum: 0,
  })
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  bidAmount: number;
}
