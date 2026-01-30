import { JobProfileListItemDto } from "@modules/job-profiles/presentation/http/dto/list-job-profiles-response.dto";
import { Logger } from "@nestjs/common";
import { IQueryHandler, QueryHandler } from "@nestjs/cqrs";

import { PaginatedResult } from "@/common/dto/paginated-result.dto";

import { SearchJobProfilesQuery } from "../impl/search-job-profiles.query";

@QueryHandler(SearchJobProfilesQuery)
export class SearchJobProfilesHandler implements IQueryHandler<
  SearchJobProfilesQuery,
  PaginatedResult<JobProfileListItemDto>
> {
  private readonly logger = new Logger(SearchJobProfilesHandler.name);

  async execute(
    query: SearchJobProfilesQuery,
  ): Promise<PaginatedResult<JobProfileListItemDto>> {
    this.logger.log(
      `Searching job profiles for user ${query.userId} (page: ${query.page}, limit: ${query.limit})`,
    );

    // TODO: This is placeholder data - will be replaced in Step 2
    const mockItems: JobProfileListItemDto[] = [
      {
        companyName: "Tech Corp (placeholder)",
        createdAt: new Date(),
        id: "profile-1",
        interviewDifficultyLevel: 5,
        jobTitle: "Senior Software Engineer (placeholder)",
        seniorityLevel: 5,
        updatedAt: new Date(),
        userId: query.userId,
      },
      {
        companyName: "Startup Inc (placeholder)",
        createdAt: new Date(),
        id: "profile-2",
        interviewDifficultyLevel: 4,
        jobTitle: "Full Stack Developer (placeholder)",
        seniorityLevel: 3,
        updatedAt: new Date(),
        userId: query.userId,
      },
    ];

    // Mock pagination metadata
    const totalItems = 15;
    const totalPages = Math.ceil(totalItems / query.limit);
    const nextPage = query.page < totalPages ? query.page + 1 : null;
    const prevPage = query.page > 1 ? query.page - 1 : null;

    const result: PaginatedResult<JobProfileListItemDto> = {
      filters: query.jobTitle ? { jobTitle: query.jobTitle } : {},
      items: mockItems,
      limit: query.limit,
      nextPage,
      page: query.page,
      prevPage,
      sort: query.sort || { direction: "desc", field: "createdAt" },
      totalItems,
      totalPages,
    };

    this.logger.log(
      `Returning ${result.items.length} placeholder profiles (total: ${result.totalItems})`,
    );
    return result;
  }
}
