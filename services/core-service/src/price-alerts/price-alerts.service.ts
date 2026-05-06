import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { AuthenticatedUser } from '../common/types/authenticated-user';
import { Stock, StockDocument } from '../stocks/schemas/stock.schema';
import { CreatePriceAlertDto } from './dto/create-price-alert.dto';
import { PriceAlert, PriceAlertDocument } from './schemas/price-alert.schema';

@Injectable()
export class PriceAlertsService {
  constructor(
    @InjectModel(PriceAlert.name)
    private readonly priceAlertModel: Model<PriceAlertDocument>,
    @InjectModel(Stock.name)
    private readonly stockModel: Model<StockDocument>,
  ) {}

  async createPriceAlert(user: AuthenticatedUser, dto: CreatePriceAlertDto) {
    this.assertMember(user);

    const stock = await this.stockModel.findOne({
      _id: dto.stockId,
      isListed: true,
    });

    if (!stock) {
      throw new NotFoundException('Listed stock not found');
    }

    return this.priceAlertModel.create({
      memberId: new Types.ObjectId(user.sub),
      stockId: stock._id,
      ticker: stock.ticker,
      thresholdPrice: dto.thresholdPrice,
    });
  }

  async listMemberPriceAlerts(user: AuthenticatedUser) {
    this.assertMember(user);
    const memberId = new Types.ObjectId(user.sub);

    return this.priceAlertModel.find({ memberId }).sort({ createdAt: -1 });
  }

  async deletePriceAlert(user: AuthenticatedUser, alertId: string) {
    this.assertMember(user);
    const memberId = new Types.ObjectId(user.sub);

    const alert = await this.priceAlertModel.findOneAndDelete({
      _id: alertId,
      memberId,
    });

    if (!alert) {
      throw new NotFoundException('Price alert not found');
    }

    return { message: 'Price alert deleted successfully' };
  }

  private assertMember(user: AuthenticatedUser): void {
    if (user.type !== 'member') {
      throw new ForbiddenException('Only members can manage price alerts');
    }
  }
}
