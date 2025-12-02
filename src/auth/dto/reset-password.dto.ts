import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ResetPasswordDto {
  @ApiProperty({ example: 'user@example.com', description: 'Email tài khoản' })
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @ApiProperty({ example: '123456', description: 'Mã OTP nhận qua email' })
  @IsNotEmpty()
  @IsString()
  otp: string;

  @ApiProperty({ example: 'NewPassword123!', description: 'Mật khẩu mới (tối thiểu 8 ký tự)', minLength: 8 })
  @IsNotEmpty()
  @IsString()
  @MinLength(8)
  newPassword: string;
}
