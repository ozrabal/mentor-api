import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { CqrsModule } from "@nestjs/cqrs";

import { DatabaseModule } from "@/database/database.module";
import { AuthModule } from "@/modules/auth/auth.module";

import { ParseJobDescriptionHandler } from "./application/commands/handlers/parse-job-description.handler";
import { RestoreJobProfileHandler } from "./application/commands/handlers/restore-job-profile.handler";
import { SoftDeleteJobProfileHandler } from "./application/commands/handlers/soft-delete-job-profile.handler";
import { UpdateJobProfileHandler } from "./application/commands/handlers/update-job-profile.handler";
import { GetJobProfileHandler } from "./application/queries/handlers/get-job-profile.handler";
import { ListJobProfilesHandler } from "./application/queries/handlers/list-job-profiles.handler";
import { SearchJobProfilesHandler } from "./application/queries/handlers/search-job-profiles.handler";
import { JOB_PROFILE_REPOSITORY } from "./domain/repositories/job-profile.repository.interface";
import { JobProfilesACLService } from "./infrastructure/acl/job-profiles.acl.service";
import { JobProfileRepository } from "./infrastructure/persistence/repositories/job-profile.repository";
import { AiParserService } from "./infrastructure/services/ai-parser.service";
import { HtmlFetcherService } from "./infrastructure/services/html-fetcher.service";
import { JdExtractorService } from "./infrastructure/services/jd-extractor.service";
import { JobProfilesController } from "./presentation/http/controllers/job-profiles.controller";
import { JOB_PROFILES_ACL } from "./public";

const CommandHandlers = [
  ParseJobDescriptionHandler,
  RestoreJobProfileHandler,
  SoftDeleteJobProfileHandler,
  UpdateJobProfileHandler,
];
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
  exports: [JOB_PROFILES_ACL],
  imports: [CqrsModule, ConfigModule, DatabaseModule, AuthModule],
  providers: [
    ...CommandHandlers,
    ...QueryHandlers,
    ...Services,
    ...Repositories,
    {
      provide: JOB_PROFILES_ACL,
      useClass: JobProfilesACLService,
    },
  ],
})
export class JobProfilesModule {}
