import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { UpdateWorkerProfileDto } from './dto/update-worker-profile.dto.js';
import { UpdateUserProfileDto } from './dto/update-user-profile.dto.js';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        workerProfile: true,
        wallet: true,
      },
    });

    if (!user) {
      throw new NotFoundException('Không tìm thấy người dùng.');
    }

    return user;
  }

  async updateProfile(userId: string, dto: UpdateUserProfileDto) {
    const { dateOfBirth, latitude, longitude, ...rest } = dto;

    return this.prisma.$transaction(async (tx) => {
      const user = await tx.user.update({
        where: { id: userId },
        data: {
          ...rest,
          dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
        },
        include: {
          workerProfile: true,
          wallet: true,
        },
      });

      // Lưu tọa độ Goong.io vào hồ sơ nếu có
      if (latitude !== undefined && longitude !== undefined) {
        await tx.workerProfile.upsert({
          where: { userId },
          create: {
            userId,
            latitude,
            longitude,
          },
          update: {
            latitude,
            longitude,
          },
        });
      }

      return user;
    });
  }

  async updateWorkerProfile(userId: string, dto: UpdateWorkerProfileDto) {
    const { fullName, idCardIssueDate, dateOfBirth, ...profileData } = dto;

    return this.prisma.$transaction(async (tx) => {
      // Cập nhật tên nếu có
      if (fullName) {
        await tx.user.update({
          where: { id: userId },
          data: { fullName },
        });
      }

      // Cập nhật chi tiết hồ sơ thợ
      const updatedProfile = await tx.workerProfile.upsert({
        where: { userId },
        create: {
          userId,
          ...profileData,
          idCardIssueDate: idCardIssueDate ? new Date(idCardIssueDate) : undefined,
          dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
        },
        update: {
          ...profileData,
          idCardIssueDate: idCardIssueDate ? new Date(idCardIssueDate) : undefined,
          dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
        },
      });

      return updatedProfile;
    });
  }

  async switchRole(userId: string, role: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { activeRole: role },
    });
  }
}
