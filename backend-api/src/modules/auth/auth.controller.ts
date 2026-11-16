import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AuthService } from './auth.service.js';
import { SendOtpDto, VerifyOtpDto } from './dto/auth.dto.js';

@ApiTags('Auth - Xác thực người dùng')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('send-otp')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Gửi mã xác thực OTP qua số điện thoại' })
  @ApiResponse({ status: 200, description: 'Gửi OTP thành công' })
  async sendOtp(@Body() dto: SendOtpDto) {
    return this.authService.sendOtp(dto);
  }

  @Post('verify-otp')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Xác thực OTP, đăng nhập & tự động tạo tài khoản/ví' })
  @ApiResponse({ status: 200, description: 'Đăng nhập thành công, trả về Access Token & Profile' })
  async verifyOtp(@Body() dto: VerifyOtpDto) {
    return this.authService.verifyOtp(dto);
  }
}
