import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional } from "class-validator";

export class SortDto<TEntity> {
  @ApiPropertyOptional({
    description: 'Sort configuration in format "field:direction"',
    example: "createdAt:desc",
  })
  @IsOptional()
  sort?: {
    direction: "asc" | "desc";
    field: keyof TEntity;
  };
}
