import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UploadImageDto {
  @ApiProperty({ description: 'Chuỗi ảnh định dạng Base64 hoặc data URI', example: 'data:image/jpeg;base64,...' })
  @IsString()
  @IsNotEmpty({ message: 'Dữ liệu ảnh không được để trống' })
  file: string;

  @ApiProperty({ description: 'Thư mục lưu trữ trên Cloudinary', example: 'jobflash/avatars', required: false })
  @IsString()
  @IsOptional()
  folder?: string;
}

export class VerifyIdCardDto {
  @ApiProperty({ description: 'Chuỗi ảnh căn cước công dân Base64 hoặc URL', example: 'data:image/jpeg;base64,...' })
  @IsString()
  @IsNotEmpty({ message: 'Dữ liệu ảnh không được để trống' })
  file: string;

  @ApiProperty({ description: 'Mặt trước (front) hoặc mặt sau (back)', example: 'front', enum: ['front', 'back'] })
  @IsString()
  @IsNotEmpty({ message: 'Vui lòng chỉ định mặt trước hoặc mặt sau' })
  side: 'front' | 'back';
}
