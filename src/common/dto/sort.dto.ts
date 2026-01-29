import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsIn, IsOptional, IsString } from "class-validator";

/**
 * Base DTO for sorting configuration
 * @template TEntity - The entity type to ensure type-safe field names
 */
export class SortDto<TEntity> {
  @ApiPropertyOptional({
    description:
      "Field to sort by (must be one of the allowed fields for this entity)",
    example: "createdAt",
  })
  @IsOptional()
  @IsString()
  field?: keyof TEntity;

  @ApiPropertyOptional({
    description: "Sort direction",
    enum: ["asc", "desc"],
    example: "desc",
  })
  @IsIn(["asc", "desc"])
  @IsOptional()
  direction?: "asc" | "desc";
}

/**
 * Result of parsing sort options
 */
export interface SortOptions<TEntity = any> {
  direction: "asc" | "desc";
  field: keyof TEntity;
}
