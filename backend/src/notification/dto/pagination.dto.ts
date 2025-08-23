import { IsOptional, IsPositive, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class PaginationDto {
  @IsOptional()
  @Type(() => Number)
  @IsPositive()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsPositive()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @IsOptional()
  search?: string;

  @IsOptional()
  platform?: string;

  @IsOptional()
  outcome?: string;

  @IsOptional()
  sortBy?: string = 'timestamp';

  @IsOptional()
  sortOrder?: 'ASC' | 'DESC' = 'DESC';
}
