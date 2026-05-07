import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

export class AnalyticsPaginationQueryDto {
  @IsInt()
  @Min(1)
  @Max(100)
  @IsOptional()
  @Type(() => Number)
  limit = 5;

  @IsInt()
  @Min(1)
  @IsOptional()
  @Type(() => Number)
  page = 1;
}
