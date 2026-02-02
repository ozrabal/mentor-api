import { ApiProperty } from "@nestjs/swagger";
import {
  IsArray,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from "class-validator";

export class UpdateJobProfileRequestDto {
  @ApiProperty({
    description: "Job title",
    example: "Senior Software Engineer",
    required: false,
  })
  @IsOptional()
  @IsString()
  jobTitle?: string;

  @ApiProperty({
    description: "Company name",
    example: "Tech Corp",
    required: false,
  })
  @IsOptional()
  @IsString()
  companyName?: string;

  @ApiProperty({
    description: "Competencies with name, weight (0-1), and depth (1-10)",
    example: [
      { depth: 8, name: "System Design", weight: 0.3 },
      { depth: 9, name: "Programming", weight: 0.4 },
    ],
    required: false,
    type: "array",
  })
  @IsArray()
  @IsOptional()
  competencies?: Array<{
    depth: number;
    name: string;
    weight: number;
  }>;

  @ApiProperty({
    description: "List of hard skills",
    example: ["TypeScript", "NestJS", "PostgreSQL", "Docker"],
    required: false,
    type: [String],
  })
  @IsArray()
  @IsOptional()
  @IsString({ each: true })
  hardSkills?: string[];

  @ApiProperty({
    description: "List of soft skills",
    example: ["Communication", "Leadership", "Problem Solving"],
    required: false,
    type: [String],
  })
  @IsArray()
  @IsOptional()
  @IsString({ each: true })
  softSkills?: string[];

  @ApiProperty({
    description: "Seniority level (1-10)",
    example: 7,
    maximum: 10,
    minimum: 1,
    required: false,
  })
  @IsNumber()
  @IsOptional()
  @Max(10)
  @Min(1)
  seniorityLevel?: number;

  @ApiProperty({
    description: "Interview difficulty level (1-10)",
    example: 8,
    maximum: 10,
    minimum: 1,
    required: false,
  })
  @IsNumber()
  @IsOptional()
  @Max(10)
  @Min(1)
  interviewDifficultyLevel?: number;
}
