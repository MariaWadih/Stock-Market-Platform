import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { MemberStatus } from '../../common/enums/member-status.enum';

export type MemberStatusAuditDocument = HydratedDocument<MemberStatusAudit>;

@Schema({ timestamps: true })
export class MemberStatusAudit {
  @Prop({ required: true, type: Types.ObjectId, ref: 'Member' })
  memberId!: Types.ObjectId;

  @Prop({ required: true, type: Types.ObjectId, ref: 'CmsUser' })
  changedBy!: Types.ObjectId;

  @Prop({ required: true, enum: MemberStatus })
  fromStatus!: MemberStatus;

  @Prop({ required: true, enum: MemberStatus })
  toStatus!: MemberStatus;

  @Prop({ required: true, trim: true })
  reason!: string;
}

export const MemberStatusAuditSchema =
  SchemaFactory.createForClass(MemberStatusAudit);

MemberStatusAuditSchema.index({ memberId: 1, createdAt: -1 });
MemberStatusAuditSchema.index({ changedBy: 1, createdAt: -1 });
