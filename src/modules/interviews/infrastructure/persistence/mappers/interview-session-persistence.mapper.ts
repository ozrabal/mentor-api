import { InterviewSession } from "@modules/interviews/domain/entities/interview-session.entity";

export class InterviewSessionPersistenceMapper {
  static toOrmEntity(session: InterviewSession): {
    clarityScores: number[];
    completedAt: Date | null;
    completenessScores: number[];
    confidenceScores: number[];
    createdAt: Date;
    id: string;
    interviewType: "behavioral" | "mixed" | "technical";
    jobProfileId: string;
    overallScores: number[];
    questionsAsked: Array<{
      category: string;
      difficulty: number;
      id: string;
      text: string;
    }>;
    relevanceScores: number[];
    responses: Array<{
      answer_text: string;
      duration_seconds: number;
      question_id: string;
      timestamp: string;
    }>;
    sessionOverallScore: null | number;
    status: "completed" | "in_progress";
    updatedAt: Date;
    userId: string;
  } {
    return {
      clarityScores: session.getClarityScores(),
      completedAt: null,
      completenessScores: session.getCompletenessScores(),
      confidenceScores: session.getConfidenceScores(),
      createdAt: session.getCreatedAt(),
      id: session.getId().getValue(),
      interviewType: session.getInterviewType().getValue(),
      jobProfileId: session.getJobProfileId(),
      overallScores: session.getOverallScores(),
      questionsAsked: session.getQuestionsAsked(),
      relevanceScores: session.getRelevanceScores(),
      responses: session.getResponses(),
      sessionOverallScore: session.getSessionOverallScore(),
      status: session.getStatus(),
      updatedAt: new Date(),
      userId: session.getUserId(),
    };
  }

  static toDomain(ormEntity: unknown): InterviewSession {
    const entity = ormEntity as {
      clarityScores: null | number[];
      completedAt: Date | null;
      completenessScores: null | number[];
      confidenceScores: null | number[];
      createdAt: Date;
      id: string;
      interviewType: "behavioral" | "mixed" | "technical";
      jobProfileId: string;
      overallScores: null | number[];
      questionsAsked: Array<{
        category: string;
        difficulty: number;
        id: string;
        text: string;
      }> | null;
      relevanceScores: null | number[];
      responses: Array<{
        answer_text: string;
        duration_seconds: number;
        question_id: string;
        timestamp: string;
      }> | null;
      sessionOverallScore: null | number;
      status: "completed" | "in_progress";
      updatedAt: Date;
      userId: string;
    };

    return InterviewSession.rehydrate({
      clarityScores: entity.clarityScores ?? [],
      completedAt: entity.completedAt,
      completenessScores: entity.completenessScores ?? [],
      confidenceScores: entity.confidenceScores ?? [],
      createdAt: entity.createdAt,
      id: entity.id,
      interviewType: entity.interviewType,
      jobProfileId: entity.jobProfileId,
      overallScores: entity.overallScores ?? [],
      questionsAsked: entity.questionsAsked ?? [],
      relevanceScores: entity.relevanceScores ?? [],
      responses: entity.responses ?? [],
      sessionOverallScore: entity.sessionOverallScore ?? null,
      status: entity.status,
      updatedAt: entity.updatedAt,
      userId: entity.userId,
    });
  }
}
