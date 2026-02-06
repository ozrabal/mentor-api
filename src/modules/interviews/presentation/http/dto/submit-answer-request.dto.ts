import { ApiProperty } from "@nestjs/swagger";
import {
  IsNotEmpty,
  IsNumber,
  IsString,
  Min,
  MinLength,
} from "class-validator";

/**
 * HTTP request DTO for submitting an answer
 */
export class SubmitAnswerRequestDto {
  @ApiProperty({
    description: "ID of the question being answered",
    example: "550e8400-e29b-41d4-a716-446655440001",
  })
  @IsNotEmpty()
  @IsString()
  questionId!: string;

  @ApiProperty({
    description: "The candidate's answer text",
    example:
      "In my previous role, I led a team of 5 developers to build a microservices architecture...",
    minLength: 1,
  })
  @IsNotEmpty()
  @IsString()
  @MinLength(1)
  answerText!: string;

  @ApiProperty({
    description: "Time taken to answer in seconds",
    example: 120,
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  durationSeconds!: number;
}
