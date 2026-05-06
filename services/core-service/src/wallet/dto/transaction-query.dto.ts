import { Type } from 'class-transformer';
import { IsDate, IsEnum, IsOptional } from 'class-validator';
import { TransactionType } from '../../common/enums/transaction-type.enum';

export class TransactionQueryDto {
  @IsEnum(TransactionType)
  @IsOptional()
  type?: TransactionType;

  @Type(() => Date)
  @IsDate()
  @IsOptional()
  from?: Date;

  @Type(() => Date)
  @IsDate()
  @IsOptional()
  to?: Date;
}
