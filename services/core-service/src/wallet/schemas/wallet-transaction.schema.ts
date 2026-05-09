import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { TransactionStatus } from '../../common/enums/transaction-status.enum';
import { TransactionType } from '../../common/enums/transaction-type.enum';

export type WalletTransactionDocument = HydratedDocument<WalletTransaction>;

@Schema({ timestamps: true })
export class WalletTransaction {
  @Prop({ required: true, type: Types.ObjectId, ref: 'Member' })
  memberId!: Types.ObjectId;

  @Prop({ required: true, type: Types.ObjectId, ref: 'Wallet' })
  walletId!: Types.ObjectId;

  @Prop({ required: true, enum: TransactionType })
  type!: TransactionType;

  @Prop({ required: true, enum: TransactionStatus })
  status!: TransactionStatus;

  @Prop({ required: true, min: 0 })
  amount!: number;

  @Prop()
  description?: string;

  @Prop({ type: Types.ObjectId, ref: 'Stock' })
  stockId?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Order' })
  orderId?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'WithdrawalRequest' })
  withdrawalRequestId?: Types.ObjectId;
}

export const WalletTransactionSchema =
  SchemaFactory.createForClass(WalletTransaction);

WalletTransactionSchema.index({ memberId: 1, createdAt: -1 });
WalletTransactionSchema.index({ memberId: 1, type: 1, createdAt: -1 });
WalletTransactionSchema.index({ type: 1, status: 1, createdAt: -1 });
