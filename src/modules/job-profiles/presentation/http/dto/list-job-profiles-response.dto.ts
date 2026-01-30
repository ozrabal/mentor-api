import { ApiProperty } from "@nestjs/swagger";

export class JobProfileListItemDto {
  @ApiProperty({ example: "550e8400-e29b-41d4-a716-446655440000" })
  id!: string;

  @ApiProperty({ example: "user-123" })
  userId!: string;

  @ApiProperty({ example: "Senior Software Engineer", required: false })
  jobTitle?: string;

  @ApiProperty({ example: "Tech Corp", required: false })
  companyName?: string;

  @ApiProperty({ example: 7, maximum: 10, minimum: 1, required: false })
  seniorityLevel?: number;

  @ApiProperty({ example: 8, maximum: 10, minimum: 1, required: false })
  interviewDifficultyLevel?: number;

  @ApiProperty({ example: "2026-01-27T10:00:00Z" })
  createdAt!: Date;

  @ApiProperty({ example: "2026-01-27T10:00:00Z" })
  updatedAt!: Date;
}

export class ListJobProfilesResponseDto {
  profiles!: JobProfileListItemDto[];
  total!: number;
}
