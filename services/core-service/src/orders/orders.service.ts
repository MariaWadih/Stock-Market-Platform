import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { OrderType } from '../common/enums/order-type.enum';
import { TransactionStatus } from '../common/enums/transaction-status.enum';
import { TransactionType } from '../common/enums/transaction-type.enum';
import { AuthenticatedUser } from '../common/types/authenticated-user';
import { roundMoney } from '../common/utils/money.util';
import {
  PortfolioPosition,
  PortfolioPositionDocument,
} from '../portfolio/schemas/portfolio-position.schema';
import { Stock, StockDocument } from '../stocks/schemas/stock.schema';
import {
  WalletTransaction,
  WalletTransactionDocument,
} from '../wallet/schemas/wallet-transaction.schema';
import { Wallet, WalletDocument } from '../wallet/schemas/wallet.schema';
import { CreateOrderDto } from './dto/create-order.dto';
import { Order, OrderDocument } from './schemas/order.schema';

@Injectable()
export class OrdersService {
  constructor(
    @InjectModel(Order.name)
    private readonly orderModel: Model<OrderDocument>,
    @InjectModel(PortfolioPosition.name)
    private readonly portfolioPositionModel: Model<PortfolioPositionDocument>,
    @InjectModel(Wallet.name)
    private readonly walletModel: Model<WalletDocument>,
    @InjectModel(WalletTransaction.name)
    private readonly walletTransactionModel: Model<WalletTransactionDocument>,
    @InjectModel(Stock.name)
    private readonly stockModel: Model<StockDocument>,
  ) {}

  async buy(user: AuthenticatedUser, dto: CreateOrderDto) {
    this.assertMember(user);
    const memberId = new Types.ObjectId(user.sub);
    const stock = await this.stockModel.findOne({
      _id: dto.stockId,
      isListed: true,
    });

    if (!stock) {
      throw new NotFoundException('Listed stock not found');
    }

    const totalValue = roundMoney(stock.currentPrice * dto.quantity);
    const wallet = await this.walletModel.findOneAndUpdate(
      { memberId, balance: { $gte: totalValue } },
      { $inc: { balance: -totalValue } },
      { returnDocument: 'after' },
    );

    if (!wallet) {
      throw new BadRequestException('Insufficient wallet balance');
    }

    const order = await this.orderModel.create({
      memberId,
      stockId: stock._id,
      ticker: stock.ticker,
      type: OrderType.Buy,
      quantity: dto.quantity,
      price: stock.currentPrice,
      totalValue,
    });

    await this.applyBuyToPosition(memberId, stock, dto.quantity);
    await this.walletTransactionModel.create({
      memberId,
      walletId: wallet._id,
      type: TransactionType.Buy,
      status: TransactionStatus.Completed,
      amount: totalValue,
      stockId: stock._id,
      orderId: order._id,
      description: `Bought ${dto.quantity} shares of ${stock.ticker}`,
    });

    return order;
  }

  async sell(user: AuthenticatedUser, dto: CreateOrderDto) {
    this.assertMember(user);
    const memberId = new Types.ObjectId(user.sub);
    const stock = await this.stockModel.findById(dto.stockId);

    if (!stock) {
      throw new NotFoundException('Stock not found');
    }

    const position = await this.portfolioPositionModel.findOne({
      memberId,
      stockId: stock._id,
      quantity: { $gte: dto.quantity },
    });

    if (!position) {
      throw new BadRequestException('Insufficient shares for sell order');
    }

    const totalValue = roundMoney(stock.currentPrice * dto.quantity);
    const realizedProfitLoss = roundMoney(
      (stock.currentPrice - position.averagePrice) * dto.quantity,
    );
    const wallet = await this.walletModel.findOneAndUpdate(
      { memberId },
      {
        $inc: { balance: totalValue },
        $setOnInsert: { memberId },
      },
      { upsert: true, returnDocument: 'after' },
    );

    if (!wallet) {
      throw new NotFoundException('Wallet not found');
    }

    const order = await this.orderModel.create({
      memberId,
      stockId: stock._id,
      ticker: stock.ticker,
      type: OrderType.Sell,
      quantity: dto.quantity,
      price: stock.currentPrice,
      totalValue,
      realizedProfitLoss,
    });

    await this.applySellToPosition(position, dto.quantity);
    await this.walletTransactionModel.create({
      memberId,
      walletId: wallet._id,
      type: TransactionType.Sell,
      status: TransactionStatus.Completed,
      amount: totalValue,
      stockId: stock._id,
      orderId: order._id,
      description: `Sold ${dto.quantity} shares of ${stock.ticker}`,
    });

    return order;
  }

  async listMyOrders(user: AuthenticatedUser) {
    this.assertMember(user);

    return this.orderModel
      .find({ memberId: new Types.ObjectId(user.sub) })
      .sort({ createdAt: -1 });
  }

  private async applyBuyToPosition(
    memberId: Types.ObjectId,
    stock: StockDocument,
    quantity: number,
  ): Promise<void> {
    const position = await this.portfolioPositionModel.findOne({
      memberId,
      stockId: stock._id,
    });

    if (!position) {
      await this.portfolioPositionModel.create({
        memberId,
        stockId: stock._id,
        ticker: stock.ticker,
        quantity,
        averagePrice: stock.currentPrice,
      });
      return;
    }

    const totalCost =
      position.averagePrice * position.quantity + stock.currentPrice * quantity;
    const newQuantity = position.quantity + quantity;
    position.quantity = newQuantity;
    position.averagePrice = roundMoney(totalCost / newQuantity);
    position.ticker = stock.ticker;
    await position.save();
  }

  private async applySellToPosition(
    position: PortfolioPositionDocument,
    quantity: number,
  ): Promise<void> {
    const remainingQuantity = position.quantity - quantity;

    if (remainingQuantity <= 0) {
      await this.portfolioPositionModel.deleteOne({ _id: position._id });
      return;
    }

    position.quantity = remainingQuantity;
    await position.save();
  }

  private assertMember(user: AuthenticatedUser): void {
    if (user.type !== 'member') {
      throw new ForbiddenException('Only members can place orders');
    }
  }
}
