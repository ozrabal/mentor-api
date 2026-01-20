import { Module } from "@nestjs/common";

import { JobProfilesController } from "./presentation/http/controllers/job-profiles.controller";

@Module({
  controllers: [JobProfilesController],
})
export class JobProfilesModule {}
