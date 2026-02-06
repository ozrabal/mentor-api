/**
 * Scoring breakdown for HTTP response
 */
export class AnswerScoringResponseDto {
  clarity!: number;
  completeness!: number;
  relevance!: number;
  confidence!: number;
}

/**
 * Question details for HTTP response
 */
export class QuestionResponseDto {
  id!: string;
  text!: string;
  category!: string;
  difficulty!: number;
}

/**
 * HTTP response DTO for submit answer
 */
export class SubmitAnswerResponseDto {
  scoring!: AnswerScoringResponseDto;
  overall_score!: number;
  feedback?: string;
  question?: QuestionResponseDto;
  sessionProgress!: string;
  timeRemaining!: number;
}
