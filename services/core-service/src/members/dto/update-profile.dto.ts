import { IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';

export class UpdateProfileDto {
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  fullName?: string;

  @IsString()
  @MinLength(7)
  @IsOptional()
  phoneNumber?: string;

  @IsString()
  @IsNotEmpty()
  @IsOptional()
  address?: string;
}
