import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { OrderType } from '../../common/enums/order-type.enum';

export type OrderDocument = HydratedDocument<Order>;

@Schema({ timestamps: true })
export class Order {
  @Prop({ required: true, type: Types.ObjectId, ref: 'Member' })
  memberId!: Types.ObjectId;

  @Prop({ required: true, type: Types.ObjectId, ref: 'Stock' })
  stockId!: Types.ObjectId;

  @Prop({ required: true, uppercase: true, trim: true })
  ticker!: string;

  @Prop({ required: true, enum: OrderType })
  type!: OrderType;

  @Prop({ required: true, min: 0 })
  quantity!: number;

  @Prop({ required: true, min: 0 })
  price!: number;

  @Prop({ required: true, min: 0 })
  totalValue!: number;

  @Prop()
  realizedProfitLoss?: number;
}

export const OrderSchema = SchemaFactory.createForClass(Order);

OrderSchema.index({ memberId: 1, createdAt: -1 });
OrderSchema.index({ stockId: 1, createdAt: -1 });
OrderSchema.index({ type: 1, createdAt: -1 });
OrderSchema.index({ stockId: 1, type: 1, createdAt: -1 });
OrderSchema.index({ createdAt: -1, memberId: 1 });
