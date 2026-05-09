import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { CmsRole } from '../../common/enums/cms-role.enum';

export type CmsUserDocument = HydratedDocument<CmsUser>;

@Schema({ timestamps: true })
export class CmsUser {
  @Prop({ required: true, trim: true })
  fullName!: string;

  @Prop({ required: true, lowercase: true, trim: true })
  email!: string;

  @Prop({ required: true, enum: CmsRole })
  role!: CmsRole;

  @Prop({ required: true })
  passwordHash!: string;

  @Prop({ default: true })
  mustChangePassword!: boolean;

  @Prop({ default: true })
  isActive!: boolean;
}

export const CmsUserSchema = SchemaFactory.createForClass(CmsUser);

CmsUserSchema.index({ email: 1 }, { unique: true });
CmsUserSchema.index({ role: 1, isActive: 1 });
