import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ScheduleModule } from '@nestjs/schedule';
import { Member, MemberSchema } from '../members/schemas/member.schema';
import {
  WithdrawalRequest,
  WithdrawalRequestSchema,
} from '../withdrawals/schemas/withdrawal-request.schema';
import {
  PortfolioPosition,
  PortfolioPositionSchema,
} from '../portfolio/schemas/portfolio-position.schema';
import { Stock, StockSchema } from '../stocks/schemas/stock.schema';
import { Wallet, WalletSchema } from '../wallet/schemas/wallet.schema';
import { Order, OrderSchema } from '../orders/schemas/order.schema';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';
import {
  NegativeWalletAlert,
  NegativeWalletAlertSchema,
} from './schemas/negative-wallet-alert.schema';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    MongooseModule.forFeature([
      { name: Order.name, schema: OrderSchema },
      { name: Wallet.name, schema: WalletSchema },
      { name: PortfolioPosition.name, schema: PortfolioPositionSchema },
      { name: Stock.name, schema: StockSchema },
      { name: Member.name, schema: MemberSchema },
      { name: WithdrawalRequest.name, schema: WithdrawalRequestSchema },
      {
        name: NegativeWalletAlert.name,
        schema: NegativeWalletAlertSchema,
      },
    ]),
  ],
  controllers: [AnalyticsController],
  providers: [AnalyticsService],
})
export class AnalyticsModule {}
