import {
  IJobProfilesACL,
  JOB_PROFILES_ACL,
} from "@modules/job-profiles/public";
import { ForbiddenException, Inject, NotFoundException } from "@nestjs/common";
import { CommandHandler, ICommandHandler } from "@nestjs/cqrs";

import { InterviewSession } from "../../../domain/entities/interview-session.entity";
import {
  IInterviewSessionRepository,
  INTERVIEW_SESSION_REPOSITORY,
} from "../../../domain/repositories/interview-session.repository.interface";
import {
  IQuestionSelectorService,
  QUESTION_SELECTOR_SERVICE,
} from "../../../domain/services/question-selector.service.interface";
import { InterviewType } from "../../../domain/value-objects/interview-type.vo";
import { InterviewSessionDto } from "../../dto/interview-session.dto";
import { InterviewSessionMapper } from "../../mappers/interview-session.mapper";
import { StartInterviewCommand } from "../impl/start-interview.command";

@CommandHandler(StartInterviewCommand)
export class StartInterviewHandler implements ICommandHandler<StartInterviewCommand> {
  constructor(
    @Inject(INTERVIEW_SESSION_REPOSITORY)
    private readonly sessionRepository: IInterviewSessionRepository,
    @Inject(QUESTION_SELECTOR_SERVICE)
    private readonly questionSelector: IQuestionSelectorService,
    @Inject(JOB_PROFILES_ACL)
    private readonly jobProfilesACL: IJobProfilesACL,
  ) {}

  async execute(command: StartInterviewCommand): Promise<InterviewSessionDto> {
    // 1. Validate job profile exists and belongs to user
    const jobProfile = await this.jobProfilesACL.getJobProfileInfo(
      command.jobProfileId,
    );

    if (!jobProfile) {
      throw new NotFoundException("Job profile not found");
    }

    if (jobProfile.userId !== command.userId) {
      throw new ForbiddenException(
        "You do not have access to this job profile",
      );
    }

    // 2. Select question based on job profile competencies
    const question = await this.questionSelector.selectQuestion(
      jobProfile.competencies,
      jobProfile.interviewDifficultyLevel,
      command.interviewType ?? "mixed",
    );

    // 3. Create interview session domain entity
    const session = InterviewSession.createNew(
      command.userId,
      command.jobProfileId,
      InterviewType.create(command.interviewType),
      question,
    );

    // 4. Persist session
    await this.sessionRepository.save(session);

    // 5. Map to DTO
    return InterviewSessionMapper.toDto(session);
  }
}
