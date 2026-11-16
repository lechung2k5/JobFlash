import { IsString, IsOptional, IsEmail, IsDateString, IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateUserProfileDto {
  @ApiProperty({ example: 'Nguyễn Văn An', required: false, description: 'Họ và tên người dùng' })
  @IsString()
  @IsOptional()
  fullName?: string;

  @ApiProperty({ example: 'https://res.cloudinary.com/flrt2adu/image/upload/v1/avatar.jpg', required: false, description: 'Đường dẫn ảnh đại diện trên Cloudinary' })
  @IsString()
  @IsOptional()
  avatarUrl?: string;

  @ApiProperty({ example: 'nguyenvanan@gmail.com', required: false, description: 'Email liên hệ nhận hóa đơn' })
  @IsEmail({}, { message: 'Địa chỉ email không đúng định dạng' })
  @IsOptional()
  email?: string;

  @ApiProperty({ example: 'Số 123 Nguyễn Huệ, Phường Bến Nghé, Quận 1, TP.HCM', required: false, description: 'Địa chỉ cư trú hoặc nơi cần thợ' })
  @IsString()
  @IsOptional()
  address?: string;

  @ApiProperty({ example: 10.7744, required: false, description: 'Vĩ độ vị trí (Goong.io)' })
  @IsNumber()
  @IsOptional()
  latitude?: number;

  @ApiProperty({ example: 106.7024, required: false, description: 'Kinh độ vị trí (Goong.io)' })
  @IsNumber()
  @IsOptional()
  longitude?: number;

  @ApiProperty({ example: 'MALE', required: false, description: 'Giới tính (MALE, FEMALE, OTHER)' })
  @IsString()
  @IsOptional()
  gender?: string;

  @ApiProperty({ example: '1995-10-20', required: false, description: 'Ngày tháng năm sinh (YYYY-MM-DD)' })
  @IsDateString({}, { message: 'Ngày sinh không đúng định dạng YYYY-MM-DD' })
  @IsOptional()
  dateOfBirth?: string;
}
