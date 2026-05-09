import { IsDateString, IsEnum, IsMongoId } from 'class-validator';

export enum AnalyticsGranularity {
  Day = 'day',
  Month = 'month',
}

export class TradingVolumeQueryDto {
  @IsMongoId()
  stock_id!: string;

  @IsEnum(AnalyticsGranularity)
  granularity!: AnalyticsGranularity;

  @IsDateString()
  from!: string;

  @IsDateString()
  to!: string;
}
