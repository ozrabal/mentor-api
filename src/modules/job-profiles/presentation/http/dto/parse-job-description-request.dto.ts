import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsNumber, IsOptional, IsString, Max, Min } from "class-validator";

export class ParseJobDescriptionRequestDto {
  @ApiPropertyOptional({
    description: "URL to the job posting",
    example: "https://example.com/jobs/senior-backend-engineer",
  })
  @IsOptional()
  @IsString()
  jobUrl?: string;

  @ApiPropertyOptional({
    description: "Raw job description text",
    example:
      "We are looking for a Senior Backend Engineer to build scalable APIs...",
  })
  @IsOptional()
  @IsString()
  rawJD?: string;

  @ApiPropertyOptional({
    description: "Job title extracted or provided by the user",
    example: "Senior Backend Engineer",
  })
  @IsOptional()
  @IsString()
  jobTitle?: string;

  @ApiPropertyOptional({
    description: "Seniority level from 1 (junior) to 10 (staff/principal)",
    example: 6,
    maximum: 10,
    minimum: 1,
  })
  @IsNumber()
  @IsOptional()
  @Max(10)
  @Min(1)
  seniority?: number;
}
