import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Logger,
  Param,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import { CommandBus, QueryBus } from "@nestjs/cqrs";
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";

import { CurrentUser } from "@/common/decorators/current-user.decorator";
import { PaginatedResponseDto } from "@/common/dto/paginated-response.dto";
import { PaginatedResult } from "@/common/dto/paginated-result.dto";
import { SupabaseJwtGuard } from "@/modules/auth/guards/supabase-jwt.guard";

import { ParseJobDescriptionCommand } from "../../../application/commands/impl/parse-job-description.command";
import { JobProfileDto } from "../../../application/dto/job-profile.dto";
import { GetJobProfileQuery } from "../../../application/queries/impl/get-job-profile.query";
import { SearchJobProfilesQuery } from "../../../application/queries/impl/search-job-profiles.query";
import { GetJobProfileResponseDto } from "../dto/get-job-profile-response.dto";
import { JobProfileSearchDto } from "../dto/job-profile-search.dto";
import { JobProfileListItemDto } from "../dto/list-job-profiles-response.dto";
import { ParseJobDescriptionRequestDto } from "../dto/parse-job-description-request.dto";
import { ParseJobDescriptionResponseDto } from "../dto/parse-job-description-response.dto";
import { JobProfileHttpMapper } from "../mappers/job-profile-http.mapper";

@ApiBearerAuth("JWT-auth")
@ApiTags("job-profiles")
@Controller("api/v1/job-profiles")
@UseGuards(SupabaseJwtGuard)
export class JobProfilesController {
  private readonly logger = new Logger(JobProfilesController.name);

  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @ApiOperation({
    description:
      "Parse a job description to create a job profile. Requires authentication.",
    summary: "Parse job description",
  })
  @ApiResponse({
    description: "Job profile created successfully",
    status: 201,
    type: ParseJobDescriptionResponseDto,
  })
  @ApiResponse({
    description: "Bad request (validation error)",
    status: 400,
  })
  @ApiResponse({
    description: "Unauthorized - invalid or missing JWT token",
    status: 401,
  })
  @ApiResponse({
    description: "Internal server error",
    status: 500,
  })
  @Post("parse")
  async parse(
    @Body() dto: ParseJobDescriptionRequestDto,
    @CurrentUser() user: { email: string; id: string; identityId?: string },
  ): Promise<ParseJobDescriptionResponseDto> {
    const userId = user.id;
    this.logger.log(`Parsing job description for user ${userId}`);

    const command = new ParseJobDescriptionCommand(
      userId,
      dto.jobUrl,
      dto.rawJD,
      dto.jobTitle,
      dto.seniority,
    );

    const result = await this.commandBus.execute<
      ParseJobDescriptionCommand,
      JobProfileDto
    >(command);

    return JobProfileHttpMapper.toParseResponse(result);
  }

  @ApiOperation({
    description:
      "Retrieve a paginated, filtered, and sorted list of job profiles for the authenticated user. " +
      "Supports filtering by job title (partial match), sorting by various fields, and pagination. " +
      "Soft-deleted profiles are excluded. " +
      "Default sort is by creation date (newest first).",
    summary: "Search and list job profiles",
  })
  @ApiQuery({
    description: "Page number (1-indexed, default: 1)",
    example: 1,
    name: "page",
    required: false,
    type: Number,
  })
  @ApiQuery({
    description: "Items per page (default: 10, max: 100)",
    example: 10,
    name: "limit",
    required: false,
    type: Number,
  })
  @ApiQuery({
    description: "Filter by job title (partial match, case-insensitive)",
    example: "Senior Backend Engineer",
    name: "jobTitle",
    required: false,
    type: String,
  })
  @ApiQuery({
    description:
      'Sort configuration in format "field:direction". ' +
      "Allowed fields: jobTitle, createdAt, updatedAt, companyName. " +
      "Direction: asc or desc. " +
      "Default: createdAt:desc",
    example: "createdAt:desc",
    name: "sort",
    required: false,
    type: String,
  })
  @ApiResponse({
    description: "Job profiles retrieved successfully",
    schema: {
      properties: {
        data: {
          properties: {
            items: {
              items: {
                properties: {
                  companyName: { example: "Tech Corp", type: "string" },
                  createdAt: { format: "date-time", type: "string" },
                  id: {
                    example: "550e8400-e29b-41d4-a716-446655440000",
                    type: "string",
                  },
                  interviewDifficultyLevel: { example: 8, type: "number" },
                  jobTitle: {
                    example: "Senior Software Engineer",
                    type: "string",
                  },
                  seniorityLevel: { example: 7, type: "number" },
                  updatedAt: { format: "date-time", type: "string" },
                  userId: { example: "user-123", type: "string" },
                },
                type: "object",
              },
              type: "array",
            },
            nextPage: { example: 2, nullable: true, type: "number" },
            prevPage: { example: null, nullable: true, type: "number" },
            query: {
              properties: {
                filters: {
                  properties: {
                    jobTitle: { example: "Senior", type: "string" },
                  },
                  type: "object",
                },
                limit: { example: 10, type: "number" },
                page: { example: 1, type: "number" },
                sort: {
                  properties: {
                    direction: { example: "desc", type: "string" },
                    field: { example: "createdAt", type: "string" },
                  },
                  type: "object",
                },
              },
              type: "object",
            },
            totalItems: { example: 47, type: "number" },
            totalPages: { example: 5, type: "number" },
          },
          type: "object",
        },
        success: { example: true, type: "boolean" },
      },
      type: "object",
    },
    status: HttpStatus.OK,
  })
  @ApiResponse({
    description:
      "Invalid query parameters (e.g., page < 1, limit > 100, invalid sort field)",
    schema: {
      properties: {
        error: { example: "Bad Request", type: "string" },
        message: { example: "Validation failed", type: "string" },
        statusCode: { example: 400, type: "number" },
      },
      type: "object",
    },
    status: HttpStatus.BAD_REQUEST,
  })
  @ApiResponse({
    description: "Authentication required (missing or invalid JWT token)",
    schema: {
      properties: {
        message: { example: "Unauthorized", type: "string" },
        statusCode: { example: 401, type: "number" },
      },
      type: "object",
    },
    status: HttpStatus.UNAUTHORIZED,
  })
  @Get()
  async search(
    @Query() searchDto: JobProfileSearchDto,
    @CurrentUser() user: { id: string },
  ): Promise<PaginatedResponseDto<JobProfileListItemDto>> {
    this.logger.log(
      `Searching job profiles for user ${user.id} (page: ${searchDto.page}, limit: ${searchDto.limit})`,
    );

    // Parse sort parameter
    let sortOptions: undefined | { direction: "asc" | "desc"; field: string };
    if (searchDto.sort) {
      const [field, direction] = searchDto.sort.split(":");
      sortOptions = {
        direction: (direction as "asc" | "desc") || "asc",
        field,
      };
    }

    const query = new SearchJobProfilesQuery(
      user.id,
      searchDto.page,
      searchDto.limit,
      searchDto.jobTitle,
      sortOptions,
    );

    const result = await this.queryBus.execute<
      SearchJobProfilesQuery,
      PaginatedResult<JobProfileListItemDto>
    >(query);

    return JobProfileHttpMapper.toPaginatedResponseDto(result);
  }

  @ApiOperation({
    description:
      "Retrieve a job profile by its ID. Users can only access their own job profiles.",
    summary: "Get job profile by ID",
  })
  @ApiParam({
    description: "UUID of the job profile",
    example: "550e8400-e29b-41d4-a716-446655440000",
    name: "jobProfileId",
  })
  @ApiResponse({
    description: "Job profile retrieved successfully",
    status: HttpStatus.OK,
    type: GetJobProfileResponseDto,
  })
  @ApiResponse({
    description: "Job profile not found",
    status: HttpStatus.NOT_FOUND,
  })
  @ApiResponse({
    description: "Access denied - profile belongs to another user",
    status: HttpStatus.FORBIDDEN,
  })
  @ApiResponse({
    description: "Authentication required",
    status: HttpStatus.UNAUTHORIZED,
  })
  @Get(":jobProfileId")
  async getById(
    @Param("jobProfileId") jobProfileId: string,
    @CurrentUser() user: { email: string; id: string; identityId?: string },
  ): Promise<GetJobProfileResponseDto> {
    this.logger.log(`Getting job profile ${jobProfileId} for user ${user.id}`);

    const result = await this.queryBus.execute<
      GetJobProfileQuery,
      JobProfileDto
    >(new GetJobProfileQuery(user.id, jobProfileId));

    return JobProfileHttpMapper.toGetResponse(result);
  }
}
