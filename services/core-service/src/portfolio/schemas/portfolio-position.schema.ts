import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type PortfolioPositionDocument = HydratedDocument<PortfolioPosition>;

@Schema({ timestamps: true })
export class PortfolioPosition {
  @Prop({ required: true, type: Types.ObjectId, ref: 'Member' })
  memberId!: Types.ObjectId;

  @Prop({ required: true, type: Types.ObjectId, ref: 'Stock' })
  stockId!: Types.ObjectId;

  @Prop({ required: true, uppercase: true, trim: true })
  ticker!: string;

  @Prop({ required: true, min: 0 })
  quantity!: number;

  @Prop({ required: true, min: 0 })
  averagePrice!: number;
}

export const PortfolioPositionSchema =
  SchemaFactory.createForClass(PortfolioPosition);

PortfolioPositionSchema.index({ memberId: 1, stockId: 1 }, { unique: true });
PortfolioPositionSchema.index({ memberId: 1, createdAt: -1 });
PortfolioPositionSchema.index({ stockId: 1 });
PortfolioPositionSchema.index({ quantity: 1, stockId: 1 });
