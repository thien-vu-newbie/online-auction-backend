import { IsEmail, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ForgotPasswordDto {
  @ApiProperty({ example: 'user@example.com', description: 'Email tài khoản cần đổi mật khẩu' })
  @IsNotEmpty()
  @IsEmail()
  email: string;
}
