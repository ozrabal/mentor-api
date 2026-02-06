import { Injectable } from "@nestjs/common";

import { AnswerScores } from "../../domain/value-objects/answer-scores";

/**
 * Service for generating personalized feedback on low-scoring answers
 */
@Injectable()
export class FeedbackGeneratorService {
  /**
   * Generate feedback if overall score is below threshold (< 50)
   *
   * @param scores Answer scores
   * @param questionType Type of question ('behavioral' | 'technical' | 'culture')
   * @returns Feedback string or null if score is adequate
   */
  generateFeedback(scores: AnswerScores, questionType: string): null | string {
    const overallScore = scores.calculateOverallScore();

    if (overallScore >= 50) {
      return null; // No feedback needed for decent scores
    }

    const feedbackParts: string[] = [];

    // Identify weakest dimension
    const dimensions = [
      { name: "clarity", score: scores.getClarity() },
      { name: "completeness", score: scores.getCompleteness() },
      { name: "relevance", score: scores.getRelevance() },
      { name: "confidence", score: scores.getConfidence() },
    ];

    const weakestDimension = dimensions.reduce((min, dim) =>
      dim.score < min.score ? dim : min,
    );

    // Generate dimension-specific feedback
    if (weakestDimension.name === "clarity") {
      feedbackParts.push(
        "Try to structure your answer more clearly. Use proper sentences and organize your thoughts logically.",
      );
    }

    if (weakestDimension.name === "completeness") {
      if (questionType === "behavioral") {
        feedbackParts.push(
          "Consider using the STAR format: describe the Situation, Task, Action, and Result.",
        );
      } else {
        feedbackParts.push(
          "Provide more depth in your answer. Discuss the problem, your approach, trade-offs, and feasibility.",
        );
      }
    }

    if (weakestDimension.name === "relevance") {
      feedbackParts.push(
        "Make sure your answer is relevant to the question and the job requirements. Use specific examples related to the role.",
      );
    }

    if (weakestDimension.name === "confidence") {
      feedbackParts.push(
        "Provide a more detailed answer (aim for 50+ words). Avoid filler words and speak in complete thoughts.",
      );
    }

    return feedbackParts.join(" ");
  }
}
