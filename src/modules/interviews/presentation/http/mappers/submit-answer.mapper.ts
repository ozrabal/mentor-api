import { SubmitAnswerCommand } from "@modules/interviews/application/commands/impl/submit-answer.command";
import { SubmitAnswerResultDto } from "@modules/interviews/application/dto/submit-answer.dto";

import { SubmitAnswerRequestDto } from "../dto/submit-answer-request.dto";
import { SubmitAnswerResponseDto } from "../dto/submit-answer-response.dto";

/**
 * Mapper for Submit Answer endpoint
 */
export class SubmitAnswerMapper {
  /**
   * Map HTTP request to Command
   */
  static toCommand(
    sessionId: string,
    dto: SubmitAnswerRequestDto,
    userId: string,
  ): SubmitAnswerCommand {
    return new SubmitAnswerCommand(
      sessionId,
      dto.questionId,
      dto.answerText,
      dto.durationSeconds,
      userId,
    );
  }

  /**
   * Map application result to HTTP response
   */
  static toResponseDto(result: SubmitAnswerResultDto): SubmitAnswerResponseDto {
    return {
      feedback: result.feedback,
      overall_score: result.overall_score,
      question: result.question
        ? {
            category: result.question.category,
            difficulty: result.question.difficulty,
            id: result.question.id,
            text: result.question.text,
          }
        : undefined,
      scoring: {
        clarity: result.scoring.clarity,
        completeness: result.scoring.completeness,
        confidence: result.scoring.confidence,
        relevance: result.scoring.relevance,
      },
      sessionProgress: result.sessionProgress,
      timeRemaining: result.timeRemaining,
    };
  }
}
