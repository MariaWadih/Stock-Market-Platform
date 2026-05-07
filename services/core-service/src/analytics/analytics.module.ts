import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Member, MemberSchema } from '../members/schemas/member.schema';
import {
  PortfolioPosition,
  PortfolioPositionSchema,
} from '../portfolio/schemas/portfolio-position.schema';
import { Stock, StockSchema } from '../stocks/schemas/stock.schema';
import { Wallet, WalletSchema } from '../wallet/schemas/wallet.schema';
import { Order, OrderSchema } from '../orders/schemas/order.schema';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Order.name, schema: OrderSchema },
      { name: Wallet.name, schema: WalletSchema },
      { name: PortfolioPosition.name, schema: PortfolioPositionSchema },
      { name: Stock.name, schema: StockSchema },
      { name: Member.name, schema: MemberSchema },
    ]),
  ],
  controllers: [AnalyticsController],
  providers: [AnalyticsService],
})
export class AnalyticsModule {}
