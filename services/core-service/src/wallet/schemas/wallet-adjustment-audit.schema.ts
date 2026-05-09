import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type WalletAdjustmentAuditDocument =
  HydratedDocument<WalletAdjustmentAudit>;

@Schema({ timestamps: true })
export class WalletAdjustmentAudit {
  @Prop({ required: true, type: Types.ObjectId, ref: 'Member' })
  memberId!: Types.ObjectId;

  @Prop({ required: true, type: Types.ObjectId, ref: 'Wallet' })
  walletId!: Types.ObjectId;

  @Prop({ required: true, type: Types.ObjectId, ref: 'CmsUser' })
  adjustedBy!: Types.ObjectId;

  @Prop({ required: true })
  previousBalance!: number;

  @Prop({ required: true })
  adjustmentAmount!: number;

  @Prop({ required: true })
  newBalance!: number;

  @Prop({ required: true, trim: true })
  justification!: string;
}

export const WalletAdjustmentAuditSchema = SchemaFactory.createForClass(
  WalletAdjustmentAudit,
);

WalletAdjustmentAuditSchema.index({ memberId: 1, createdAt: -1 });
WalletAdjustmentAuditSchema.index({ adjustedBy: 1, createdAt: -1 });
