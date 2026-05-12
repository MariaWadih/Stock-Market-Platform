import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Member, MemberSchema } from '../members/schemas/member.schema';
import { NotificationsModule } from '../notifications/notifications.module';
import {
  WalletTransaction,
  WalletTransactionSchema,
} from '../wallet/schemas/wallet-transaction.schema';
import { Wallet, WalletSchema } from '../wallet/schemas/wallet.schema';
import {
  WithdrawalRequest,
  WithdrawalRequestSchema,
} from './schemas/withdrawal-request.schema';
import { WithdrawalsController } from './withdrawals.controller';
import { WithdrawalsService } from './withdrawals.service';

@Module({
  imports: [
    NotificationsModule,
    MongooseModule.forFeature([
      { name: WithdrawalRequest.name, schema: WithdrawalRequestSchema },
      { name: Member.name, schema: MemberSchema },
      { name: Wallet.name, schema: WalletSchema },
      { name: WalletTransaction.name, schema: WalletTransactionSchema },
    ]),
  ],
  controllers: [WithdrawalsController],
  providers: [WithdrawalsService],
})
export class WithdrawalsModule {}
