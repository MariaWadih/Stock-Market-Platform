import {
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreateStockDto {
  @IsString()
  @IsNotEmpty()
  ticker!: string;

  @IsString()
  @IsNotEmpty()
  companyName!: string;

  @IsString()
  @IsNotEmpty()
  sector!: string;

  @IsNumber()
  @Min(0)
  currentPrice!: number;

  @IsString()
  @IsNotEmpty()
  description!: string;

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
