import { IsIn, IsMongoId, IsNumber, IsOptional, Min } from 'class-validator';

export class CreatePriceAlertDto {
  @IsMongoId()
  stockId!: string;

  @IsNumber()
  @Min(0)
  @IsOptional()
  thresholdPrice?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  targetPrice?: number;

  @IsIn(['above', 'below'])
  @IsOptional()
  direction?: 'above' | 'below';
}
