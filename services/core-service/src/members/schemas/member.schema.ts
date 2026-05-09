import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { IdentityVerificationStatus } from '../../common/enums/identity-verification-status.enum';
import { MemberStatus } from '../../common/enums/member-status.enum';

export type MemberDocument = HydratedDocument<Member>;

@Schema({ timestamps: true })
export class Member {
  @Prop({ required: true, trim: true })
  fullName!: string;

  @Prop({ required: true, lowercase: true, trim: true })
  email!: string;

  @Prop({ required: true, trim: true })
  nationalId!: string;

  @Prop({ required: true })
  dateOfBirth!: Date;

  @Prop()
  passwordHash?: string;

  @Prop({ default: false })
  isEmailVerified!: boolean;

  @Prop({
    enum: IdentityVerificationStatus,
    default: IdentityVerificationStatus.Pending,
  })
  identityVerificationStatus!: IdentityVerificationStatus;

  @Prop({ enum: MemberStatus, default: MemberStatus.Active })
  status!: MemberStatus;

  @Prop()
  suspensionReason?: string;
}

export const MemberSchema = SchemaFactory.createForClass(Member);

MemberSchema.index({ email: 1 }, { unique: true });
MemberSchema.index({ nationalId: 1 }, { unique: true });
MemberSchema.index({ status: 1, createdAt: -1 });
MemberSchema.index({ identityVerificationStatus: 1, createdAt: -1 });
