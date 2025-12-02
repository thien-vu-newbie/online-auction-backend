import { IsEmail, IsNotEmpty, IsString, MinLength, IsOptional, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({ example: 'Nguyễn Văn A', description: 'Họ tên đầy đủ của người dùng' })
  @IsNotEmpty()
  @IsString()
  fullName: string;

  @ApiProperty({ example: 'user@example.com', description: 'Email đăng ký (phải duy nhất)' })
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'Password123!', description: 'Mật khẩu (tối thiểu 8 ký tự)', minLength: 8 })
  @IsNotEmpty()
  @IsString()
  @MinLength(8)
  password: string;

  @ApiProperty({ example: '123 Nguyễn Huệ, Q1, TP.HCM', description: 'Địa chỉ liên lạc' })
  @IsNotEmpty()
  @IsString()
  address: string;

  @ApiPropertyOptional({ example: '2000-01-01', description: 'Ngày tháng năm sinh (ISO format)' })
  @IsOptional()
  @IsDateString()
  dateOfBirth?: string;

  @ApiProperty({ example: 'recaptcha_token_here', description: 'reCAPTCHA token để xác thực' })
  @IsNotEmpty()
  @IsString()
  recaptchaToken: string;
}