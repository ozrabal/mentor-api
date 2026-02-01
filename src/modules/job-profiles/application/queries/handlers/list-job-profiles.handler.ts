import { Logger } from "@nestjs/common";
import { IQueryHandler, QueryHandler } from "@nestjs/cqrs";

import { JobProfileDto } from "../../dto/job-profile.dto";
import { ListJobProfilesQuery } from "../impl/list-job-profiles.query";

export interface PaginatedJobProfilesDto {
  profiles: JobProfileDto[];
  total: number;
}

@QueryHandler(ListJobProfilesQuery)
export class ListJobProfilesHandler implements IQueryHandler<ListJobProfilesQuery> {
  private readonly logger = new Logger(ListJobProfilesHandler.name);

  execute(query: ListJobProfilesQuery): Promise<PaginatedJobProfilesDto> {
    this.logger.log(
      `Listing job profiles for user ${query.userId} (limit: ${query.limit}, offset: ${query.offset})`,
    );

    // TODO: This is placeholder data - will be replaced in Step 2
    const mockProfiles: JobProfileDto[] = [
      {
        companyName: "Tech Corp (placeholder)",
        competencies: [
          { depth: 5, name: "Programming", weight: 0.5 },
          { depth: 5, name: "Communication", weight: 0.5 },
        ],
        createdAt: new Date(),
        hardSkills: ["JavaScript", "TypeScript"],
        id: "profile-1",
        interviewDifficultyLevel: 5,
        jobTitle: "Senior Software Engineer (placeholder)",
        jobUrl: undefined,
        rawJD: "Placeholder job description 1",
        seniorityLevel: 5,
        softSkills: ["Communication", "Teamwork"],
        updatedAt: new Date(),
        userId: query.userId,
      },
      {
        companyName: "Startup Inc (placeholder)",
        competencies: [
          { depth: 4, name: "Frontend", weight: 0.5 },
          { depth: 4, name: "Backend", weight: 0.5 },
        ],
        createdAt: new Date(),
        hardSkills: ["React", "Node.js"],
        id: "profile-2",
        interviewDifficultyLevel: 4,
        jobTitle: "Full Stack Developer (placeholder)",
        jobUrl: undefined,
        rawJD: "Placeholder job description 2",
        seniorityLevel: 3,
        softSkills: ["Problem Solving", "Adaptability"],
        updatedAt: new Date(),
        userId: query.userId,
      },
    ];

    const mockResponse: PaginatedJobProfilesDto = {
      profiles: mockProfiles.slice(query.offset, query.offset + query.limit),
      total: mockProfiles.length,
    };

    this.logger.log(
      `Returning ${mockResponse.profiles.length} placeholder profiles (total: ${mockResponse.total})`,
    );
    return Promise.resolve(mockResponse);
  }
}
