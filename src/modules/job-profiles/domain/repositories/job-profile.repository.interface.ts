import { JobProfile } from "../entities/job-profile.entity";
import { JobProfileId } from "../value-objects/job-profile-id";
import { UserId } from "../value-objects/user-id";

export interface SearchFilters {
  jobTitle?: string;
  userId: string;
  // Add more filters as needed
}

export interface SortOptions {
  direction: "asc" | "desc";
  field: string;
}

export interface IJobProfileRepository {
  count(filters: SearchFilters): Promise<number>;
  countByUserId(userId: UserId, includeDeleted?: boolean): Promise<number>;
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

  // New search methods
  search(
    filters: SearchFilters,
    sort: SortOptions,
    limit: number,
    offset: number,
  ): Promise<JobProfile[]>;

  softDelete(id: JobProfileId): Promise<void>;
}

export const JOB_PROFILE_REPOSITORY = Symbol("JOB_PROFILE_REPOSITORY");
