import { IsNotEmpty, IsString, IsOptional, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateShippingAddressDto {
  @ApiProperty({ example: 'Nguyễn Văn A' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(100)
  fullName: string;

  @ApiProperty({ example: '0909123456' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(20)
  phone: string;

  @ApiProperty({ example: '123 Nguyễn Huệ' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(200)
  address: string;

  @ApiProperty({ example: 'TP. Hồ Chí Minh' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(100)
  city: string;

  @ApiProperty({ example: 'Quận 1' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(100)
  district: string;

  @ApiProperty({ example: 'Phường Bến Nghé' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(100)
  ward: string;
}
