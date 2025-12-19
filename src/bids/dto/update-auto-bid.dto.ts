import { IsNotEmpty, IsNumber, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class UpdateAutoBidDto {
  @ApiProperty({ 
    example: 20000000, 
    description: 'Giá tối đa mới sẵn sàng trả',
    minimum: 0,
  })
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  maxBidAmount: number;
}
