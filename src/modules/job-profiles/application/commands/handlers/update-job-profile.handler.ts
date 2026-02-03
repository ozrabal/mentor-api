import {
  ConflictException,
  ForbiddenException,
  Inject,
  Logger,
  NotFoundException,
} from "@nestjs/common";
import { CommandHandler, ICommandHandler } from "@nestjs/cqrs";

import { Competency } from "../../../domain/entities/competency.entity";
import {
  IJobProfileRepository,
  JOB_PROFILE_REPOSITORY,
} from "../../../domain/repositories/job-profile.repository.interface";
import { JobProfileId } from "../../../domain/value-objects/job-profile-id";
import { SeniorityLevel } from "../../../domain/value-objects/seniority-level";
import { JobProfileDto } from "../../dto/job-profile.dto";
import { JobProfileMapper } from "../../mappers/job-profile.mapper";
import { UpdateJobProfileCommand } from "../impl/update-job-profile.command";

@CommandHandler(UpdateJobProfileCommand)
export class UpdateJobProfileHandler implements ICommandHandler<UpdateJobProfileCommand> {
  private readonly logger = new Logger(UpdateJobProfileHandler.name);

  constructor(
    @Inject(JOB_PROFILE_REPOSITORY)
    private readonly repository: IJobProfileRepository,
  ) {}

  async execute(command: UpdateJobProfileCommand): Promise<JobProfileDto> {
    this.logger.log(
      `Updating job profile ${command.jobProfileId} for user ${command.userId}`,
    );

    const jobProfile = await this.repository.findById(
      JobProfileId.create(command.jobProfileId),
      true,
    );

    if (!jobProfile) {
      throw new NotFoundException("Job profile not found");
    }

    if (jobProfile.getUserId().getValue() !== command.userId) {
      throw new ForbiddenException("Access denied");
    }

    if (jobProfile.isDeleted()) {
      throw new ConflictException(
        "Cannot update deleted job profile. Restore it first.",
      );
    }

    const updateData: {
      companyName?: string;
      competencies?: Competency[];
      hardSkills?: string[];
      interviewDifficultyLevel?: number;
      jobTitle?: string;
      seniorityLevel?: SeniorityLevel;
      softSkills?: string[];
    } = {};

    if (command.jobTitle !== undefined) {
      updateData.jobTitle = command.jobTitle;
    }

    if (command.companyName !== undefined) {
      updateData.companyName = command.companyName;
    }

    if (command.competencies !== undefined) {
      updateData.competencies = command.competencies.map((c) =>
        Competency.create(c),
      );
    }

    if (command.hardSkills !== undefined) {
      updateData.hardSkills = command.hardSkills;
    }

    if (command.softSkills !== undefined) {
      updateData.softSkills = command.softSkills;
    }

    if (command.seniorityLevel !== undefined) {
      updateData.seniorityLevel = SeniorityLevel.create(command.seniorityLevel);
    }

    if (command.interviewDifficultyLevel !== undefined) {
      updateData.interviewDifficultyLevel = command.interviewDifficultyLevel;
    }

    jobProfile.updateParsedData(updateData);

    await this.repository.save(jobProfile);

    this.logger.log(`Successfully updated job profile ${command.jobProfileId}`);
    return JobProfileMapper.toDto(jobProfile);
  }
}
