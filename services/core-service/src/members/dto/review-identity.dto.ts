import { IsEnum, IsOptional, IsString } from 'class-validator';
import { IdentityVerificationStatus } from '../../common/enums/identity-verification-status.enum';

export class ReviewIdentityDto {
  @IsEnum(IdentityVerificationStatus)
  status!: IdentityVerificationStatus;

  @IsString()
  @IsOptional()
  reason?: string;
}
