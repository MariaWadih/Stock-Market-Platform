import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, PipelineStage, Types } from 'mongoose';
import { Member, MemberDocument } from '../members/schemas/member.schema';
import {
  PortfolioPosition,
  PortfolioPositionDocument,
} from '../portfolio/schemas/portfolio-position.schema';
import { Stock, StockDocument } from '../stocks/schemas/stock.schema';
import { Wallet, WalletDocument } from '../wallet/schemas/wallet.schema';
import { Order, OrderDocument } from '../orders/schemas/order.schema';
import { roundMoney } from '../common/utils/money.util';
import { ActiveMembersQueryDto } from './dto/active-members-query.dto';
import { AnalyticsPaginationQueryDto } from './dto/analytics-pagination-query.dto';
import { AnalyticsGranularity } from './dto/trading-volume-query.dto';

export interface TradingVolumeResult {
  date: string;
  sharesTraded: number;
  totalValue: number;
}

export interface TopTradedStockResult {
  stockId: Types.ObjectId;
  ticker: string;
  companyName?: string;
  tradeCount: number;
  totalVolume: number;
}

interface PaginatedAggregationResult<T> {
  metadata: [{ total: number }] | [];
  data: T[];
}

interface AumAggregationResult {
  totalAum: number;
}

export interface ActiveMemberResult {
  memberId: Types.ObjectId;
  displayName?: string;
  email?: string;
  tradeCount: number;
}

interface SectorAllocationAggregationResult {
  sector: string;
  totalCurrentValue: number;
}

interface TradingVolumeQuery {
  stock_id: string;
  granularity: AnalyticsGranularity;
  from: Date;
  to: Date;
}

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectModel(Order.name)
    private readonly orderModel: Model<OrderDocument>,
    @InjectModel(Wallet.name)
    private readonly walletModel: Model<WalletDocument>,
    @InjectModel(PortfolioPosition.name)
    private readonly portfolioPositionModel: Model<PortfolioPositionDocument>,
    @InjectModel(Stock.name)
    private readonly stockModel: Model<StockDocument>,
    @InjectModel(Member.name)
    private readonly memberModel: Model<MemberDocument>,
  ) {}

  async getTradingVolume(
    query: TradingVolumeQuery,
  ): Promise<TradingVolumeResult[]> {
    const dateRange = this.parseDateRange(query.from, query.to);
    const dateFormat =
      query.granularity === AnalyticsGranularity.Month ? '%Y-%m' : '%Y-%m-%d';

    return this.orderModel
      .aggregate<TradingVolumeResult>([
        {
          $match: {
            stockId: new Types.ObjectId(query.stock_id),
            createdAt: dateRange,
          },
        },
        {
          $group: {
            _id: {
              $dateToString: {
                format: dateFormat,
                date: '$createdAt',
              },
            },
            sharesTraded: { $sum: '$quantity' },
            totalValue: { $sum: '$totalValue' },
          },
        },
        {
          $project: {
            _id: 0,
            date: '$_id',
            sharesTraded: 1,
            totalValue: { $round: ['$totalValue', 2] },
          },
        },
        { $sort: { date: 1 } },
      ])
      .exec();
  }

  async getTopTradedStocks(query: AnalyticsPaginationQueryDto) {
    const { limit, page } = query;
    const skip = (page - 1) * limit;
    const [result] = await this.orderModel
      .aggregate<PaginatedAggregationResult<TopTradedStockResult>>([
        {
          $group: {
            _id: '$stockId',
            ticker: { $last: '$ticker' },
            tradeCount: { $sum: 1 },
            totalVolume: { $sum: '$quantity' },
          },
        },
        { $sort: { tradeCount: -1, totalVolume: -1, ticker: 1 } },
        {
          $lookup: {
            from: this.stockModel.collection.name,
            localField: '_id',
            foreignField: '_id',
            as: 'stock',
          },
        },
        { $unwind: { path: '$stock', preserveNullAndEmptyArrays: true } },
        {
          $project: {
            _id: 0,
            stockId: '$_id',
            ticker: 1,
            companyName: '$stock.companyName',
            tradeCount: 1,
            totalVolume: 1,
          },
        },
        {
          $facet: {
            metadata: [{ $count: 'total' }],
            data: [{ $skip: skip }, { $limit: limit }],
          },
        },
      ])
      .exec();
    const total = result?.metadata[0]?.total ?? 0;

    return {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      data: result?.data ?? [],
    };
  }

  async getAssetsUnderManagement() {
    const [result] = await this.walletModel
      .aggregate<AumAggregationResult>(this.buildAumPipeline())
      .exec();

    return { totalAum: roundMoney(result?.totalAum ?? 0) };
  }

  async getMostActiveMembers(
    query: ActiveMembersQueryDto,
  ): Promise<ActiveMemberResult[]> {
    const from = new Date();
    from.setDate(from.getDate() - query.days);

    return this.orderModel
      .aggregate<ActiveMemberResult>([
        { $match: { createdAt: { $gte: from } } },
        {
          $group: {
            _id: '$memberId',
            tradeCount: { $sum: 1 },
          },
        },
        { $sort: { tradeCount: -1 } },
        { $limit: query.limit },
        {
          $lookup: {
            from: this.memberModel.collection.name,
            localField: '_id',
            foreignField: '_id',
            as: 'member',
          },
        },
        { $unwind: { path: '$member', preserveNullAndEmptyArrays: true } },
        {
          $project: {
            _id: 0,
            memberId: '$_id',
            displayName: '$member.fullName',
            email: '$member.email',
            tradeCount: 1,
          },
        },
      ])
      .exec();
  }

  async getSectorAllocation() {
    const [aum] = await this.walletModel
      .aggregate<AumAggregationResult>(this.buildAumPipeline())
      .exec();
    const totalAum = aum?.totalAum ?? 0;
    const sectors = await this.portfolioPositionModel
      .aggregate<SectorAllocationAggregationResult>([
        { $match: { quantity: { $gt: 0 } } },
        {
          $lookup: {
            from: this.stockModel.collection.name,
            localField: 'stockId',
            foreignField: '_id',
            as: 'stock',
          },
        },
        { $unwind: '$stock' },
        {
          $group: {
            _id: '$stock.sector',
            totalCurrentValue: {
              $sum: { $multiply: ['$quantity', '$stock.currentPrice'] },
            },
          },
        },
        {
          $project: {
            _id: 0,
            sector: '$_id',
            totalCurrentValue: { $round: ['$totalCurrentValue', 2] },
          },
        },
        { $sort: { totalCurrentValue: -1, sector: 1 } },
      ])
      .exec();

    return sectors.map((sector) => ({
      ...sector,
      percentageOfAum:
        totalAum > 0
          ? roundMoney((sector.totalCurrentValue / totalAum) * 100)
          : 0,
    }));
  }

  private buildAumPipeline(): PipelineStage[] {
    return [
      {
        $project: {
          value: '$balance',
        },
      },
      {
        $unionWith: {
          coll: this.portfolioPositionModel.collection.name,
          pipeline: [
            { $match: { quantity: { $gt: 0 } } },
            {
              $lookup: {
                from: this.stockModel.collection.name,
                localField: 'stockId',
                foreignField: '_id',
                as: 'stock',
              },
            },
            { $unwind: '$stock' },
            {
              $project: {
                value: { $multiply: ['$quantity', '$stock.currentPrice'] },
              },
            },
          ],
        },
      },
      {
        $group: {
          _id: null,
          totalAum: { $sum: '$value' },
        },
      },
      {
        $project: {
          _id: 0,
          totalAum: { $round: ['$totalAum', 2] },
        },
      },
    ];
  }

  private parseDateRange(from: Date, to: Date) {
    if (from > to) {
      throw new BadRequestException('from must be before or equal to to');
    }

    return { $gte: from, $lte: to };
  }
}
