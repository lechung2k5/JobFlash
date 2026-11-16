import { Controller, Get, Post, Body, UseGuards, Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { WalletService } from './wallet.service.js';

@ApiTags('Wallet - Ví tiền, Thu 10% hoa hồng & Khóa app')
@Controller('wallet')
export class WalletController {
  constructor(private readonly walletService: WalletService) {}

  @Get('me')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Lấy số dư, công nợ 10% và mã VietQR thanh toán mở khóa app' })
  async getMyWallet(@Request() req: any) {
    return this.walletService.getWalletInfo(req.user.id);
  }

  @Post('webhook/payment-settlement')
  @ApiOperation({ summary: 'Webhook nhận thông báo chuyển khoản ngân hàng tự động mở khóa app' })
  async handlePaymentWebhook(
    @Body('phone') phone: string,
    @Body('paidAmount') paidAmount: number,
  ) {
    return this.walletService.handlePaymentWebhook(phone, paidAmount);
  }
}
