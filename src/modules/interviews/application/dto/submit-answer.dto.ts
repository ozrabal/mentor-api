/**
 * Application-layer DTO for submit answer operation
 */
export interface SubmitAnswerDto {
  answerText: string;
  durationSeconds: number;
  questionId: string;
  sessionId: string;
  userId: string; // From JWT
}

/**
 * Scoring breakdown
 */
export interface AnswerScoringDto {
  clarity: number;
  completeness: number;
  confidence: number;
  relevance: number;
}

/**
 * Question details
 */
export interface QuestionDto {
  category: string;
  difficulty: number;
  id: string;
  text: string;
}

/**
 * Result of submitting an answer
 */
export interface SubmitAnswerResultDto {
  feedback?: string;
  overall_score: number;
  question?: QuestionDto;
  scoring: AnswerScoringDto;
  sessionProgress: string; // e.g., "3/10"
  timeRemaining: number; // seconds
}
