import { Module } from "@nestjs/common";
import { CqrsModule } from "@nestjs/cqrs";

import { DatabaseModule } from "@/database/database.module";
import { AuthModule } from "@/modules/auth/auth.module";
import { JobProfilesModule } from "@/modules/job-profiles/job-profiles.module";

import { StartInterviewHandler } from "./application/commands/handlers/start-interview.handler";
import { SubmitAnswerHandler } from "./application/commands/handlers/submit-answer.handler";
import { INTERVIEW_SESSION_REPOSITORY } from "./domain/repositories/interview-session.repository.interface";
import { QUESTION_SELECTOR_SERVICE } from "./domain/services/question-selector.service.interface";
import { InterviewSessionRepository } from "./infrastructure/persistence/repositories/interview-session.repository";
import { QuestionSelectorService } from "./infrastructure/services/question-selector.service";
import { InterviewsController } from "./presentation/http/controllers/interviews.controller";

const CommandHandlers = [StartInterviewHandler, SubmitAnswerHandler];

@Module({
  controllers: [InterviewsController],
  imports: [CqrsModule, DatabaseModule, AuthModule, JobProfilesModule],
  providers: [
    ...CommandHandlers,
    {
      provide: INTERVIEW_SESSION_REPOSITORY,
      useClass: InterviewSessionRepository,
    },
    {
      provide: QUESTION_SELECTOR_SERVICE,
      useClass: QuestionSelectorService,
    },
  ],
})
export class InterviewsModule {}
