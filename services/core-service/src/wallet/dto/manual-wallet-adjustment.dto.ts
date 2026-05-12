import { IsNotEmpty, IsNumber, IsString, MinLength } from 'class-validator';

export class ManualWalletAdjustmentDto {
  @IsNumber()
  amount!: number;

  @IsString()
  @IsNotEmpty()
  @MinLength(5)
  justification!: string;
}
