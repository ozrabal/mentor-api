import { Module } from "@nestjs/common";
import { CqrsModule } from "@nestjs/cqrs";

import { ParseJobDescriptionHandler } from "./application/commands/handlers/parse-job-description.handler";
import { JobProfilesController } from "./presentation/http/controllers/job-profiles.controller";

const CommandHandlers = [ParseJobDescriptionHandler];

@Module({
  controllers: [JobProfilesController],
  imports: [CqrsModule],
  providers: [...CommandHandlers],
})
export class JobProfilesModule {}
