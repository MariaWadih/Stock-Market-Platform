import {
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class UpdateStockDto {
  @IsString()
  @IsOptional()
  ticker?: string;

  @IsString()
  @IsOptional()
  companyName?: string;

  @IsString()
  @IsOptional()
  sector?: string;

  @IsNumber()
  @Min(0)
  @IsOptional()
  currentPrice?: number;

  @IsString()
  @IsOptional()
  description?: string;

  @IsBoolean()
  @IsOptional()
  isListed?: boolean;
}
