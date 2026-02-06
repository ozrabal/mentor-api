import { AnswerScores } from "../value-objects/answer-scores";
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

export interface Response {
  answer_text: string;
  duration_seconds: number;
  question_id: string;
  timestamp: string;
}

export class InterviewSession {
  private constructor(
    private readonly id: SessionId,
    private readonly userId: string,
    private readonly jobProfileId: string,
    private readonly interviewType: InterviewType,
    private status: "completed" | "in_progress",
    private questionsAsked: Question[],
    private responses: Response[],
    private clarityScores: number[],
    private completenessScores: number[],
    private relevanceScores: number[],
    private confidenceScores: number[],
    private overallScores: number[],
    private readonly createdAt: Date,
    private completedAt: Date | null,
    private updatedAt: Date,
  ) {}

  static createNew(
    userId: string,
    jobProfileId: string,
    interviewType: InterviewType,
    question: Question,
  ): InterviewSession {
    const now = new Date();
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
      now,
      null,
      now,
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
    responses: Response[];
    status: "completed" | "in_progress";
    updatedAt: Date;
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
      snapshot.updatedAt,
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

  getResponses(): Response[] {
    return [...this.responses];
  }

  getOverallScores(): number[] {
    return [...this.overallScores];
  }

  getClarityScores(): number[] {
    return [...this.clarityScores];
  }

  getCompletenessScores(): number[] {
    return [...this.completenessScores];
  }

  getRelevanceScores(): number[] {
    return [...this.relevanceScores];
  }

  getConfidenceScores(): number[] {
    return [...this.confidenceScores];
  }

  /**
   * Check if user belongs to this session
   */
  belongsToUser(userId: string): boolean {
    return this.userId === userId;
  }

  /**
   * Check if session is in progress
   */
  isInProgress(): boolean {
    return this.status === "in_progress";
  }

  /**
   * Get current question (last asked question)
   */
  getCurrentQuestion(): null | Question {
    if (this.questionsAsked.length === 0) {
      return null;
    }
    return this.questionsAsked[this.questionsAsked.length - 1];
  }

  /**
   * Submit an answer to the current question
   *
   * @throws Error if session is not in progress
   * @throws Error if questionId doesn't match current question
   */
  submitAnswer(
    questionId: string,
    answerText: string,
    durationSeconds: number,
    scores: AnswerScores,
  ): void {
    if (this.status !== "in_progress") {
      throw new Error(
        "Cannot submit answer to a session that is not in progress",
      );
    }

    const currentQuestion = this.getCurrentQuestion();
    if (!currentQuestion || currentQuestion.id !== questionId) {
      throw new Error("Question ID does not match the current question");
    }

    // Append response
    this.responses.push({
      answer_text: answerText,
      duration_seconds: durationSeconds,
      question_id: questionId,
      timestamp: new Date().toISOString(),
    });

    // Append scores
    this.clarityScores.push(scores.getClarity());
    this.completenessScores.push(scores.getCompleteness());
    this.relevanceScores.push(scores.getRelevance());
    this.confidenceScores.push(scores.getConfidence());
    this.overallScores.push(scores.calculateOverallScore());

    this.updatedAt = new Date();
  }

  /**
   * Add next question to the session
   */
  addQuestion(question: Question): void {
    if (this.status !== "in_progress") {
      throw new Error(
        "Cannot add question to a session that is not in progress",
      );
    }

    this.questionsAsked.push(question);
    this.updatedAt = new Date();
  }

  /**
   * Get session progress as string (e.g., "3/10")
   */
  getProgress(): string {
    const answered = this.responses.length;
    const total = 10; // Default total questions per session
    return `${answered}/${total}`;
  }

  /**
   * Calculate time remaining in seconds
   * Default session duration: 30 minutes (1800 seconds)
   */
  getTimeRemaining(): number {
    const sessionDuration = 1800; // 30 minutes in seconds
    const elapsed = this.responses.reduce(
      (sum, r) => sum + (r.duration_seconds || 0),
      0,
    );
    const remaining = sessionDuration - elapsed;
    return Math.max(0, remaining);
  }

  /**
   * Get last overall score
   */
  getLastScore(): null | number {
    if (this.overallScores.length === 0) {
      return null;
    }
    return this.overallScores[this.overallScores.length - 1];
  }

  /**
   * Check if session should end
   * Session ends if: 10 questions answered OR time expired
   */
  shouldEnd(): boolean {
    return this.responses.length >= 10 || this.getTimeRemaining() <= 0;
  }
}
