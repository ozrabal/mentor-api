import { ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsInt, IsOptional, IsString, Max, Min } from "class-validator";

// Minimal for Step 1 - simplified without BaseSearchDto for now
export class JobProfileSearchDto {
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

  @ApiPropertyOptional({
    description: "Sort field and direction (format: field:direction)",
    example: "createdAt:desc",
  })
  @IsOptional()
  @IsString()
  sort?: string;

  // Simple string filter
  @ApiPropertyOptional({
    description: "Filter by job title (partial match)",
    example: "Senior Backend Engineer",
  })
  @IsOptional()
  @IsString()
  jobTitle?: string;
}
