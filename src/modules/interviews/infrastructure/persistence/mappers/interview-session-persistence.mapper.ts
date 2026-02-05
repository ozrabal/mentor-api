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
      question_id: string;
      timestamp: string;
    }>;
    sessionOverallScore: null | number;
    status: "completed" | "in_progress";
    userId: string;
  } {
    return {
      clarityScores: [],
      completedAt: null,
      completenessScores: [],
      confidenceScores: [],
      createdAt: session.getCreatedAt(),
      id: session.getId().getValue(),
      interviewType: session.getInterviewType().getValue(),
      jobProfileId: session.getJobProfileId(),
      overallScores: [],
      questionsAsked: session.getQuestionsAsked(),
      relevanceScores: [],
      responses: [],
      sessionOverallScore: null,
      status: session.getStatus(),
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
      responses: null | unknown[];
      status: "completed" | "in_progress";
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
      status: entity.status,
      userId: entity.userId,
    });
  }
}
