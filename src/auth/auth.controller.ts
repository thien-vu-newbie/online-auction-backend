import {
  Controller,
  Post,
  Body,
  Get,
  Req,
  UseGuards,
  Res,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { ResendOtpDto } from './dto/resend-otp.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';

import { ChangePasswordDto } from '../users/dto/change-password.dto';
import type { Response } from 'express'; 
import { log } from 'console';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  @ApiOperation({
    summary: 'Đăng ký tài khoản mới',
    description:
      'Đăng ký tài khoản bidder mới với xác thực reCAPTCHA và gửi OTP qua email',
  })
  @ApiResponse({
    status: 201,
    description: 'Đăng ký thành công, OTP đã được gửi qua email',
  })
  @ApiResponse({
    status: 400,
    description: 'Email đã tồn tại hoặc reCAPTCHA không hợp lệ',
  })
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post('verify-otp')
  @ApiOperation({
    summary: 'Xác thực OTP',
    description: 'Xác thực mã OTP để hoàn tất đăng ký và tạo tài khoản',
  })
  @ApiResponse({
    status: 200,
    description: 'Xác thực thành công, tài khoản đã được tạo',
  })
  @ApiResponse({ status: 400, description: 'OTP không hợp lệ hoặc đã hết hạn' })
  async verifyOTP(@Body() verifyOtpDto: VerifyOtpDto) {
    return this.authService.verifyOTP(verifyOtpDto);
  }

  @Post('resend-otp')
  @ApiOperation({
    summary: 'Gửi lại OTP',
    description: 'Gửi lại mã OTP mới qua email',
  })
  @ApiResponse({ status: 200, description: 'OTP mới đã được gửi' })
  @ApiResponse({ status: 400, description: 'Không tìm thấy yêu cầu đăng ký' })
  async resendOTP(@Body() resendOtpDto: ResendOtpDto) {
    return this.authService.resendOTP(resendOtpDto);
  }

  @Post('login')
  @ApiOperation({
    summary: 'Đăng nhập',
    description: 'Đăng nhập bằng email và mật khẩu với xác thực reCAPTCHA',
  })
  @ApiResponse({
    status: 200,
    description: 'Đăng nhập thành công, trả về access token',
  })
  @ApiResponse({
    status: 401,
    description: 'Email hoặc mật khẩu không chính xác',
  })
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Get('google')
  @ApiOperation({
    summary: 'Đăng nhập Google',
    description: 'Khởi tạo OAuth flow với Google',
  })
  @UseGuards(AuthGuard('google'))
  async googleAuth() {
    // Initiates Google OAuth flow
  }

  @Get('google/callback')
  @ApiOperation({
    summary: 'Google OAuth Callback',
    description: 'Xử lý callback từ Google OAuth',
  })
  @UseGuards(AuthGuard('google'))
  async googleAuthRedirect(@Req() req, @Res() res: Response) {
    try {
      const result = await this.authService.googleLogin(req);
      const userInfo = encodeURIComponent(JSON.stringify(result.user));
      return res.redirect(
        `${process.env.FRONTEND_URL}/auth/callback?token=${result.access_token}&refresh_token=${result.refresh_token}&user=${userInfo}&success=true`,
      );
    } catch (error) {
      return res.redirect(
        `${process.env.FRONTEND_URL}/auth/callback?success=false&error=${encodeURIComponent(error.message)}`,
      );
    }
  }

  @Post('forgot-password')
  @ApiOperation({
    summary: 'Quên mật khẩu',
    description: 'Yêu cầu đặt lại mật khẩu và nhận OTP qua email',
  })
  @ApiResponse({
    status: 200,
    description: 'OTP đặt lại mật khẩu đã được gửi qua email',
  })
  @ApiResponse({ status: 400, description: 'Email không tồn tại' })
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    return this.authService.forgotPassword(forgotPasswordDto);
  }

  @Post('reset-password')
  @ApiOperation({
    summary: 'Đặt lại mật khẩu',
    description: 'Đặt lại mật khẩu mới với mã OTP',
  })
  @ApiResponse({
    status: 200,
    description: 'Mật khẩu đã được đặt lại thành công',
  })
  @ApiResponse({ status: 400, description: 'OTP không hợp lệ hoặc đã hết hạn' })
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    return this.authService.resetPassword(resetPasswordDto);
  }

  @Post('change-password')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Đổi mật khẩu',
    description: 'Đổi mật khẩu (yêu cầu nhập mật khẩu cũ)',
  })
  @ApiResponse({ status: 200, description: 'Đổi mật khẩu thành công' })
  @ApiResponse({ status: 400, description: 'Mật khẩu cũ không chính xác' })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Token không hợp lệ',
  })
  async changePassword(
    @Req() req,
    @Body() changePasswordDto: ChangePasswordDto,
  ) {
    return this.authService.changePassword(req.user.sub, changePasswordDto);
  }

  @Post('refresh')
  @ApiOperation({
    summary: 'Làm mới token',
    description: 'Sử dụng refresh token để lấy access token mới',
  })
  @ApiResponse({ status: 200, description: 'Token mới đã được tạo thành công' })
  @ApiResponse({
    status: 403,
    description: 'Refresh token không hợp lệ hoặc đã hết hạn',
  })
  async refresh(@Body() refreshTokenDto: RefreshTokenDto) {
    return this.authService.refreshTokens(refreshTokenDto);
  }

  @Post('logout')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Đăng xuất',
    description: 'Đăng xuất và vô hiệu hóa refresh token',
  })
  @ApiResponse({ status: 200, description: 'Đăng xuất thành công' })
  async logout(@Req() req) {
    return this.authService.logout(req.user.sub);
  }
}
