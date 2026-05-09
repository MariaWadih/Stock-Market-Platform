import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type PriceAlertDocument = HydratedDocument<PriceAlert>;

@Schema({ timestamps: true })
export class PriceAlert {
  @Prop({ required: true, type: Types.ObjectId, ref: 'Member' })
  memberId!: Types.ObjectId;

  @Prop({ required: true, type: Types.ObjectId, ref: 'Stock' })
  stockId!: Types.ObjectId;

  @Prop({ required: true, uppercase: true, trim: true })
  ticker!: string;

  @Prop({ required: true, min: 0 })
  thresholdPrice!: number;

  @Prop({ default: false })
  isTriggered!: boolean;

  @Prop()
  triggeredAt?: Date;
}

export const PriceAlertSchema = SchemaFactory.createForClass(PriceAlert);

PriceAlertSchema.index({ memberId: 1, createdAt: -1 });
PriceAlertSchema.index({ stockId: 1, isTriggered: 1 });
PriceAlertSchema.index({ memberId: 1, stockId: 1, isTriggered: 1 });
