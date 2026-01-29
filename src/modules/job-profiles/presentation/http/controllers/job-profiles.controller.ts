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
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";

import { CurrentUser } from "@/common/decorators/current-user.decorator";
import { SupabaseJwtGuard } from "@/modules/auth/guards/supabase-jwt.guard";

import { ParseJobDescriptionCommand } from "../../../application/commands/impl/parse-job-description.command";
import { JobProfileDto } from "../../../application/dto/job-profile.dto";
import { GetJobProfileQuery } from "../../../application/queries/impl/get-job-profile.query";
import { ListJobProfilesQuery } from "../../../application/queries/impl/list-job-profiles.query";
import { GetJobProfileResponseDto } from "../dto/get-job-profile-response.dto";
import { ListJobProfilesRequestDto } from "../dto/list-job-profiles-request.dto";
import { ListJobProfilesResponseDto } from "../dto/list-job-profiles-response.dto";
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
  @Get()
  async list(
    @Query() queryParams: ListJobProfilesRequestDto,
    @CurrentUser() user: { id: string },
  ): Promise<ListJobProfilesResponseDto> {
    this.logger.log(
      `Listing job profiles for user ${user.id} (limit: ${queryParams.limit}, offset: ${queryParams.offset})`,
    );

    const result = await this.queryBus.execute(
      new ListJobProfilesQuery(user.id, queryParams.limit, queryParams.offset),
    );

    return JobProfileHttpMapper.toListResponse(result);
  }

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
