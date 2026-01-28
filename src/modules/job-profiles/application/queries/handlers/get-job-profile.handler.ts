import {
  ForbiddenException,
  Inject,
  Logger,
  NotFoundException,
} from "@nestjs/common";
import { IQueryHandler, QueryHandler } from "@nestjs/cqrs";

import {
  IJobProfileRepository,
  JOB_PROFILE_REPOSITORY,
} from "../../../domain/repositories/job-profile.repository.interface";
import { JobProfileId } from "../../../domain/value-objects/job-profile-id";
import { JobProfileDto } from "../../dto/job-profile.dto";
import { JobProfileMapper } from "../../mappers/job-profile.mapper";
import { GetJobProfileQuery } from "../impl/get-job-profile.query";

@QueryHandler(GetJobProfileQuery)
export class GetJobProfileHandler implements IQueryHandler<GetJobProfileQuery> {
  private readonly logger = new Logger(GetJobProfileHandler.name);

  constructor(
    @Inject(JOB_PROFILE_REPOSITORY)
    private readonly repository: IJobProfileRepository,
  ) {}

  async execute(query: GetJobProfileQuery): Promise<JobProfileDto> {
    this.logger.log(
      `Fetching job profile ${query.jobProfileId} for user ${query.userId}`,
    );

    // Fetch from database
    const jobProfile = await this.repository.findById(
      JobProfileId.create(query.jobProfileId),
    );

    // Check if exists (and not soft-deleted)
    if (!jobProfile) {
      throw new NotFoundException("Job profile not found");
    }

    // Check ownership - avoid leaking existence across tenants
    if (jobProfile.getUserId().getValue() !== query.userId) {
      throw new ForbiddenException("Access denied");
    }

    this.logger.log(`Successfully fetched job profile ${query.jobProfileId}`);
    return JobProfileMapper.toDto(jobProfile);
  }
}
