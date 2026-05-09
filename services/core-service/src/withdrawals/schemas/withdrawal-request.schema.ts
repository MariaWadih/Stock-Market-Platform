import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { WithdrawalStatus } from '../../common/enums/withdrawal-status.enum';

export type WithdrawalRequestDocument = HydratedDocument<WithdrawalRequest>;

@Schema({ timestamps: true })
export class WithdrawalRequest {
  @Prop({ required: true, type: Types.ObjectId, ref: 'Member' })
  memberId!: Types.ObjectId;

  @Prop({ required: true, min: 0 })
  amount!: number;

  @Prop({
    required: true,
    enum: WithdrawalStatus,
    default: WithdrawalStatus.Pending,
  })
  status!: WithdrawalStatus;

  @Prop({ type: Types.ObjectId, ref: 'CmsUser' })
  reviewedBy?: Types.ObjectId;

  @Prop()
  reviewedAt?: Date;

  @Prop()
  rejectionReason?: string;
}

export const WithdrawalRequestSchema =
  SchemaFactory.createForClass(WithdrawalRequest);

WithdrawalRequestSchema.index({ memberId: 1, createdAt: -1 });
WithdrawalRequestSchema.index({ status: 1, createdAt: -1 });
