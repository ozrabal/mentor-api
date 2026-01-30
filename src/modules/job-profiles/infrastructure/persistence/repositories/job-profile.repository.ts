import { Inject, Injectable } from "@nestjs/common";
import { and, asc, desc, eq, isNull, sql } from "drizzle-orm";

import { DRIZZLE_DB, DrizzleDb } from "@/database/database.service";
import { jobProfiles } from "@/database/schema";

import { JobProfile } from "../../../domain/entities/job-profile.entity";
import {
  IJobProfileRepository,
  SearchFilters,
  SortOptions,
} from "../../../domain/repositories/job-profile.repository.interface";
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

  async search(
    filters: SearchFilters,
    sort: SortOptions,
    limit: number,
    offset: number,
  ): Promise<JobProfile[]> {
    // Build WHERE conditions
    const conditions = this.buildFilterConditions(filters);

    // Build ORDER BY clause
    const orderByClause = this.buildSortClause(sort);

    // Execute query
    const result = await this.db
      .select()
      .from(jobProfiles)
      .where(and(...conditions))
      .orderBy(orderByClause)
      .limit(limit)
      .offset(offset);

    return result.map((row) => JobProfilePersistenceMapper.toDomain(row));
  }

  async count(filters: SearchFilters): Promise<number> {
    const conditions = this.buildFilterConditions(filters);

    const result = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(jobProfiles)
      .where(and(...conditions));

    return result[0]?.count ?? 0;
  }

  private buildFilterConditions(filters: SearchFilters): any[] {
    const conditions: any[] = [];

    // Always filter by user ID
    conditions.push(eq(jobProfiles.userId, filters.userId));

    // Exclude soft-deleted records
    conditions.push(isNull(jobProfiles.deletedAt));

    // Job title filter (partial match, case-insensitive)
    if (filters.jobTitle) {
      conditions.push(
        sql`LOWER(${jobProfiles.jobTitle}) LIKE LOWER(${`%${filters.jobTitle}%`})`,
      );
    }

    return conditions;
  }

  private buildSortClause(sort: SortOptions): any {
    // Map sort field to database column
    const sortColumn = this.getSortColumn(sort.field);

    // Apply sort direction
    return sort.direction === "desc" ? desc(sortColumn) : asc(sortColumn);
  }

  private getSortColumn(field: string): any {
    // Map domain field names to database columns
    const columnMap: Record<string, any> = {
      companyName: jobProfiles.companyName,
      createdAt: jobProfiles.createdAt,
      jobTitle: jobProfiles.jobTitle,
      updatedAt: jobProfiles.updatedAt,
    };

    return columnMap[field] || jobProfiles.createdAt;
  }
}
