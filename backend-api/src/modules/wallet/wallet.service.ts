import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { UserStatus } from '@prisma/client';

@Injectable()
export class WalletService {
  constructor(private readonly prisma: PrismaService) {}

  // Lấy thông tin ví & trạng thái công nợ 10%
  async getWalletInfo(userId: string) {
    const wallet = await this.prisma.userWallet.findUnique({
      where: { userId },
      include: {
        user: {
          select: {
            id: true,
            phone: true,
            fullName: true,
            status: true,
          },
        },
      },
    });

    if (!wallet) {
      throw new NotFoundException('Không tìm thấy ví của người dùng.');
    }

    const isLocked = wallet.user.status === UserStatus.DEBT_LOCKED;
    const debt = Number(wallet.debtBalance);
    const limit = Number(wallet.debtLimit);

    return {
      depositBalance: Number(wallet.depositBalance),
      debtBalance: debt,
      debtLimit: limit,
      debtDueDate: wallet.debtDueDate,
      isDebtLocked: isLocked,
      mustPayAmount: debt > 0 ? debt : 0,
      vietQrData: {
        bankName: process.env.BANK_NAME || 'MBBank',
        accountNo: process.env.BANK_ACCOUNT_NO || '0912345678',
        accountHolder: process.env.BANK_ACCOUNT_HOLDER || 'CONG TY JOBFLASH VIET NAM',
        amount: debt,
        content: `JOBFLASH ${wallet.user.phone}`,
      },
    };
  }

  // Xử lý Webhook thanh toán nộp nợ hoa hồng 10% (Tự động mở khóa App)
  async handlePaymentWebhook(phone: string, paidAmount: number) {
    const cleanPhone = phone.replace(/\s+/g, '');
    const user = await this.prisma.user.findUnique({
      where: { phone: cleanPhone },
      include: { wallet: true },
    });

    if (!user || !user.wallet) {
      throw new NotFoundException('Không tìm thấy thông tin tài khoản để đối soát.');
    }

    const currentDebt = Number(user.wallet.debtBalance);
    const newDebt = Math.max(0, currentDebt - paidAmount);
    const debtLimit = Number(user.wallet.debtLimit);

    return this.prisma.$transaction(async (tx) => {
      // Cập nhật lại số dư nợ
      await tx.userWallet.update({
        where: { userId: user.id },
        data: {
          debtBalance: newDebt,
          debtDueDate: newDebt === 0 ? null : user.wallet?.debtDueDate,
        },
      });

      // Nếu đã thanh toán dưới hạn mức cho phép -> Tự động MỞ KHÓA TÀI KHOẢN
      let unlocked = false;
      if (newDebt <= debtLimit && user.status === UserStatus.DEBT_LOCKED) {
        await tx.user.update({
          where: { id: user.id },
          data: { status: UserStatus.ACTIVE },
        });
        unlocked = true;
      }

      return {
        success: true,
        message: `Đã nộp thành công ${paidAmount.toLocaleString('vi-VN')} đ hoa hồng.`,
        remainingDebt: newDebt,
        appUnlocked: unlocked,
      };
    });
  }
}
