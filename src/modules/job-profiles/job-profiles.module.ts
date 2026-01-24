import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { CqrsModule } from "@nestjs/cqrs";

import { DatabaseModule } from "@/database/database.module";

import { ParseJobDescriptionHandler } from "./application/commands/handlers/parse-job-description.handler";
import { JOB_PROFILE_REPOSITORY } from "./domain/repositories/job-profile.repository.interface";
import { JobProfileRepository } from "./infrastructure/persistence/repositories/job-profile.repository";
import { JdExtractorService } from "./infrastructure/services/jd-extractor.service";
import { JobProfilesController } from "./presentation/http/controllers/job-profiles.controller";

const CommandHandlers = [ParseJobDescriptionHandler];
const Services = [JdExtractorService];
const Repositories = [
  {
    provide: JOB_PROFILE_REPOSITORY,
    useClass: JobProfileRepository,
  },
];

@Module({
  controllers: [JobProfilesController],
  imports: [CqrsModule, ConfigModule, DatabaseModule],
  providers: [...CommandHandlers, ...Services, ...Repositories],
})
export class JobProfilesModule {}
