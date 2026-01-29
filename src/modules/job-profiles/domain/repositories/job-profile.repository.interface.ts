import { JobProfile } from "../entities/job-profile.entity";
import { JobProfileId } from "../value-objects/job-profile-id";
import { UserId } from "../value-objects/user-id";

export interface IJobProfileRepository {
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
  softDelete(id: JobProfileId): Promise<void>;
}

export const JOB_PROFILE_REPOSITORY = Symbol("JOB_PROFILE_REPOSITORY");
