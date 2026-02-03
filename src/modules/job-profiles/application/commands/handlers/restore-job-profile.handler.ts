import {
  BadRequestException,
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
import { RestoreJobProfileCommand } from "../impl/restore-job-profile.command";

@CommandHandler(RestoreJobProfileCommand)
export class RestoreJobProfileHandler implements ICommandHandler<RestoreJobProfileCommand> {
  private readonly logger = new Logger(RestoreJobProfileHandler.name);

  constructor(
    @Inject(JOB_PROFILE_REPOSITORY)
    private readonly repository: IJobProfileRepository,
  ) {}

  async execute(command: RestoreJobProfileCommand): Promise<void> {
    this.logger.log(
      `Restoring job profile ${command.jobProfileId} for user ${command.userId}`,
    );

    const jobProfileId = JobProfileId.create(command.jobProfileId);

    const jobProfile = await this.repository.findById(jobProfileId, true);

    if (!jobProfile) {
      this.logger.warn(`Job profile ${command.jobProfileId} not found`);
      throw new NotFoundException("Job profile not found");
    }

    if (!jobProfile.isDeleted()) {
      this.logger.warn(
        `Job profile ${command.jobProfileId} is not deleted - restore rejected`,
      );
      throw new BadRequestException("Job profile is not deleted");
    }

    if (jobProfile.getUserId().getValue() !== command.userId) {
      this.logger.warn(
        `User ${command.userId} attempted to restore job profile ${command.jobProfileId} owned by another user`,
      );
      throw new ForbiddenException("Access denied");
    }

    jobProfile.restore();

    await this.repository.restore(jobProfileId);

    this.logger.log(
      `Successfully restored job profile ${command.jobProfileId}`,
    );
  }
}
