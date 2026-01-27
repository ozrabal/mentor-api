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
import { AiParserService } from "../../../infrastructure/services/ai-parser.service";
import { HtmlFetcherService } from "../../../infrastructure/services/html-fetcher.service";
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
    private readonly htmlFetcher: HtmlFetcherService,
    private readonly jdExtractor: JdExtractorService,
    private readonly aiParser: AiParserService,
  ) {}

  async execute(command: ParseJobDescriptionCommand): Promise<JobProfileDto> {
    this.logger.log(`Parsing job description for user ${command.userId}`);

    if (!command.jobUrl && !command.rawJD) {
      throw new BadRequestException("Either jobUrl or rawJD must be provided");
    }

    // Step 1: Get job description text
    let jdText: string;
    let jobUrl: string | undefined;

    if (command.jobUrl) {
      // Fetch HTML from URL
      const html = await this.htmlFetcher.fetchHtml(command.jobUrl);

      // Extract text from HTML
      jdText = this.jdExtractor.extractTextFromHtml(html);
      jobUrl = command.jobUrl;
    } else {
      // Use raw JD directly (guaranteed to exist due to validation above)
      jdText = this.jdExtractor.normalizeRawJD(command.rawJD!);
    }

    // Step 2: Call AI API with structured output
    const parsedData = await this.aiParser.parseJobDescription(jdText);

    // Step 3: Create domain entity
    const jobProfile = JobProfile.createNew({
      companyName: parsedData.company_name,
      jobTitle: parsedData.job_title,
      jobUrl,
      rawJD: command.rawJD,
      userId: UserId.create(command.userId),
    });

    // Update with parsed data
    jobProfile.updateParsedData({
      companyName: parsedData.company_name,
      competencies: parsedData.competencies.map((c) => Competency.create(c)),
      hardSkills: parsedData.hard_skills,
      interviewDifficultyLevel: parsedData.interview_difficulty_level,
      jobTitle: parsedData.job_title,
      seniorityLevel: SeniorityLevel.create(parsedData.seniority_level),
      softSkills: parsedData.soft_skills,
    });

    // Step 4: Store in PostgreSQL via Drizzle
    await this.repository.save(jobProfile);
    this.logger.log(
      `Job profile created with id ${jobProfile.getId().getValue()}`,
    );

    // Return DTO
    return JobProfileMapper.toDto(jobProfile);
  }
}
