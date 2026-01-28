import { ApiProperty } from "@nestjs/swagger";

export class CompetencyResponseDto {
  @ApiProperty({ example: "System Design" })
  name!: string;

  @ApiProperty({ example: 0.3, maximum: 1, minimum: 0 })
  weight!: number;

  @ApiProperty({ example: 8, maximum: 10, minimum: 1 })
  depth!: number;
}

export class GetJobProfileResponseDto {
  @ApiProperty({ example: "550e8400-e29b-41d4-a716-446655440000" })
  id!: string;

  @ApiProperty({ example: "user-123" })
  userId!: string;

  @ApiProperty({ example: "Senior Software Engineer", required: false })
  jobTitle?: string;

  @ApiProperty({ example: "Tech Corp", required: false })
  companyName?: string;

  @ApiProperty({
    example: "https://example.com/jobs/senior-engineer",
    required: false,
  })
  jobUrl?: string;

  @ApiProperty({
    example: "We are looking for a senior engineer...",
    required: false,
  })
  rawJD?: string;

  @ApiProperty({ type: [CompetencyResponseDto] })
  competencies!: CompetencyResponseDto[];

  @ApiProperty({
    example: ["TypeScript", "NestJS", "PostgreSQL"],
    type: [String],
  })
  hardSkills!: string[];

  @ApiProperty({
    example: ["Communication", "Leadership", "Mentoring"],
    type: [String],
  })
  softSkills!: string[];

  @ApiProperty({ example: 7, maximum: 10, minimum: 1, required: false })
  seniorityLevel?: number;

  @ApiProperty({ example: 8, maximum: 10, minimum: 1, required: false })
  interviewDifficultyLevel?: number;

  @ApiProperty({ example: "2026-01-27T10:00:00Z" })
  createdAt!: Date;

  @ApiProperty({ example: "2026-01-27T10:00:00Z" })
  updatedAt!: Date;
}
