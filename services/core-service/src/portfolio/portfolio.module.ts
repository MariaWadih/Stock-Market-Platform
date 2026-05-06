import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Stock, StockSchema } from '../stocks/schemas/stock.schema';
import { PortfolioController } from './portfolio.controller';
import { PortfolioService } from './portfolio.service';
import {
  PortfolioPosition,
  PortfolioPositionSchema,
} from './schemas/portfolio-position.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: PortfolioPosition.name, schema: PortfolioPositionSchema },
      { name: Stock.name, schema: StockSchema },
    ]),
  ],
  controllers: [PortfolioController],
  providers: [PortfolioService],
})
export class PortfolioModule {}
