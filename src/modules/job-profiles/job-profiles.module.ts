import { Module } from "@nestjs/common";
import { CqrsModule } from "@nestjs/cqrs";

import { ParseJobDescriptionHandler } from "./application/commands/handlers/parse-job-description.handler";
import { JdExtractorService } from "./infrastructure/services/jd-extractor.service";
import { JobProfilesController } from "./presentation/http/controllers/job-profiles.controller";

const CommandHandlers = [ParseJobDescriptionHandler];
const Services = [JdExtractorService];

@Module({
  controllers: [JobProfilesController],
  imports: [CqrsModule],
  providers: [...CommandHandlers, ...Services],
})
export class JobProfilesModule {}
