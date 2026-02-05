import {
  Inject,
  Injectable,
  InternalServerErrorException,
} from "@nestjs/common";
import { and, between, eq, sql } from "drizzle-orm";

import { DRIZZLE_DB, DrizzleDb } from "@/database/database.service";
import { questionPool } from "@/database/schema";

import { Question } from "../../domain/entities/interview-session.entity";
import { IQuestionSelectorService } from "../../domain/services/question-selector.service.interface";

@Injectable()
export class QuestionSelectorService implements IQuestionSelectorService {
  constructor(@Inject(DRIZZLE_DB) private readonly db: DrizzleDb) {}

  async selectQuestion(
    jobProfileCompetencies: Array<{
      depth: number;
      name: string;
      weight: number;
    }>,
    interviewDifficultyLevel: number,
    interviewType: "behavioral" | "mixed" | "technical",
  ): Promise<Question> {
    // Select competency with highest weight
    const topCompetency = jobProfileCompetencies.reduce(
      (max, comp) => (comp.weight > max.weight ? comp : max),
      jobProfileCompetencies[0],
    );

    const targetDifficulty = Math.round(interviewDifficultyLevel);
    const minDifficulty = Math.max(1, targetDifficulty - 1);
    const maxDifficulty = Math.min(10, targetDifficulty + 1);

    // Build base query
    const baseConditions = [
      eq(questionPool.competency, topCompetency.name),
      between(questionPool.difficulty, minDifficulty, maxDifficulty),
      sql`${questionPool.deletedAt} IS NULL`,
    ];

    // Add interview type filter if not mixed
    if (interviewType !== "mixed") {
      baseConditions.push(eq(questionPool.type, interviewType));
    }

    // Query question pool
    const questions = await this.db
      .select()
      .from(questionPool)
      .where(and(...baseConditions))
      .orderBy(sql`RANDOM()`)
      .limit(1);

    // Fallback: if no question found, get any random question
    if (questions.length === 0) {
      const fallbackQuestions = await this.db
        .select()
        .from(questionPool)
        .where(sql`${questionPool.deletedAt} IS NULL`)
        .orderBy(sql`RANDOM()`)
        .limit(1);

      if (fallbackQuestions.length === 0) {
        throw new InternalServerErrorException(
          "No questions available in question pool",
        );
      }

      const fallback = fallbackQuestions[0];
      return {
        category: fallback.competency,
        difficulty: fallback.difficulty,
        id: fallback.id,
        text: fallback.text,
      };
    }

    const selected = questions[0];
    return {
      category: selected.competency,
      difficulty: selected.difficulty,
      id: selected.id,
      text: selected.text,
    };
  }
}
