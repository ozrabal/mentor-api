import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsInt, IsOptional, IsString, Max, Min } from "class-validator";

/**
 * Filter options for job profile search
 */
export class JobProfileFiltersDto {
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
  interviewDifficultyLevelMax?: number;
}
