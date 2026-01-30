import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { CqrsModule } from "@nestjs/cqrs";

import { DatabaseModule } from "@/database/database.module";
import { AuthModule } from "@/modules/auth/auth.module";

import { ParseJobDescriptionHandler } from "./application/commands/handlers/parse-job-description.handler";
import { GetJobProfileHandler } from "./application/queries/handlers/get-job-profile.handler";
import { ListJobProfilesHandler } from "./application/queries/handlers/list-job-profiles.handler";
import { SearchJobProfilesHandler } from "./application/queries/handlers/search-job-profiles.handler";
import { JOB_PROFILE_REPOSITORY } from "./domain/repositories/job-profile.repository.interface";
import { JobProfileRepository } from "./infrastructure/persistence/repositories/job-profile.repository";
import { AiParserService } from "./infrastructure/services/ai-parser.service";
import { HtmlFetcherService } from "./infrastructure/services/html-fetcher.service";
import { JdExtractorService } from "./infrastructure/services/jd-extractor.service";
import { JobProfilesController } from "./presentation/http/controllers/job-profiles.controller";

const CommandHandlers = [ParseJobDescriptionHandler];
const QueryHandlers = [
  GetJobProfileHandler,
  ListJobProfilesHandler,
  SearchJobProfilesHandler,
];
const Services = [HtmlFetcherService, JdExtractorService, AiParserService];
const Repositories = [
  {
    provide: JOB_PROFILE_REPOSITORY,
    useClass: JobProfileRepository,
  },
];

@Module({
  controllers: [JobProfilesController],
  imports: [CqrsModule, ConfigModule, DatabaseModule, AuthModule],
  providers: [
    ...CommandHandlers,
    ...QueryHandlers,
    ...Services,
    ...Repositories,
  ],
})
export class JobProfilesModule {}
