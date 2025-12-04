import { IsNotEmpty, IsNumber, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class PlaceAutoBidDto {
  @ApiProperty({ 
    example: 15000000, 
    description: 'Giá tối đa sẵn sàng trả (hệ thống sẽ tự động bid vừa đủ để thắng)',
    minimum: 0,
  })
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  maxBidAmount: number;
}
