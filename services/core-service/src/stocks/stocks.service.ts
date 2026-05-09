import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Member, MemberDocument } from '../members/schemas/member.schema';
import { NotificationEventType } from '../notifications/notification-event';
import { NotificationsService } from '../notifications/notifications.service';
import {
  PriceAlert,
  PriceAlertDocument,
} from '../price-alerts/schemas/price-alert.schema';
import {
  PriceHistory,
  PriceHistoryDocument,
} from '../price-history/schemas/price-history.schema';
import { CreateStockDto } from './dto/create-stock.dto';
import { UpdateStockPriceDto } from './dto/update-stock-price.dto';
import { UpdateStockDto } from './dto/update-stock.dto';
import { Stock, StockDocument } from './schemas/stock.schema';

@Injectable()
export class StocksService {
  constructor(
    @InjectModel(Stock.name)
    private readonly stockModel: Model<StockDocument>,
    @InjectModel(PriceHistory.name)
    private readonly priceHistoryModel: Model<PriceHistoryDocument>,
    @InjectModel(PriceAlert.name)
    private readonly priceAlertModel: Model<PriceAlertDocument>,
    @InjectModel(Member.name)
    private readonly memberModel: Model<MemberDocument>,
    private readonly notificationsService: NotificationsService,
  ) {}

  async createStock(dto: CreateStockDto) {
    const ticker = this.normalizeTicker(dto.ticker);
    const existingStock = await this.stockModel.exists({ ticker });

    if (existingStock) {
      throw new ConflictException('Stock with this ticker already exists');
    }

    const stock = await this.stockModel.create({
      ...dto,
      ticker,
      sector: dto.sector.trim(),
      isListed: dto.isListed ?? true,
    });

    await this.recordPriceHistory(stock);

    return stock;
  }

  async listListedStocks() {
    return this.stockModel.find({ isListed: true }).sort({ ticker: 1 });
  }

  async listAllStocksForCms() {
    return this.stockModel.find().sort({ createdAt: -1 });
  }

  async getListedStock(stockId: string) {
    const stock = await this.stockModel.findOne({
      _id: stockId,
      isListed: true,
    });

    if (!stock) {
      throw new NotFoundException('Listed stock not found');
    }

    return stock;
  }

  async getStockForCms(stockId: string) {
    const stock = await this.stockModel.findById(stockId);

    if (!stock) {
      throw new NotFoundException('Stock not found');
    }

    return stock;
  }

  async updateStock(stockId: string, dto: UpdateStockDto) {
    const existingStock = await this.stockModel.findById(stockId);

    if (!existingStock) {
      throw new NotFoundException('Stock not found');
    }

    const update: Partial<Stock> = {};
    if (dto.ticker !== undefined) {
      const ticker = this.normalizeTicker(dto.ticker);
      const tickerOwner = await this.stockModel.exists({
        _id: { $ne: stockId },
        ticker,
      });

      if (tickerOwner) {
        throw new ConflictException('Stock with this ticker already exists');
      }

      update.ticker = ticker;
    }

    if (dto.companyName !== undefined) update.companyName = dto.companyName;
    if (dto.sector !== undefined) update.sector = dto.sector.trim();
    if (dto.description !== undefined) update.description = dto.description;
    if (dto.marketCap !== undefined) update.marketCap = dto.marketCap;
    if (dto.peRatio !== undefined) update.peRatio = dto.peRatio;
    if (dto.dividendYield !== undefined) {
      update.dividendYield = dto.dividendYield;
    }
    if (dto.isListed !== undefined) update.isListed = dto.isListed;

    const priceChanged =
      dto.currentPrice !== undefined &&
      dto.currentPrice !== existingStock.currentPrice;
    if (dto.currentPrice !== undefined) update.currentPrice = dto.currentPrice;

    const stock = await this.stockModel.findByIdAndUpdate(
      stockId,
      { $set: update },
      { returnDocument: 'after' },
    );

    if (!stock) {
      throw new NotFoundException('Stock not found');
    }

    if (priceChanged) {
      await this.recordPriceHistory(stock);
      await this.triggerCrossedAlerts(
        stock._id,
        stock.ticker,
        existingStock.currentPrice,
        stock.currentPrice,
      );
    }

    return stock;
  }

  async updateStockPrice(stockId: string, dto: UpdateStockPriceDto) {
    const stock = await this.stockModel.findById(stockId);

    if (!stock) {
      throw new NotFoundException('Stock not found');
    }

    const previousPrice = stock.currentPrice;
    stock.currentPrice = dto.currentPrice;
    await stock.save();
    await this.recordPriceHistory(stock);
    await this.triggerCrossedAlerts(
      stock._id,
      stock.ticker,
      previousPrice,
      stock.currentPrice,
    );

    return stock;
  }

  async delistStock(stockId: string) {
    const stock = await this.stockModel.findByIdAndUpdate(
      stockId,
      { $set: { isListed: false } },
      { returnDocument: 'after' },
    );

    if (!stock) {
      throw new NotFoundException('Stock not found');
    }

    return stock;
  }

  async getPriceHistory(stockId: string) {
    const stockExists = await this.stockModel.exists({ _id: stockId });
    if (!stockExists) {
      throw new NotFoundException('Stock not found');
    }

    return this.priceHistoryModel.find({ stockId }).sort({ recordedAt: 1 });
  }

  private async recordPriceHistory(stock: StockDocument): Promise<void> {
    await this.priceHistoryModel.create({
      stockId: stock._id,
      ticker: stock.ticker,
      price: stock.currentPrice,
      recordedAt: new Date(),
    });
  }

  private async triggerCrossedAlerts(
    stockId: Types.ObjectId,
    ticker: string,
    previousPrice: number,
    currentPrice: number,
  ): Promise<void> {
    if (previousPrice === currentPrice) {
      return;
    }

    const minPrice = Math.min(previousPrice, currentPrice);
    const maxPrice = Math.max(previousPrice, currentPrice);

    const alerts = await this.priceAlertModel
      .find({
        stockId,
        isTriggered: false,
        thresholdPrice: { $gte: minPrice, $lte: maxPrice },
      })
      .exec();

    if (alerts.length === 0) {
      return;
    }

    await this.priceAlertModel.updateMany(
      { _id: { $in: alerts.map((alert) => alert._id) } },
      {
        $set: {
          isTriggered: true,
          triggeredAt: new Date(),
          ticker,
        },
      },
    );

    const members = await this.memberModel
      .find({ _id: { $in: alerts.map((alert) => alert.memberId) } })
      .select('email fullName')
      .exec();
    const memberById = new Map(
      members.map((member) => [member._id.toString(), member]),
    );

    await Promise.all(
      alerts.map(async (alert) => {
        const member = memberById.get(alert.memberId.toString());

        if (!member) {
          return;
        }

        await this.notificationsService.publish({
          type: NotificationEventType.PriceAlertTriggered,
          occurredAt: new Date().toISOString(),
          payload: {
            email: member.email,
            fullName: member.fullName,
            ticker,
            thresholdPrice: alert.thresholdPrice,
            currentPrice,
          },
        });
      }),
    );
  }

  private normalizeTicker(ticker: string): string {
    return ticker.trim().toUpperCase();
  }
}
