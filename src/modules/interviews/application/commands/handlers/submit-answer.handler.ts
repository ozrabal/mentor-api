import { CommandHandler, ICommandHandler } from "@nestjs/cqrs";

import {
  AnswerScoringDto,
  QuestionDto,
  SubmitAnswerResultDto,
} from "../../dto/submit-answer.dto";
import { SubmitAnswerCommand } from "../impl/submit-answer.command";

/**
 * Handler for submitting an answer to an interview question
 *
 * Step 1: Placeholder implementation with mock scores
 */
@CommandHandler(SubmitAnswerCommand)
export class SubmitAnswerHandler implements ICommandHandler<SubmitAnswerCommand> {
  async execute(command: SubmitAnswerCommand): Promise<SubmitAnswerResultDto> {
    // TODO Step 2: Validate session exists and belongs to user
    // TODO Step 2: Validate session status is 'in_progress'
    // TODO Step 2: Validate questionId matches current question
    // TODO Step 2: Score answer using ScoringService
    // TODO Step 2: Update session state with answer and scores
    // TODO Step 2: Select next question using QuestionSelectorService
    // TODO Step 2: Generate feedback if score < 50

    // Placeholder scoring (all 7/10)
    const scoring: AnswerScoringDto = {
      clarity: 7,
      completeness: 7,
      confidence: 7,
      relevance: 7,
    };

    // Placeholder overall score calculation
    const overall_score =
      ((scoring.clarity * 0.3 +
        scoring.completeness * 0.3 +
        scoring.relevance * 0.25 +
        scoring.confidence * 0.15) /
        10) *
      100;

    // Placeholder next question
    const question: QuestionDto = {
      category: "Technical Adaptability",
      difficulty: 5,
      id: "placeholder-question-id",
      text: "Tell me about a time when you had to learn a new technology quickly.",
    };

    // Placeholder progress
    const sessionProgress = "3/10";
    const timeRemaining = 1200; // 20 minutes

    return {
      feedback:
        overall_score < 50
          ? "Consider providing more specific examples and using the STAR format."
          : undefined,
      overall_score,
      question,
      scoring,
      sessionProgress,
      timeRemaining,
    };
  }
}
