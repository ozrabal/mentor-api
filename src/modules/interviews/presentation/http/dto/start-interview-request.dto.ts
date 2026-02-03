import { IsEnum, IsOptional, IsString } from "class-validator";

export class StartInterviewRequestDto {
  @IsString()
  jobProfileId!: string;

  @IsEnum(["behavioral", "technical", "mixed"])
  @IsOptional()
  interviewType?: "behavioral" | "mixed" | "technical";
}
