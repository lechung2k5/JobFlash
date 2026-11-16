import { Controller, Get, Put, Body, UseGuards, Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { UsersService } from './users.service.js';
import { UpdateWorkerProfileDto } from './dto/update-worker-profile.dto.js';
import { UpdateUserProfileDto } from './dto/update-user-profile.dto.js';

@ApiTags('Users - Quản lý Hồ sơ & Thợ')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @ApiOperation({ summary: 'Lấy thông tin tài khoản hiện tại (bao gồm hồ sơ thợ & ví tiền)' })
  async getMyProfile(@Request() req: any) {
    return this.usersService.getProfile(req.user.id);
  }

  @Put('profile')
  @ApiOperation({ summary: 'Cập nhật thông tin hồ sơ người dùng / Người thuê việc' })
  async updateProfile(@Request() req: any, @Body() dto: UpdateUserProfileDto) {
    return this.usersService.updateProfile(req.user.id, dto);
  }

  @Put('worker-profile')
  @ApiOperation({ summary: 'Cập nhật hồ sơ thợ: CCCD, ngân hàng, kỹ năng, liên hệ khẩn cấp, GPS' })
  async updateWorkerProfile(@Request() req: any, @Body() dto: UpdateWorkerProfileDto) {
    return this.usersService.updateWorkerProfile(req.user.id, dto);
  }

  @Put('switch-role')
  @ApiOperation({ summary: 'Chuyển đổi vai trò hiển thị (requester <-> worker)' })
  async switchRole(@Request() req: any, @Body('role') role: string) {
    return this.usersService.switchRole(req.user.id, role);
  }
}
