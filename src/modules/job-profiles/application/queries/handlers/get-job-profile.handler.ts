import { Logger } from "@nestjs/common";
import { IQueryHandler, QueryHandler } from "@nestjs/cqrs";

import { JobProfileDto } from "../../dto/job-profile.dto";
import { GetJobProfileQuery } from "../impl/get-job-profile.query";

@QueryHandler(GetJobProfileQuery)
export class GetJobProfileHandler implements IQueryHandler<GetJobProfileQuery> {
  private readonly logger = new Logger(GetJobProfileHandler.name);

  async execute(query: GetJobProfileQuery): Promise<JobProfileDto> {
    this.logger.log(
      `Fetching job profile ${query.jobProfileId} for user ${query.userId}`,
    );

    // TODO: This is placeholder data - will be replaced in Step 2
    const mockResponse: JobProfileDto = {
      companyName: "Example Corp (placeholder)",
      competencies: [
        { depth: 5, name: "Programming", weight: 0.5 },
        { depth: 5, name: "Communication", weight: 0.5 },
      ],
      createdAt: new Date(),
      hardSkills: ["JavaScript", "TypeScript"],
      id: query.jobProfileId,
      interviewDifficultyLevel: 5,
      jobTitle: "Software Engineer (placeholder)",
      jobUrl: undefined,
      rawJD: "Placeholder job description",
      seniorityLevel: 5,
      softSkills: ["Communication", "Teamwork"],
      updatedAt: new Date(),
      userId: query.userId,
    };

    this.logger.log(
      `Returning placeholder job profile with id ${mockResponse.id}`,
    );
    return mockResponse;
  }
}
