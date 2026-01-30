import { ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsOptional, ValidateNested } from "class-validator";

import { BasePaginationDto } from "./base-pagination.dto";
import { SortDto } from "./sort.dto";

export abstract class BaseSearchDto<
  TEntity,
  TPagination extends BasePaginationDto,
> {
  @ValidateNested()
  @Type(() => Object) // Override in subclass with specific pagination type
  abstract pagination: TPagination;

  @ApiPropertyOptional({
    description: "Sort configuration",
    example: { direction: "desc", field: "createdAt" },
  })
  @IsOptional()
  @Type(() => SortDto)
  @ValidateNested()
  sortOptions?: SortDto<TEntity>;

  // Subclasses must define allowed sort fields
  protected abstract getAllowedSortFields(): (keyof TEntity)[];

  // Validate sort field is allowed
  validateSortField(): boolean {
    if (!this.sortOptions?.sort) return true;
    return this.getAllowedSortFields().includes(this.sortOptions.sort.field);
  }
}
