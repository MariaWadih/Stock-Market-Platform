import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Member, MemberSchema } from '../members/schemas/member.schema';
import { NotificationsModule } from '../notifications/notifications.module';
import {
  WalletTransaction,
  WalletTransactionSchema,
} from './schemas/wallet-transaction.schema';
import { Wallet, WalletSchema } from './schemas/wallet.schema';
import {
  WalletAdjustmentAudit,
  WalletAdjustmentAuditSchema,
} from './schemas/wallet-adjustment-audit.schema';
import { WalletController } from './wallet.controller';
import { WalletService } from './wallet.service';

@Module({
  imports: [
    NotificationsModule,
    MongooseModule.forFeature([
      { name: Member.name, schema: MemberSchema },
      { name: Wallet.name, schema: WalletSchema },
      { name: WalletTransaction.name, schema: WalletTransactionSchema },
      {
        name: WalletAdjustmentAudit.name,
        schema: WalletAdjustmentAuditSchema,
      },
    ]),
  ],
  controllers: [WalletController],
  providers: [WalletService],
  exports: [WalletService],
})
export class WalletModule {}
