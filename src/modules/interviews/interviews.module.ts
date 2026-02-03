import { Module } from "@nestjs/common";
import { CqrsModule } from "@nestjs/cqrs";

import { AuthModule } from "@/modules/auth/auth.module";

import { StartInterviewHandler } from "./application/commands/handlers/start-interview.handler";
import { InterviewsController } from "./presentation/http/controllers/interviews.controller";

const CommandHandlers = [StartInterviewHandler];

@Module({
  controllers: [InterviewsController],
  imports: [CqrsModule, AuthModule],
  providers: [...CommandHandlers],
})
export class InterviewsModule {}
