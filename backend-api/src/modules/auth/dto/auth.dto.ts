import { IsString, IsNotEmpty, IsOptional, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SendOtpDto {
  @ApiProperty({ example: '0912345678', description: 'Số điện thoại đăng nhập (+84)' })
  @IsString()
  @IsNotEmpty()
  phone: string;
}

export class VerifyOtpDto {
  @ApiProperty({ example: '0912345678', description: 'Số điện thoại' })
  @IsString()
  @IsNotEmpty()
  phone: string;

  @ApiProperty({ example: '123456', description: 'Mã xác thực OTP (6 chữ số)' })
  @IsString()
  @IsNotEmpty()
  @Length(6, 6, { message: 'Mã OTP phải đúng 6 chữ số' })
  otp: string;

  @ApiProperty({ example: 'requester', required: false, description: 'Vai trò: requester | worker' })
  @IsString()
  @IsOptional()
  role?: string;
}
