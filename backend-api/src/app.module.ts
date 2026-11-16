import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module.js';
import { AuthModule } from './modules/auth/auth.module.js';
import { UsersModule } from './modules/users/users.module.js';
import { JobsModule } from './modules/jobs/jobs.module.js';
import { WalletModule } from './modules/wallet/wallet.module.js';
import { RealtimeModule } from './modules/realtime/realtime.module.js';
import { UploadModule } from './modules/upload/upload.module.js';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '../.env'],
    }),
    PrismaModule,
    AuthModule,
    UsersModule,
    JobsModule,
    WalletModule,
    RealtimeModule,
    UploadModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
