import { JobProfile as JobProfileORM } from "@/database/schema";

import { Competency } from "../../../domain/entities/competency.entity";
import { JobProfile } from "../../../domain/entities/job-profile.entity";
import { JobProfileId } from "../../../domain/value-objects/job-profile-id";
import { SeniorityLevel } from "../../../domain/value-objects/seniority-level";
import { UserId } from "../../../domain/value-objects/user-id";

export class JobProfilePersistenceMapper {
  static toDomain(orm: JobProfileORM): JobProfile {
    return JobProfile.rehydrate({
      companyName: orm.companyName as string | undefined,
      competencies: orm.competencies
        ? (
            orm.competencies as Array<{
              depth: number;
              name: string;
              weight: number;
            }>
          ).map((c) => Competency.create(c))
        : [],
      createdAt: orm.createdAt,
      deletedAt: orm.deletedAt as Date | undefined,
      hardSkills: (orm.hardSkills as string[]) ?? [],
      id: JobProfileId.create(orm.id),
      interviewDifficultyLevel: orm.interviewDifficultyLevel as
        | number
        | undefined,
      jobTitle: orm.jobTitle as string | undefined,
      jobUrl: orm.jobUrl as string | undefined,
      rawJD: orm.rawJd as string | undefined,
      seniorityLevel: orm.seniorityLevel
        ? SeniorityLevel.create(orm.seniorityLevel)
        : undefined,
      softSkills: (orm.softSkills as string[]) ?? [],
      updatedAt: orm.updatedAt,
      userId: UserId.create(orm.userId),
    });
  }

  static toOrmInsert(domain: JobProfile): {
    companyName?: string;
    competencies?: unknown;
    deletedAt?: Date;
    hardSkills?: unknown;
    interviewDifficultyLevel?: number;
    jobTitle?: string;
    jobUrl?: string;
    rawJd?: string;
    seniorityLevel?: number;
    softSkills?: unknown;
    userId: string;
  } {
    return {
      companyName: domain.getCompanyName(),
      competencies: domain.getCompetencies().map((c) => c.toPlainObject()),
      deletedAt: domain.getDeletedAt(),
      hardSkills: domain.getHardSkills(),
      interviewDifficultyLevel: domain.getInterviewDifficultyLevel(),
      jobTitle: domain.getJobTitle(),
      jobUrl: domain.getJobUrl(),
      rawJd: domain.getRawJD(),
      seniorityLevel: domain.getSeniorityLevel()?.getValue(),
      softSkills: domain.getSoftSkills(),
      userId: domain.getUserId().getValue(),
    };
  }
}
