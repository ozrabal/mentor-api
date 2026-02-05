import {
  InterviewType,
  InterviewTypeValue,
} from "../value-objects/interview-type.vo";
import { SessionId } from "../value-objects/session-id.vo";

export interface Question {
  category: string;
  difficulty: number;
  id: string;
  text: string;
}

export class InterviewSession {
  private constructor(
    private readonly id: SessionId,
    private readonly userId: string,
    private readonly jobProfileId: string,
    private readonly interviewType: InterviewType,
    private status: "completed" | "in_progress",
    private questionsAsked: Question[],
    private responses: unknown[],
    private clarityScores: number[],
    private completenessScores: number[],
    private relevanceScores: number[],
    private confidenceScores: number[],
    private overallScores: number[],
    private readonly createdAt: Date,
    private completedAt: Date | null,
  ) {}

  static createNew(
    userId: string,
    jobProfileId: string,
    interviewType: InterviewType,
    question: Question,
  ): InterviewSession {
    return new InterviewSession(
      SessionId.generate(),
      userId,
      jobProfileId,
      interviewType,
      "in_progress",
      [question],
      [],
      [],
      [],
      [],
      [],
      [],
      new Date(),
      null,
    );
  }

  static rehydrate(snapshot: {
    clarityScores: number[];
    completedAt: Date | null;
    completenessScores: number[];
    confidenceScores: number[];
    createdAt: Date;
    id: string;
    interviewType: InterviewTypeValue;
    jobProfileId: string;
    overallScores: number[];
    questionsAsked: Question[];
    relevanceScores: number[];
    responses: unknown[];
    status: "completed" | "in_progress";
    userId: string;
  }): InterviewSession {
    return new InterviewSession(
      SessionId.create(snapshot.id),
      snapshot.userId,
      snapshot.jobProfileId,
      InterviewType.create(snapshot.interviewType),
      snapshot.status,
      snapshot.questionsAsked,
      snapshot.responses,
      snapshot.clarityScores,
      snapshot.completenessScores,
      snapshot.relevanceScores,
      snapshot.confidenceScores,
      snapshot.overallScores,
      snapshot.createdAt,
      snapshot.completedAt,
    );
  }

  // Getters
  getId(): SessionId {
    return this.id;
  }

  getUserId(): string {
    return this.userId;
  }

  getJobProfileId(): string {
    return this.jobProfileId;
  }

  getInterviewType(): InterviewType {
    return this.interviewType;
  }

  getStatus(): "completed" | "in_progress" {
    return this.status;
  }

  getQuestionsAsked(): Question[] {
    return [...this.questionsAsked];
  }

  getQuestion(): null | Question {
    return this.questionsAsked[0] ?? null;
  }

  getCreatedAt(): Date {
    return this.createdAt;
  }
}
