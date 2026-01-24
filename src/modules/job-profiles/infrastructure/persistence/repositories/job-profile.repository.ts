import { Inject, Injectable } from "@nestjs/common";
import { and, eq, isNull } from "drizzle-orm";

import { DRIZZLE_DB, DrizzleDb } from "@/database/database.service";
import { jobProfiles } from "@/database/schema";

import { JobProfile } from "../../../domain/entities/job-profile.entity";
import { IJobProfileRepository } from "../../../domain/repositories/job-profile.repository.interface";
import { JobProfileId } from "../../../domain/value-objects/job-profile-id";
import { UserId } from "../../../domain/value-objects/user-id";
import { JobProfilePersistenceMapper } from "../mappers/job-profile-persistence.mapper";

@Injectable()
export class JobProfileRepository implements IJobProfileRepository {
  constructor(@Inject(DRIZZLE_DB) private readonly db: DrizzleDb) {}

  async save(jobProfile: JobProfile): Promise<void> {
    const ormEntity = JobProfilePersistenceMapper.toOrmInsert(jobProfile);
    await this.db.insert(jobProfiles).values({
      companyName: ormEntity.companyName,
      competencies: ormEntity.competencies as
        | Array<{ depth: number; name: string; weight: number }>
        | undefined,
      deletedAt: ormEntity.deletedAt,
      hardSkills: ormEntity.hardSkills as string[] | undefined,
      id: jobProfile.getId().getValue(),
      interviewDifficultyLevel: ormEntity.interviewDifficultyLevel,
      jobTitle: ormEntity.jobTitle,
      jobUrl: ormEntity.jobUrl,
      rawJd: ormEntity.rawJd,
      seniorityLevel: ormEntity.seniorityLevel,
      softSkills: ormEntity.softSkills as string[] | undefined,
      userId: ormEntity.userId,
    });
  }

  async findById(
    id: JobProfileId,
    includeDeleted = false,
  ): Promise<JobProfile | null> {
    const conditions = [eq(jobProfiles.id, id.getValue())];

    if (!includeDeleted) {
      conditions.push(isNull(jobProfiles.deletedAt));
    }

    const result = await this.db
      .select()
      .from(jobProfiles)
      .where(and(...conditions))
      .limit(1);

    if (!result[0]) return null;
    return JobProfilePersistenceMapper.toDomain(result[0]);
  }

  async findByUserId(
    userId: UserId,
    limit = 10,
    offset = 0,
    includeDeleted = false,
  ): Promise<JobProfile[]> {
    const conditions = [eq(jobProfiles.userId, userId.getValue())];

    if (!includeDeleted) {
      conditions.push(isNull(jobProfiles.deletedAt));
    }

    const result = await this.db
      .select()
      .from(jobProfiles)
      .where(and(...conditions))
      .limit(limit)
      .offset(offset)
      .orderBy(jobProfiles.createdAt);

    return result.map((row) => JobProfilePersistenceMapper.toDomain(row));
  }

  async countByUserId(userId: UserId, includeDeleted = false): Promise<number> {
    const conditions = [eq(jobProfiles.userId, userId.getValue())];

    if (!includeDeleted) {
      conditions.push(isNull(jobProfiles.deletedAt));
    }

    const result = await this.db
      .select({ count: jobProfiles.id })
      .from(jobProfiles)
      .where(and(...conditions));

    return result.length;
  }

  async softDelete(id: JobProfileId): Promise<void> {
    await this.db
      .update(jobProfiles)
      .set({
        deletedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(jobProfiles.id, id.getValue()));
  }

  async restore(id: JobProfileId): Promise<void> {
    await this.db
      .update(jobProfiles)
      .set({
        deletedAt: null,
        updatedAt: new Date(),
      })
      .where(eq(jobProfiles.id, id.getValue()));
  }
}
