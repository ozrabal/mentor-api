import {
  ForbiddenException,
  Inject,
  Logger,
  NotFoundException,
} from "@nestjs/common";
import { CommandHandler, ICommandHandler } from "@nestjs/cqrs";

import {
  IJobProfileRepository,
  JOB_PROFILE_REPOSITORY,
} from "../../../domain/repositories/job-profile.repository.interface";
import { JobProfileId } from "../../../domain/value-objects/job-profile-id";
import { SoftDeleteJobProfileCommand } from "../impl/soft-delete-job-profile.command";

@CommandHandler(SoftDeleteJobProfileCommand)
export class SoftDeleteJobProfileHandler implements ICommandHandler<SoftDeleteJobProfileCommand> {
  private readonly logger = new Logger(SoftDeleteJobProfileHandler.name);

  constructor(
    @Inject(JOB_PROFILE_REPOSITORY)
    private readonly repository: IJobProfileRepository,
  ) {}

  async execute(command: SoftDeleteJobProfileCommand): Promise<void> {
    this.logger.log(
      `Soft deleting job profile ${command.jobProfileId} for user ${command.userId}`,
    );

    const jobProfileId = JobProfileId.create(command.jobProfileId);

    // Fetch from database
    const jobProfile = await this.repository.findById(jobProfileId);

    // Check if exists (and not already soft-deleted)
    if (!jobProfile) {
      this.logger.warn(`Job profile ${command.jobProfileId} not found`);
      throw new NotFoundException("Job profile not found");
    }

    // Check ownership - avoid leaking existence across tenants
    if (jobProfile.getUserId().getValue() !== command.userId) {
      this.logger.warn(
        `User ${command.userId} attempted to delete job profile ${command.jobProfileId} owned by another user`,
      );
      throw new ForbiddenException("Access denied");
    }

    // Soft delete via repository (updates deleted_at timestamp)
    await this.repository.softDelete(jobProfileId);

    this.logger.log(
      `Successfully soft deleted job profile ${command.jobProfileId}`,
    );
  }
}
