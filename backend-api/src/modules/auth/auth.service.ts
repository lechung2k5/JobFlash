import { Injectable, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../prisma/prisma.service.js';
import { SendOtpDto, VerifyOtpDto } from './dto/auth.dto.js';
import { UserRole, UserStatus } from '@prisma/client';

@Injectable()
export class AuthService {
  // Bộ nhớ đệm lưu mã OTP cho từng số điện thoại (Hết hạn sau 5 phút)
  private otpCache = new Map<string, { otp: string; expiresAt: number }>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async sendOtp(dto: SendOtpDto) {
    const cleanPhone = dto.phone.replace(/\s+/g, '');

    // Sinh mã ngẫu nhiên đúng 6 chữ số
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 5 * 60 * 1000; // 5 phút

    // Lưu vào cache
    this.otpCache.set(cleanPhone, { otp, expiresAt });

    // In trực tiếp ra Terminal Backend để test thuận tiện
    console.log('\n======================================================');
    console.log(`📱 [JOBFLASH OTP SERVICE] YÊU CẦU ĐĂNG NHẬP`);
    console.log(`📞 Số điện thoại : ${cleanPhone}`);
    console.log(`🔐 MÃ XÁC THỰC OTP (6 SỐ): >>> ${otp} <<<`);
    console.log(`⏰ Thời hạn hiệu lực     : 5 phút`);
    console.log('======================================================\n');

    return {
      success: true,
      message: `Mã OTP 6 số đã được gửi tới số điện thoại ${cleanPhone}`,
      devOtp: otp, // Trả kèm để tiện test môi trường dev
    };
  }

  async verifyOtp(dto: VerifyOtpDto) {
    const cleanPhone = dto.phone.replace(/\s+/g, '');
    const cached = this.otpCache.get(cleanPhone);

    // Kiểm tra mã OTP: Khớp mã đã sinh hoặc mã test mặc định '123456'
    const isOtpValid =
      (cached && cached.otp === dto.otp && cached.expiresAt > Date.now()) ||
      dto.otp === '123456';

    if (!isOtpValid) {
      throw new BadRequestException('Mã xác thực OTP không chính xác hoặc đã hết hạn.');
    }

    // Xóa mã đã sử dụng
    this.otpCache.delete(cleanPhone);

    let user = await this.prisma.user.findUnique({
      where: { phone: cleanPhone },
      include: { workerProfile: true, wallet: true },
    });

    if (!user) {
      user = await this.prisma.user.create({
        data: {
          phone: cleanPhone,
          fullName: 'Người dùng mới',
          role: UserRole.BOTH,
          activeRole: dto.role || 'requester',
          status: UserStatus.ACTIVE,
          workerProfile: {
            create: {
              isOnline: true,
              ratingAvg: 5.0,
            },
          },
          wallet: {
            create: {
              depositBalance: 0,
              debtBalance: 0,
              debtLimit: 200000,
            },
          },
        },
        include: { workerProfile: true, wallet: true },
      });
    } else if (dto.role && dto.role !== user.activeRole) {
      user = await this.prisma.user.update({
        where: { id: user.id },
        data: { activeRole: dto.role },
        include: { workerProfile: true, wallet: true },
      });
    }

    // Thời gian lưu Session: Người thuê việc (requester) = 1 THÁNG (30 ngày), Thợ = 7 ngày
    const effectiveRole = dto.role || user.activeRole;
    const isRequester = effectiveRole === 'requester';
    const expiresIn = isRequester ? '30d' : '7d';

    const payload = {
      sub: user.id,
      phone: user.phone,
      activeRole: effectiveRole,
      isRequester,
    };

    const accessToken = await this.jwtService.signAsync(payload, {
      expiresIn,
    });

    const isDebtLocked = user.status === UserStatus.DEBT_LOCKED;

    return {
      accessToken,
      sessionExpiresIn: isRequester ? '30 ngày' : '7 ngày',
      user: {
        id: user.id,
        phone: user.phone,
        fullName: user.fullName,
        email: user.email,
        address: user.address,
        gender: user.gender,
        dateOfBirth: user.dateOfBirth,
        activeRole: effectiveRole,
        avatarUrl: user.avatarUrl,
        status: user.status,
        isDebtLocked,
        wallet: user.wallet,
        workerProfile: user.workerProfile,
      },
    };
  }
}
