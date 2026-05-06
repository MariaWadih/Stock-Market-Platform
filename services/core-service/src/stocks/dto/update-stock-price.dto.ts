import { IsNumber, Min } from 'class-validator';

export class UpdateStockPriceDto {
  @IsNumber()
  @Min(0)
  currentPrice!: number;
}
