import {
  Inject,
  Injectable,
  InternalServerErrorException,
} from "@nestjs/common";

import {
  IJobProfileRepository,
  JOB_PROFILE_REPOSITORY,
} from "../../domain/repositories/job-profile.repository.interface";
import { JobProfileId } from "../../domain/value-objects/job-profile-id";
import {
  IJobProfilesACL,
  JobProfileInfoDto,
} from "../../public/acl/job-profiles.acl.interface";

@Injectable()
export class JobProfilesACLService implements IJobProfilesACL {
  constructor(
    @Inject(JOB_PROFILE_REPOSITORY)
    private readonly repository: IJobProfileRepository,
  ) {}

  async getJobProfileInfo(
    jobProfileId: string,
  ): Promise<JobProfileInfoDto | null> {
    const profile = await this.repository.findById(
      JobProfileId.create(jobProfileId),
    );

    if (!profile || profile.isDeleted()) {
      return null;
    }

    const jobTitle = profile.getJobTitle();
    const interviewDifficultyLevel = profile.getInterviewDifficultyLevel();

    if (!jobTitle) {
      throw new InternalServerErrorException(
        "Job profile must have a job title",
      );
    }

    if (interviewDifficultyLevel === undefined) {
      throw new InternalServerErrorException(
        "Job profile must have an interview difficulty level",
      );
    }

    return {
      competencies: profile.getCompetencies().map((c) => c.toPlainObject()),
      id: profile.getId().getValue(),
      interviewDifficultyLevel,
      jobTitle,
      userId: profile.getUserId().getValue(),
    };
  }
}
