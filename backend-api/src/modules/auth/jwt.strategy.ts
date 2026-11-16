import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../../prisma/prisma.service.js';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_ACCESS_SECRET || 'your_super_secret_jwt_access_key_jobflash_2026',
    });
  }

  async validate(payload: { sub: string; phone: string }) {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      include: { workerProfile: true, wallet: true },
    });
    if (!user) {
      throw new UnauthorizedException('Phiên đăng nhập không hợp lệ hoặc tài khoản không tồn tại.');
    }
    return user;
  }
}
