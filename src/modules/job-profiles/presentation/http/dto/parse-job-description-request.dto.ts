import { IsNumber, IsOptional, IsString, Max, Min } from "class-validator";

export class ParseJobDescriptionRequestDto {
  @IsOptional()
  @IsString()
  jobUrl?: string;

  @IsOptional()
  @IsString()
  rawJD?: string;

  @IsOptional()
  @IsString()
  jobTitle?: string;

  @IsNumber()
  @IsOptional()
  @Max(10)
  @Min(1)
  seniority?: number;
}
