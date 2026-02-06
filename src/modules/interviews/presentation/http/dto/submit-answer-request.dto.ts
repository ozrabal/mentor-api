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
  @IsNotEmpty()
  @IsString()
  questionId!: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(1)
  answerText!: string;

  @IsNumber()
  @Min(0)
  durationSeconds!: number;
}
