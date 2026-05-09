import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { OtpPurpose } from '../../common/enums/otp-purpose.enum';

export type OtpDocument = HydratedDocument<Otp>;

@Schema({ timestamps: true })
export class Otp {
  @Prop({ required: true, lowercase: true, trim: true })
  email!: string;

  @Prop({ required: true, enum: OtpPurpose })
  purpose!: OtpPurpose;

  @Prop({ required: true })
  codeHash!: string;

  @Prop({ required: true })
  expiresAt!: Date;

  @Prop()
  consumedAt?: Date;

  @Prop({ default: 0 })
  attempts!: number;

  @Prop({ type: Types.ObjectId, ref: 'Member' })
  memberId?: Types.ObjectId;
}

export const OtpSchema = SchemaFactory.createForClass(Otp);

OtpSchema.index({ email: 1, purpose: 1, createdAt: -1 });
OtpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
