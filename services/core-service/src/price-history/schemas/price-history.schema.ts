import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type PriceHistoryDocument = HydratedDocument<PriceHistory>;

@Schema({ timestamps: true })
export class PriceHistory {
  @Prop({ required: true, type: Types.ObjectId, ref: 'Stock' })
  stockId!: Types.ObjectId;

  @Prop({ required: true, uppercase: true, trim: true })
  ticker!: string;

  @Prop({ required: true, min: 0 })
  price!: number;

  @Prop({ required: true, default: Date.now })
  recordedAt!: Date;
}

export const PriceHistorySchema = SchemaFactory.createForClass(PriceHistory);

PriceHistorySchema.index({ stockId: 1, recordedAt: -1 });
PriceHistorySchema.index({ ticker: 1, recordedAt: -1 });
