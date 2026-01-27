import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class CompetencyResponseDto {
  @ApiProperty({
    description: "Competency name",
    example: "System Design",
  })
  name!: string;

  @ApiProperty({
    description: "Relative weight of the competency (0-1)",
    example: 0.25,
  })
  weight!: number;

  @ApiProperty({
    description: "Depth level for the competency",
    example: 3,
  })
  depth!: number;
}

export class ParseJobDescriptionResponseDto {
  @ApiProperty({
    description: "Job profile identifier",
    example: "jp_1234567890",
  })
  id!: string;

  @ApiPropertyOptional({
    description: "Job title derived from the job description",
    example: "Senior Backend Engineer",
  })
  jobTitle?: string;

  @ApiPropertyOptional({
    description: "Company name derived from the job description",
    example: "Acme Corp",
  })
  companyName?: string;

  @ApiProperty({
    description: "Key competencies with weights and depth",
    type: [CompetencyResponseDto],
  })
  competencies!: CompetencyResponseDto[];

  @ApiProperty({
    description: "Hard skills extracted from the job description",
    example: ["Node.js", "PostgreSQL", "AWS"],
    type: [String],
  })
  hardSkills!: string[];

  @ApiProperty({
    description: "Soft skills extracted from the job description",
    example: ["Communication", "Ownership"],
    type: [String],
  })
  softSkills!: string[];

  @ApiPropertyOptional({
    description: "Seniority level inferred from the job description",
    example: 6,
  })
  seniorityLevel?: number;

  @ApiPropertyOptional({
    description: "Interview difficulty level inferred from the job description",
    example: 7,
  })
  interviewDifficultyLevel?: number;

  @ApiProperty({
    description: "Creation timestamp in ISO 8601 format",
    example: "2026-01-27T10:30:00.000Z",
    format: "date-time",
    type: String,
  })
  createdAt!: Date;
}
