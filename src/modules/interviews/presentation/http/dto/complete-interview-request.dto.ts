import { ApiProperty } from "@nestjs/swagger";
import { IsBoolean, IsOptional } from "class-validator";

export class CompleteInterviewRequestDto {
  @ApiProperty({
    description: "Whether the interview was ended early by the user",
    example: false,
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  endedEarly?: boolean;
}
