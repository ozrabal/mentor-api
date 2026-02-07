import {
  IInterviewSessionRepository,
  INTERVIEW_SESSION_REPOSITORY,
} from "@modules/interviews/domain/repositories/interview-session.repository.interface";
import { SessionId } from "@modules/interviews/domain/value-objects/session-id.vo";
import {
  BadRequestException,
  ForbiddenException,
  Inject,
  NotFoundException,
} from "@nestjs/common";
import { CommandHandler, ICommandHandler } from "@nestjs/cqrs";

import { CompleteInterviewResultDto } from "../../dto/complete-interview.dto";
import { CompleteInterviewMapper } from "../../mappers/complete-interview.mapper";
import { CompleteInterviewCommand } from "../impl/complete-interview.command";

@CommandHandler(CompleteInterviewCommand)
export class CompleteInterviewHandler implements ICommandHandler<CompleteInterviewCommand> {
  constructor(
    @Inject(INTERVIEW_SESSION_REPOSITORY)
    private readonly sessionRepository: IInterviewSessionRepository,
  ) {}

  async execute(
    command: CompleteInterviewCommand,
  ): Promise<CompleteInterviewResultDto> {
    // 1. Validate session exists
    const sessionId = SessionId.create(command.sessionId);
    const session = await this.sessionRepository.findById(sessionId);

    if (!session) {
      throw new NotFoundException(
        `Interview session with ID ${command.sessionId} not found`,
      );
    }

    // 2. Validate ownership
    if (!session.belongsToUser(command.userId)) {
      throw new ForbiddenException(
        "You do not have permission to complete this interview session",
      );
    }

    // 3. Validate session is in progress
    if (session.getStatus() !== "in_progress") {
      throw new BadRequestException(
        `Cannot complete interview session with status: ${session.getStatus()}`,
      );
    }

    // 4. Calculate aggregate scores (mean across all answers)
    const overallScores = session.getOverallScores() ?? [];
    const sessionOverallScore =
      overallScores.length > 0
        ? overallScores.reduce((a, b) => a + b, 0) / overallScores.length
        : 0;

    // 5. Complete the session (updates status and scores)
    session.complete(sessionOverallScore, command.endedEarly);

    // 6. Save updated session
    await this.sessionRepository.save(session);

    // 7. Generate report (placeholder - will be implemented with report entity/repository)
    // For now, create a simple report ID
    const reportId = crypto.randomUUID();
    const reportCreatedAt = new Date();

    // TODO: In future step, create actual report entity and save to repository
    // const report = InterviewReport.create(session, competencyBreakdown, topGaps, strengths);
    // await this.reportRepository.save(report);

    // 8. Map to DTO and return
    return CompleteInterviewMapper.toResultDto(
      session,
      reportId,
      reportCreatedAt,
    );
  }
}
