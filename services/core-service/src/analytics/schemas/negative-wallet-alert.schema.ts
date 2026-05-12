import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type NegativeWalletAlertDocument = HydratedDocument<NegativeWalletAlert>;

@Schema({ timestamps: true })
export class NegativeWalletAlert {
  @Prop({ required: true, type: Types.ObjectId, ref: 'Member' })
  memberId!: Types.ObjectId;

  @Prop({ required: true, type: Types.ObjectId, ref: 'Wallet' })
  walletId!: Types.ObjectId;

  @Prop({ required: true })
  balance!: number;

  @Prop({ required: true })
  detectedAt!: Date;

  @Prop({ default: true })
  isActive!: boolean;
}

export const NegativeWalletAlertSchema =
  SchemaFactory.createForClass(NegativeWalletAlert);

NegativeWalletAlertSchema.index({ isActive: 1, detectedAt: -1 });
NegativeWalletAlertSchema.index({ memberId: 1, isActive: 1 });
