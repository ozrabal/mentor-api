import { BadRequestException, Inject, Logger } from "@nestjs/common";
import { CommandHandler, ICommandHandler } from "@nestjs/cqrs";

import { Competency } from "../../../domain/entities/competency.entity";
import { JobProfile } from "../../../domain/entities/job-profile.entity";
import {
  IJobProfileRepository,
  JOB_PROFILE_REPOSITORY,
} from "../../../domain/repositories/job-profile.repository.interface";
import { SeniorityLevel } from "../../../domain/value-objects/seniority-level";
import { UserId } from "../../../domain/value-objects/user-id";
import { JdExtractorService } from "../../../infrastructure/services/jd-extractor.service";
import { JobProfileDto } from "../../dto/job-profile.dto";
import { JobProfileMapper } from "../../mappers/job-profile.mapper";
import { ParseJobDescriptionCommand } from "../impl/parse-job-description.command";

@CommandHandler(ParseJobDescriptionCommand)
export class ParseJobDescriptionHandler implements ICommandHandler<ParseJobDescriptionCommand> {
  private readonly logger = new Logger(ParseJobDescriptionHandler.name);

  constructor(
    @Inject(JOB_PROFILE_REPOSITORY)
    private readonly repository: IJobProfileRepository,
    private readonly jdExtractor: JdExtractorService,
  ) {}

  async execute(command: ParseJobDescriptionCommand): Promise<JobProfileDto> {
    this.logger.log(`Parsing job description for user ${command.userId}`);

    if (!command.jobUrl && !command.rawJD) {
      throw new BadRequestException("Either jobUrl or rawJD must be provided");
    }

    // Normalize the raw JD if provided
    let normalizedText: string | undefined;
    if (command.rawJD) {
      normalizedText = this.jdExtractor.normalizeRawJD(command.rawJD);
      this.logger.log(
        `Normalized JD text: ${normalizedText.substring(0, 100)}...`,
      );
    }

    // TODO: Actual parsing still placeholder - will add AI in next step
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
      rawJD: normalizedText || command.rawJD,
      seniorityLevel: command.seniority
        ? SeniorityLevel.create(command.seniority)
        : SeniorityLevel.create(5),
      softSkills: ["Communication", "Teamwork"],
      userId: UserId.create(command.userId),
    });

    // Save to database
    await this.repository.save(jobProfile);
    this.logger.log(
      `Saved job profile to database with id ${jobProfile.getId().getValue()}`,
    );

    return JobProfileMapper.toDto(jobProfile);
  }
}
