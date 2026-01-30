import { ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsInt, IsOptional, Max, Min } from "class-validator";

export abstract class BasePaginationDto {
  abstract page: number;
  abstract limit: number;
}

export class OffsetPaginationDto extends BasePaginationDto {
  @ApiPropertyOptional({ default: 1, example: 1, minimum: 1 })
  @IsInt()
  @IsOptional()
  @Min(1)
  @Type(() => Number)
  page: number = 1;

  @ApiPropertyOptional({ default: 10, example: 10, maximum: 100, minimum: 1 })
  @IsInt()
  @IsOptional()
  @Max(100)
  @Min(1)
  @Type(() => Number)
  limit: number = 10;
}
