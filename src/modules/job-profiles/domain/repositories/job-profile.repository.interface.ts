import { JobProfile } from "../entities/job-profile.entity";
import { JobProfileId } from "../value-objects/job-profile-id";
import { UserId } from "../value-objects/user-id";

/**
 * Filter criteria for job profile queries
 */
export interface JobProfileSearchFilters {
  companyName?: string;
  interviewDifficultyLevelMax?: number;
  interviewDifficultyLevelMin?: number;
  jobTitle?: string;
  seniorityLevelMax?: number;
  seniorityLevelMin?: number;
  userId: string;
}

/**
 * Sort options for job profile queries
 */
export interface JobProfileSortOptions {
  direction: "asc" | "desc";
  field:
    | "companyName"
    | "createdAt"
    | "jobTitle"
    | "seniorityLevel"
    | "updatedAt";
}

export interface IJobProfileRepository {
  countByUserId(userId: UserId, includeDeleted?: boolean): Promise<number>;
  /**
   * Count job profiles matching filter criteria
   * @param filters - Filter criteria including userId (required)
   * @param includeDeleted - Whether to include soft-deleted records
   * @returns Number of matching job profiles
   */
  countWithFilters(
    filters: JobProfileSearchFilters,
    includeDeleted?: boolean,
  ): Promise<number>;
  findById(
    id: JobProfileId,
    includeDeleted?: boolean,
  ): Promise<JobProfile | null>;
  findByUserId(
    userId: UserId,
    limit?: number,
    offset?: number,
    includeDeleted?: boolean,
  ): Promise<JobProfile[]>;
  restore(id: JobProfileId): Promise<void>;
  save(jobProfile: JobProfile): Promise<void>;

  /**
   * Search job profiles with filters and sorting
   * @param filters - Filter criteria including userId (required)
   * @param sort - Sort options
   * @param limit - Maximum number of results to return
   * @param offset - Number of results to skip
   * @param includeDeleted - Whether to include soft-deleted records
   * @returns Array of matching job profiles
   */
  search(
    filters: JobProfileSearchFilters,
    sort: JobProfileSortOptions,
    limit: number,
    offset: number,
    includeDeleted?: boolean,
  ): Promise<JobProfile[]>;

  softDelete(id: JobProfileId): Promise<void>;
}

export const JOB_PROFILE_REPOSITORY = Symbol("JOB_PROFILE_REPOSITORY");
