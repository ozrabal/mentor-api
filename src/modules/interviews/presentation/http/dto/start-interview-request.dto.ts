import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsEnum, IsOptional, IsString } from "class-validator";

export class StartInterviewRequestDto {
  @ApiProperty({
    description: "Job profile ID to create interview for",
    example: "123e4567-e89b-12d3-a456-426614174000",
  })
  @IsString()
  jobProfileId!: string;

  @ApiPropertyOptional({
    default: "mixed",
    description: "Type of interview to conduct",
    enum: ["behavioral", "technical", "mixed"],
    example: "mixed",
  })
  @IsEnum(["behavioral", "technical", "mixed"])
  @IsOptional()
  interviewType?: "behavioral" | "mixed" | "technical";
}
