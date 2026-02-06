import { Inject, Injectable } from "@nestjs/common";
import { and, between, eq, notInArray, sql } from "drizzle-orm";

import { DRIZZLE_DB, DrizzleDb } from "@/database/database.service";
import { questionPool } from "@/database/schema";

import {
  InterviewSession,
  Question,
} from "../../domain/entities/interview-session.entity";

/**
 * Service for adaptive question selection
 *
 * Algorithm:
 * 1. Identify weakest competency from answered questions
 * 2. Adjust difficulty based on last score
 * 3. Query question pool for matching question
 * 4. Fallback to random if no match
 */
@Injectable()
export class AdaptiveQuestionSelectorService {
  constructor(@Inject(DRIZZLE_DB) private readonly db: DrizzleDb) {}

  /**
   * Select next question based on session performance
   *
   * @param session Current interview session
   * @param jobProfileCompetencies Job profile competencies with weights
   * @param interviewDifficultyLevel Base difficulty level
   * @param interviewType Interview type
   * @returns Next question or null if session should end
   */
  async selectNextQuestion(
    session: InterviewSession,
    jobProfileCompetencies: Array<{
      depth: number;
      name: string;
      weight: number;
    }>,
    interviewDifficultyLevel: number,
    interviewType: "behavioral" | "mixed" | "technical",
  ): Promise<null | Question> {
    // Check if session should end
    if (session.shouldEnd()) {
      return null;
    }

    // Step 1: Identify weakest competency
    const weakestCompetency = this.identifyWeakestCompetency(
      session,
      jobProfileCompetencies,
    );

    // Step 2: Adjust difficulty based on last score
    const targetDifficulty = this.calculateTargetDifficulty(
      session.getLastScore(),
      interviewDifficultyLevel,
    );

    // Step 3: Get asked question IDs to avoid repetition
    const askedQuestionIds = session.getQuestionsAsked().map((q) => q.id);

    // Step 4: Query question pool
    const minDifficulty = Math.max(1, targetDifficulty - 1);
    const maxDifficulty = Math.min(10, targetDifficulty + 1);

    // Build base query conditions
    const baseConditions = [
      eq(questionPool.competency, weakestCompetency),
      between(questionPool.difficulty, minDifficulty, maxDifficulty),
      sql`${questionPool.deletedAt} IS NULL`,
    ];

    // Add interview type filter if not mixed
    if (interviewType !== "mixed") {
      baseConditions.push(eq(questionPool.type, interviewType));
    }

    // Exclude already asked questions
    if (askedQuestionIds.length > 0) {
      baseConditions.push(notInArray(questionPool.id, askedQuestionIds));
    }

    // Query question pool
    const questions = await this.db
      .select()
      .from(questionPool)
      .where(and(...baseConditions))
      .orderBy(sql`RANDOM()`)
      .limit(1);

    // Step 5: Fallback to random if no match
    if (questions.length === 0) {
      return await this.selectFallbackQuestion(askedQuestionIds);
    }

    const selected = questions[0];
    return {
      category: selected.competency,
      difficulty: selected.difficulty,
      id: selected.id,
      text: selected.text,
    };
  }

  /**
   * Select a fallback question when no matching question is found
   */
  private async selectFallbackQuestion(
    askedQuestionIds: string[],
  ): Promise<null | Question> {
    const fallbackConditions = [sql`${questionPool.deletedAt} IS NULL`];

    if (askedQuestionIds.length > 0) {
      fallbackConditions.push(notInArray(questionPool.id, askedQuestionIds));
    }

    const fallbackQuestions = await this.db
      .select()
      .from(questionPool)
      .where(and(...fallbackConditions))
      .orderBy(sql`RANDOM()`)
      .limit(1);

    if (fallbackQuestions.length === 0) {
      return null; // No more questions available
    }

    const fallback = fallbackQuestions[0];
    return {
      category: fallback.competency,
      difficulty: fallback.difficulty,
      id: fallback.id,
      text: fallback.text,
    };
  }

  /**
   * Identify weakest competency from session performance
   */
  private identifyWeakestCompetency(
    session: InterviewSession,
    jobProfileCompetencies: Array<{
      depth: number;
      name: string;
      weight: number;
    }>,
  ): string {
    const questionsAsked = session.getQuestionsAsked();
    const overallScores = session.getOverallScores();

    // Calculate average score per competency
    const competencyScores = new Map<
      string,
      { count: number; total: number }
    >();

    questionsAsked.forEach((question, index) => {
      const category = question.category;
      const score = overallScores[index];

      if (!competencyScores.has(category)) {
        competencyScores.set(category, { count: 0, total: 0 });
      }

      const stats = competencyScores.get(category)!;
      stats.total += score;
      stats.count += 1;
    });

    // Find competency with lowest average score
    let weakestCompetency = "";
    let lowestAverage = Infinity;

    competencyScores.forEach((stats, competency) => {
      const average = stats.total / stats.count;
      if (average < lowestAverage) {
        lowestAverage = average;
        weakestCompetency = competency;
      }
    });

    // If no competency identified yet, pick from job profile competencies
    if (!weakestCompetency) {
      if (jobProfileCompetencies.length > 0) {
        weakestCompetency = jobProfileCompetencies[0].name;
      } else {
        weakestCompetency = "General"; // Default fallback
      }
    }

    return weakestCompetency;
  }

  /**
   * Calculate target difficulty based on last score
   *
   * - If score < 50: decrease difficulty by 1
   * - If score > 75: increase difficulty by 1
   * - Otherwise: maintain current difficulty
   */
  private calculateTargetDifficulty(
    lastScore: null | number,
    baseDifficulty: number,
  ): number {
    let targetDifficulty = baseDifficulty;

    if (lastScore !== null) {
      if (lastScore < 50) {
        targetDifficulty -= 1;
      } else if (lastScore > 75) {
        targetDifficulty += 1;
      }
    }

    // Clamp between 1 and 10
    return Math.max(1, Math.min(10, targetDifficulty));
  }
}
