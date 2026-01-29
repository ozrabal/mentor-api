import { Inject, Injectable } from "@nestjs/common";
import { and, asc, desc, eq, gte, isNull, lte, or, sql } from "drizzle-orm";

import { DRIZZLE_DB, DrizzleDb } from "@/database/database.service";
import { jobProfiles } from "@/database/schema";

import { JobProfile } from "../../../domain/entities/job-profile.entity";
import {
  IJobProfileRepository,
  JobProfileSearchFilters,
  JobProfileSortOptions,
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
    filters: JobProfileSearchFilters,
    sort: JobProfileSortOptions,
    limit: number,
    offset: number,
    includeDeleted = false,
  ): Promise<JobProfile[]> {
    const conditions = this.buildFilterConditions(filters, includeDeleted);
    const orderByClause = this.buildSortClause(sort);

    const result = await this.db
      .select()
      .from(jobProfiles)
      .where(and(...conditions))
      .orderBy(orderByClause)
      .limit(limit)
      .offset(offset);

    return result.map((row) => JobProfilePersistenceMapper.toDomain(row));
  }

  async countWithFilters(
    filters: JobProfileSearchFilters,
    includeDeleted = false,
  ): Promise<number> {
    const conditions = this.buildFilterConditions(filters, includeDeleted);

    const result = await this.db
      .select({ count: sql<number>`count(*)::int` })
      .from(jobProfiles)
      .where(and(...conditions));

    return result[0]?.count ?? 0;
  }

  /**
   * Build filter conditions for query
   */
  private buildFilterConditions(
    filters: JobProfileSearchFilters,
    includeDeleted: boolean,
  ): any[] {
    const conditions: any[] = [];

    // Always filter by user ID
    conditions.push(eq(jobProfiles.userId, filters.userId));

    // Exclude soft-deleted records by default
    if (!includeDeleted) {
      conditions.push(isNull(jobProfiles.deletedAt));
    }

    // Job title filter (partial match, case-insensitive)
    if (filters.jobTitle) {
      conditions.push(
        sql`LOWER(${jobProfiles.jobTitle}) LIKE LOWER(${`%${filters.jobTitle}%`})`,
      );
    }

    // Company name filter (partial match, case-insensitive)
    if (filters.companyName) {
      conditions.push(
        sql`LOWER(${jobProfiles.companyName}) LIKE LOWER(${`%${filters.companyName}%`})`,
      );
    }

    // Seniority level range filter
    if (
      filters.seniorityLevelMin !== undefined ||
      filters.seniorityLevelMax !== undefined
    ) {
      const seniorityConditions: any[] = [];

      if (filters.seniorityLevelMin !== undefined) {
        seniorityConditions.push(
          gte(jobProfiles.seniorityLevel, filters.seniorityLevelMin),
        );
      }

      if (filters.seniorityLevelMax !== undefined) {
        seniorityConditions.push(
          lte(jobProfiles.seniorityLevel, filters.seniorityLevelMax),
        );
      }

      if (seniorityConditions.length > 0) {
        conditions.push(and(...seniorityConditions));
      }
    }

    // Interview difficulty level range filter
    if (
      filters.interviewDifficultyLevelMin !== undefined ||
      filters.interviewDifficultyLevelMax !== undefined
    ) {
      const difficultyConditions: any[] = [];

      if (filters.interviewDifficultyLevelMin !== undefined) {
        difficultyConditions.push(
          gte(
            jobProfiles.interviewDifficultyLevel,
            filters.interviewDifficultyLevelMin,
          ),
        );
      }

      if (filters.interviewDifficultyLevelMax !== undefined) {
        difficultyConditions.push(
          lte(
            jobProfiles.interviewDifficultyLevel,
            filters.interviewDifficultyLevelMax,
          ),
        );
      }

      if (difficultyConditions.length > 0) {
        conditions.push(and(...difficultyConditions));
      }
    }

    return conditions;
  }

  /**
   * Build ORDER BY clause based on sort options
   */
  private buildSortClause(sort: JobProfileSortOptions): any {
    const sortColumn = this.getSortColumn(sort.field);
    return sort.direction === "desc" ? desc(sortColumn) : asc(sortColumn);
  }

  /**
   * Map domain field names to database columns
   */
  private getSortColumn(field: string): any {
    const columnMap: Record<string, any> = {
      companyName: jobProfiles.companyName,
      createdAt: jobProfiles.createdAt,
      jobTitle: jobProfiles.jobTitle,
      seniorityLevel: jobProfiles.seniorityLevel,
      updatedAt: jobProfiles.updatedAt,
    };

    return columnMap[field] || jobProfiles.createdAt;
  }
}
