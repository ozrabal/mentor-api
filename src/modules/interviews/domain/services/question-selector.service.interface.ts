import { Question } from "../entities/interview-session.entity";

export interface IQuestionSelectorService {
  selectQuestion(
    jobProfileCompetencies: Array<{
      depth: number;
      name: string;
      weight: number;
    }>,
    interviewDifficultyLevel: number,
    interviewType: "behavioral" | "mixed" | "technical",
  ): Promise<Question>;
}

export const QUESTION_SELECTOR_SERVICE = Symbol("QUESTION_SELECTOR_SERVICE");
