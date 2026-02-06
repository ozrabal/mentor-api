import { ApiProperty } from "@nestjs/swagger";

import { QuestionResponseDto } from "./start-interview-response.dto";

/**
 * Scoring breakdown for HTTP response
 */
export class AnswerScoringResponseDto {
  @ApiProperty({
    description: "Clarity score (0-10): Structure, coherence, vocabulary",
    example: 8.5,
    maximum: 10,
    minimum: 0,
  })
  clarity!: number;

  @ApiProperty({
    description: "Completeness score (0-10): STAR format or technical depth",
    example: 10,
    maximum: 10,
    minimum: 0,
  })
  completeness!: number;

  @ApiProperty({
    description: "Relevance score (0-10): Match to job requirements",
    example: 7,
    maximum: 10,
    minimum: 0,
  })
  relevance!: number;

  @ApiProperty({
    description: "Confidence score (0-10): Length, fillers, completeness",
    example: 8,
    maximum: 10,
    minimum: 0,
  })
  confidence!: number;
}

/**
 * HTTP response DTO for submit answer
 */
export class SubmitAnswerResponseDto {
  @ApiProperty({
    description: "Four-dimension scoring breakdown",
    type: AnswerScoringResponseDto,
  })
  scoring!: AnswerScoringResponseDto;

  @ApiProperty({
    description: "Overall score (0-100) calculated from weighted dimensions",
    example: 83.75,
    maximum: 100,
    minimum: 0,
  })
  overall_score!: number;

  @ApiProperty({
    description: "Personalized feedback if score is below 50",
    example: "Try to structure your answer more clearly using the STAR format.",
    required: false,
  })
  feedback?: string;

  @ApiProperty({
    description: "Next question to answer (null if session should end)",
    required: false,
    type: QuestionResponseDto,
  })
  question?: QuestionResponseDto;

  @ApiProperty({
    description:
      'Session progress (e.g., "3/10" means 3 questions answered out of 10)',
    example: "1/10",
  })
  sessionProgress!: string;

  @ApiProperty({
    description: "Time remaining in seconds",
    example: 1620,
    minimum: 0,
  })
  timeRemaining!: number;
}
