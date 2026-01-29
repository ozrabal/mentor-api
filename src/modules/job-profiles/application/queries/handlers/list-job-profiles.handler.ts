import { Inject, Logger } from "@nestjs/common";
import { IQueryHandler, QueryHandler } from "@nestjs/cqrs";

import {
  IJobProfileRepository,
  JOB_PROFILE_REPOSITORY,
  JobProfileSearchFilters,
} from "../../../domain/repositories/job-profile.repository.interface";
import { JobProfileDto } from "../../dto/job-profile.dto";
import { JobProfileMapper } from "../../mappers/job-profile.mapper";
import { ListJobProfilesQuery } from "../impl/list-job-profiles.query";

export interface PaginatedJobProfilesDto {
  profiles: JobProfileDto[];
  total: number;
}

@QueryHandler(ListJobProfilesQuery)
export class ListJobProfilesHandler implements IQueryHandler<ListJobProfilesQuery> {
  private readonly logger = new Logger(ListJobProfilesHandler.name);

  constructor(
    @Inject(JOB_PROFILE_REPOSITORY)
    private readonly repository: IJobProfileRepository,
  ) {}

  async execute(query: ListJobProfilesQuery): Promise<PaginatedJobProfilesDto> {
    this.logger.log(
      `Listing job profiles for user ${query.userId} (limit: ${query.limit}, offset: ${query.offset}, filters: ${JSON.stringify(query.filters)}, sort: ${JSON.stringify(query.sort)})`,
    );

    // Build search filters
    const searchFilters: JobProfileSearchFilters = {
      userId: query.userId,
      ...query.filters,
    };

    // Execute search with filters and sorting
    const [profiles, total] = await Promise.all([
      this.repository.search(
        searchFilters,
        query.sort,
        query.limit,
        query.offset,
      ),
      this.repository.countWithFilters(searchFilters),
    ]);

    // Map domain entities to DTOs
    const profileDtos = profiles.map((profile) =>
      JobProfileMapper.toDto(profile),
    );

    this.logger.log(
      `Successfully fetched ${profileDtos.length} profiles (total: ${total})`,
    );

    return {
      profiles: profileDtos,
      total,
    };
  }
}
