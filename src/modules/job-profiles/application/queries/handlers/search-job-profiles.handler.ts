import { JobProfileListItemDto } from "@modules/job-profiles/presentation/http/dto/list-job-profiles-response.dto";
import { Inject, Logger } from "@nestjs/common";
import { IQueryHandler, QueryHandler } from "@nestjs/cqrs";

import { PaginatedResult } from "@/common/dto/paginated-result.dto";

import {
  IJobProfileRepository,
  JOB_PROFILE_REPOSITORY,
} from "../../../domain/repositories/job-profile.repository.interface";
import { SearchJobProfilesQuery } from "../impl/search-job-profiles.query";

@QueryHandler(SearchJobProfilesQuery)
export class SearchJobProfilesHandler implements IQueryHandler<
  SearchJobProfilesQuery,
  PaginatedResult<JobProfileListItemDto>
> {
  private readonly logger = new Logger(SearchJobProfilesHandler.name);

  constructor(
    @Inject(JOB_PROFILE_REPOSITORY)
    private readonly repository: IJobProfileRepository,
  ) {}

  async execute(
    query: SearchJobProfilesQuery,
  ): Promise<PaginatedResult<JobProfileListItemDto>> {
    const { jobTitle, limit, page, sort, userId } = query;

    this.logger.log(
      `Searching job profiles for user ${userId} (page: ${page}, limit: ${limit})`,
    );

    // Calculate offset
    const offset = (page - 1) * limit;

    // Build filter criteria
    const filters = {
      jobTitle,
      userId,
    };

    // Build sort options (default to createdAt:desc)
    const sortOptions = sort
      ? { direction: sort.direction, field: sort.field }
      : { direction: "desc" as const, field: "createdAt" };

    // Execute search and count in parallel for performance
    const [profiles, totalItems] = await Promise.all([
      this.repository.search(filters, sortOptions, limit, offset),
      this.repository.count(filters),
    ]);

    // Calculate pagination metadata
    const totalPages = Math.ceil(totalItems / limit);
    const nextPage = page < totalPages ? page + 1 : null;
    const prevPage = page > 1 ? page - 1 : null;

    // Map domain entities to DTOs
    const items = profiles.map((profile) => ({
      companyName: profile.getCompanyName(),
      createdAt: profile.getCreatedAt(),
      id: profile.getId().getValue(),
      interviewDifficultyLevel: profile.getInterviewDifficultyLevel(),
      jobTitle: profile.getJobTitle(),
      seniorityLevel: profile.getSeniorityLevel()?.getValue(),
      updatedAt: profile.getUpdatedAt(),
      userId: profile.getUserId().getValue(),
    }));

    this.logger.log(
      `Successfully fetched ${items.length} profiles (total: ${totalItems})`,
    );

    return {
      filters: jobTitle ? { jobTitle } : {},
      items,
      limit,
      nextPage,
      page,
      prevPage,
      sort: sortOptions,
      totalItems,
      totalPages,
    };
  }
}
