import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  PortfolioPosition,
  PortfolioPositionSchema,
} from '../portfolio/schemas/portfolio-position.schema';
import { Member, MemberSchema } from '../members/schemas/member.schema';
import { NotificationsModule } from '../notifications/notifications.module';
import { Stock, StockSchema } from '../stocks/schemas/stock.schema';
import {
  WalletTransaction,
  WalletTransactionSchema,
} from '../wallet/schemas/wallet-transaction.schema';
import { Wallet, WalletSchema } from '../wallet/schemas/wallet.schema';
import { Order, OrderSchema } from './schemas/order.schema';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';

@Module({
  imports: [
    NotificationsModule,
    MongooseModule.forFeature([
      { name: Member.name, schema: MemberSchema },
      { name: Order.name, schema: OrderSchema },
      { name: PortfolioPosition.name, schema: PortfolioPositionSchema },
      { name: Wallet.name, schema: WalletSchema },
      { name: WalletTransaction.name, schema: WalletTransactionSchema },
      { name: Stock.name, schema: StockSchema },
    ]),
  ],
  controllers: [OrdersController],
  providers: [OrdersService],
})
export class OrdersModule {}
