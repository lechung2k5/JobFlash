import { Controller, Post, Get, Body, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { UploadService } from './upload.service.js';
import { UploadImageDto, VerifyIdCardDto } from './dto/upload-image.dto.js';

@ApiTags('Upload - Tải ảnh lên Cloudinary')
@Controller('upload')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post('image')
  @ApiOperation({ summary: 'Tải ảnh Base64 lên Cloudinary (Dành cho ảnh avatar, CCCD, bằng chứng ca làm)' })
  async uploadImage(@Body() dto: UploadImageDto) {
    const result = await this.uploadService.uploadImage(dto.file, dto.folder || 'jobflash/avatars');
    return {
      success: true,
      data: result,
    };
  }

  @Post('verify-id-card')
  @ApiOperation({ summary: 'Kiểm tra độ sắc nét và tải ảnh Căn cước công dân (Mặt trước / Mặt sau) lên Cloudinary' })
  async verifyIdCard(@Body() dto: VerifyIdCardDto) {
    const result = await this.uploadService.verifyAndUploadIdCard(dto.file, dto.side);
    return {
      success: true,
      data: result,
    };
  }

  @Get('config')
  @ApiOperation({ summary: 'Lấy chữ ký bảo mật để tải ảnh trực tiếp từ thiết bị lên Cloudinary' })
  async getUploadConfig(@Query('folder') folder?: string) {
    const config = this.uploadService.getSignedUploadConfig(folder || 'jobflash/avatars');
    return {
      success: true,
      data: config,
    };
  }
}
