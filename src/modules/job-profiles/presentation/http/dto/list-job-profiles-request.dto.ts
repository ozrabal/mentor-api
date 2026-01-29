import { ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateNested,
} from "class-validator";

import { JobProfileFiltersDto } from "./job-profile-filters.dto";

/**
 * Request DTO for listing job profiles with pagination, filtering, and sorting
 */
export class ListJobProfilesRequestDto {
  // Pagination
  @ApiPropertyOptional({
    default: 10,
    description: "Maximum number of profiles to return",
    example: 10,
    maximum: 100,
    minimum: 1,
  })
  @IsInt()
  @IsOptional()
  @Max(100)
  @Min(1)
  @Type(() => Number)
  limit?: number = 10;

  @ApiPropertyOptional({
    default: 0,
    description: "Number of profiles to skip (for pagination)",
    example: 0,
    minimum: 0,
  })
  @IsInt()
  @IsOptional()
  @Min(0)
  @Type(() => Number)
  offset?: number = 0;

  // Sorting
  @ApiPropertyOptional({
    description: "Field to sort by",
    enum: [
      "jobTitle",
      "companyName",
      "seniorityLevel",
      "createdAt",
      "updatedAt",
    ],
    example: "createdAt",
  })
  @IsIn(["jobTitle", "companyName", "seniorityLevel", "createdAt", "updatedAt"])
  @IsOptional()
  @IsString()
  sortBy?:
    | "companyName"
    | "createdAt"
    | "jobTitle"
    | "seniorityLevel"
    | "updatedAt";

  @ApiPropertyOptional({
    default: "desc",
    description: "Sort direction",
    enum: ["asc", "desc"],
    example: "desc",
  })
  @IsIn(["asc", "desc"])
  @IsOptional()
  sortOrder?: "asc" | "desc" = "desc";

  // Filters (flattened for query parameters)
  @ApiPropertyOptional({
    description: "Filter by job title (partial match, case-insensitive)",
    example: "Senior Backend Engineer",
  })
  @IsOptional()
  @IsString()
  jobTitle?: string;

  @ApiPropertyOptional({
    description: "Filter by company name (partial match, case-insensitive)",
    example: "Tech Corp",
  })
  @IsOptional()
  @IsString()
  companyName?: string;

  @ApiPropertyOptional({
    description: "Filter by minimum seniority level (1-10)",
    example: 5,
    maximum: 10,
    minimum: 1,
  })
  @IsInt()
  @IsOptional()
  @Max(10)
  @Min(1)
  @Type(() => Number)
  seniorityLevelMin?: number;

  @ApiPropertyOptional({
    description: "Filter by maximum seniority level (1-10)",
    example: 8,
    maximum: 10,
    minimum: 1,
  })
  @IsInt()
  @IsOptional()
  @Max(10)
  @Min(1)
  @Type(() => Number)
  seniorityLevelMax?: number;

  @ApiPropertyOptional({
    description: "Filter by minimum interview difficulty level (1-10)",
    example: 3,
    maximum: 10,
    minimum: 1,
  })
  @IsInt()
  @IsOptional()
  @Max(10)
  @Min(1)
  @Type(() => Number)
  interviewDifficultyLevelMin?: number;

  @ApiPropertyOptional({
    description: "Filter by maximum interview difficulty level (1-10)",
    example: 7,
    maximum: 10,
    minimum: 1,
  })
  @IsInt()
  @IsOptional()
  @Max(10)
  @Min(1)
  @Type(() => Number)
  interviewDifficultyLevelMax?: number;
}
