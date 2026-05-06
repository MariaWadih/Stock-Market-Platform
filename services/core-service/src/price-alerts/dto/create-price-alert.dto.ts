import { IsMongoId, IsNumber, Min } from 'class-validator';

export class CreatePriceAlertDto {
  @IsMongoId()
  stockId!: string;

  @IsNumber()
  @Min(0)
  thresholdPrice!: number;
}
