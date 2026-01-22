import { BadRequestException, Logger } from "@nestjs/common";
import { CommandHandler, ICommandHandler } from "@nestjs/cqrs";

import { Competency } from "../../../domain/entities/competency.entity";
import { JobProfile } from "../../../domain/entities/job-profile.entity";
import { SeniorityLevel } from "../../../domain/value-objects/seniority-level";
import { UserId } from "../../../domain/value-objects/user-id";
import { JobProfileDto } from "../../dto/job-profile.dto";
import { JobProfileMapper } from "../../mappers/job-profile.mapper";
import { ParseJobDescriptionCommand } from "../impl/parse-job-description.command";

@CommandHandler(ParseJobDescriptionCommand)
export class ParseJobDescriptionHandler implements ICommandHandler<ParseJobDescriptionCommand> {
  private readonly logger = new Logger(ParseJobDescriptionHandler.name);

  async execute(command: ParseJobDescriptionCommand): Promise<JobProfileDto> {
    this.logger.log(`Parsing job description for user ${command.userId}`);

    if (!command.jobUrl && !command.rawJD) {
      throw new BadRequestException("Either jobUrl or rawJD must be provided");
    }

    // TODO: This is still placeholder data - will be replaced with real parsing
    const jobProfile = JobProfile.createNew({
      companyName: "Example Corp (placeholder)",
      competencies: [
        Competency.create({ depth: 5, name: "Programming", weight: 0.5 }),
        Competency.create({ depth: 5, name: "Communication", weight: 0.5 }),
      ],
      hardSkills: ["JavaScript", "TypeScript"],
      interviewDifficultyLevel: 5,
      jobTitle: command.jobTitle || "Software Engineer (placeholder)",
      jobUrl: command.jobUrl,
      rawJD: command.rawJD,
      seniorityLevel: command.seniority
        ? SeniorityLevel.create(command.seniority)
        : SeniorityLevel.create(5),
      softSkills: ["Communication", "Teamwork"],
      userId: UserId.create(command.userId),
    });

    this.logger.log(
      `Created job profile with id ${jobProfile.getId().getValue()}`,
    );
    return Promise.resolve(JobProfileMapper.toDto(jobProfile));
  }
}
