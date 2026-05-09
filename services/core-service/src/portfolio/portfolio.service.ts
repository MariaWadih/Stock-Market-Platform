import { ForbiddenException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { AuthenticatedUser } from '../common/types/authenticated-user';
import { roundMoney } from '../common/utils/money.util';
import { Stock, StockDocument } from '../stocks/schemas/stock.schema';
import {
  PortfolioPosition,
  PortfolioPositionDocument,
} from './schemas/portfolio-position.schema';

@Injectable()
export class PortfolioService {
  constructor(
    @InjectModel(PortfolioPosition.name)
    private readonly portfolioPositionModel: Model<PortfolioPositionDocument>,
    @InjectModel(Stock.name)
    private readonly stockModel: Model<StockDocument>,
  ) {}

  async getMyPortfolio(user: AuthenticatedUser) {
    if (user.type !== 'member') {
      throw new ForbiddenException(
        'Only members can access portfolio endpoints',
      );
    }

    const positions = await this.portfolioPositionModel
      .find({ memberId: new Types.ObjectId(user.sub), quantity: { $gt: 0 } })
      .sort({ ticker: 1 });
    const stockIds = positions.map((position) => position.stockId);
    const stocks = await this.stockModel.find({ _id: { $in: stockIds } });
    const stockById = new Map(
      stocks.map((stock) => [
        stock._id.toString(),
        {
          currentPrice: stock.currentPrice,
          companyName: stock.companyName,
          sector: stock.sector,
        },
      ]),
    );

    const holdings = positions.map((position) => {
      const stock = stockById.get(position.stockId.toString());
      const currentPrice = stock?.currentPrice ?? position.averagePrice;
      const marketValue = roundMoney(position.quantity * currentPrice);
      const unrealizedProfitLoss = roundMoney(
        (currentPrice - position.averagePrice) * position.quantity,
      );

      return {
        id: position.id,
        stockId: position.stockId,
        ticker: position.ticker,
        companyName: stock?.companyName,
        sector: stock?.sector,
        quantity: position.quantity,
        averagePrice: position.averagePrice,
        currentPrice,
        marketValue,
        unrealizedProfitLoss,
      };
    });
    const totalMarketValue = roundMoney(
      holdings.reduce((sum, holding) => sum + holding.marketValue, 0),
    );

    return { totalMarketValue, holdings };
  }
}
