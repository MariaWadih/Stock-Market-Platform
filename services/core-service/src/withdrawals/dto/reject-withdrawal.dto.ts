import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class RejectWithdrawalDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(5)
  reason!: string;
}
