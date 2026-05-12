import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type StockDocument = HydratedDocument<Stock>;

@Schema({ timestamps: true })
export class Stock {
  @Prop({ required: true, uppercase: true, trim: true })
  ticker!: string;

  @Prop({ required: true, trim: true })
  companyName!: string;

  @Prop({ required: true, trim: true })
  sector!: string;

  @Prop({ required: true, min: 0 })
  currentPrice!: number;

  @Prop({ required: true, trim: true })
  description!: string;

  @Prop({ min: 0 })
  marketCap?: number;

  @Prop({ min: 0 })
  peRatio?: number;

  @Prop({ min: 0 })
  dividendYield?: number;

  @Prop({ default: true })
  isListed!: boolean;
}

export const StockSchema = SchemaFactory.createForClass(Stock);

StockSchema.index({ ticker: 1 }, { unique: true });
StockSchema.index({ sector: 1, isListed: 1 });
StockSchema.index({ isListed: 1, createdAt: -1 });
