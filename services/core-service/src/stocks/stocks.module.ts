import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Member, MemberSchema } from '../members/schemas/member.schema';
import { NotificationsModule } from '../notifications/notifications.module';
import {
  PriceAlert,
  PriceAlertSchema,
} from '../price-alerts/schemas/price-alert.schema';
import {
  PriceHistory,
  PriceHistorySchema,
} from '../price-history/schemas/price-history.schema';
import { Stock, StockSchema } from './schemas/stock.schema';
import { StocksController } from './stocks.controller';
import { StocksService } from './stocks.service';

@Module({
  imports: [
    NotificationsModule,
    MongooseModule.forFeature([
      { name: Member.name, schema: MemberSchema },
      { name: Stock.name, schema: StockSchema },
      { name: PriceHistory.name, schema: PriceHistorySchema },
      { name: PriceAlert.name, schema: PriceAlertSchema },
    ]),
  ],
  controllers: [StocksController],
  providers: [StocksService],
  exports: [StocksService],
})
export class StocksModule {}
