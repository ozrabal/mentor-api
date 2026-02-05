import { InterviewSession } from "@modules/interviews/domain/entities/interview-session.entity";
import { IInterviewSessionRepository } from "@modules/interviews/domain/repositories/interview-session.repository.interface";
import { SessionId } from "@modules/interviews/domain/value-objects/session-id.vo";
import { Inject, Injectable } from "@nestjs/common";
import { eq } from "drizzle-orm";

import { DRIZZLE_DB, DrizzleDb } from "@/database/database.service";
import { interviewSessions } from "@/database/schema";

import { InterviewSessionPersistenceMapper } from "../mappers/interview-session-persistence.mapper";

@Injectable()
export class InterviewSessionRepository implements IInterviewSessionRepository {
  constructor(@Inject(DRIZZLE_DB) private readonly db: DrizzleDb) {}

  async save(session: InterviewSession): Promise<void> {
    const ormEntity = InterviewSessionPersistenceMapper.toOrmEntity(session);

    await this.db
      .insert(interviewSessions)
      .values(ormEntity)
      .onConflictDoUpdate({
        set: {
          clarityScores: ormEntity.clarityScores,
          completedAt: ormEntity.completedAt,
          completenessScores: ormEntity.completenessScores,
          confidenceScores: ormEntity.confidenceScores,
          overallScores: ormEntity.overallScores,
          questionsAsked: ormEntity.questionsAsked,
          relevanceScores: ormEntity.relevanceScores,
          responses: ormEntity.responses,
          sessionOverallScore: ormEntity.sessionOverallScore,
          status: ormEntity.status,
        },
        target: interviewSessions.id,
      });
  }

  async findById(id: SessionId): Promise<InterviewSession | null> {
    const result = await this.db
      .select()
      .from(interviewSessions)
      .where(eq(interviewSessions.id, id.getValue()))
      .limit(1);

    if (result.length === 0) {
      return null;
    }

    return InterviewSessionPersistenceMapper.toDomain(result[0]);
  }
}
