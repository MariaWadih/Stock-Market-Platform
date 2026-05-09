import { Type } from 'class-transformer';
import {
  IsDate,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  Length,
} from 'class-validator';

export class RegisterMemberDto {
  @IsString()
  @IsNotEmpty()
  fullName!: string;

  @IsEmail()
  email!: string;

  @IsString()
  @Length(6, 32)
  nationalId!: string;

  @Type(() => Date)
  @IsDate()
  dateOfBirth!: Date;

  @IsString()
  @IsOptional()
  @Length(4, 32)
  referralCode?: string;
}
