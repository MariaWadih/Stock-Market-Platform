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

  @IsNumber()
  @Min(0)
  @IsOptional()
  marketCap?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  peRatio?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  dividendYield?: number;

  @IsBoolean()
  @IsOptional()
  isListed?: boolean;
}
