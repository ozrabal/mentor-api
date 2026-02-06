import { IsBoolean, IsOptional } from "class-validator";

export class CompleteInterviewRequestDto {
  @IsBoolean()
  @IsOptional()
  endedEarly?: boolean;
}
