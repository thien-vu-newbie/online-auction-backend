import { IsEmail, IsString, IsOptional, MinLength, IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateProfileDto {
  @ApiProperty({ 
    required: false, 
    description: 'Họ tên', 
    example: 'Nguyễn Văn A' 
  })
  @IsOptional()
  @IsString()
  @MinLength(2)
  fullName?: string;

  @ApiProperty({ 
    required: false, 
    description: 'Email', 
    example: 'user@example.com' 
  })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({ 
    required: false, 
    description: 'Địa chỉ', 
    example: '123 Nguyễn Huệ, Q1, TP.HCM' 
  })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiProperty({ 
    required: false, 
    description: 'Ngày sinh (ISO 8601 format)', 
    example: '1990-01-01' 
  })
  @IsOptional()
  @IsDateString()
  dateOfBirth?: string;
}
