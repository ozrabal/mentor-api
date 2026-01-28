import {
  Body,
  Controller,
  Get,
  Logger,
  Param,
  Post,
  UseGuards,
} from "@nestjs/common";
import { CommandBus, QueryBus } from "@nestjs/cqrs";
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";

import { CurrentUser } from "@/common/decorators/current-user.decorator";
import { SupabaseJwtGuard } from "@/modules/auth/guards/supabase-jwt.guard";

import { ParseJobDescriptionCommand } from "../../../application/commands/impl/parse-job-description.command";
import { JobProfileDto } from "../../../application/dto/job-profile.dto";
import { GetJobProfileQuery } from "../../../application/queries/impl/get-job-profile.query";
import { GetJobProfileResponseDto } from "../dto/get-job-profile-response.dto";
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

  @Get(":jobProfileId")
  async getById(
    @Param("jobProfileId") jobProfileId: string,
    @CurrentUser() user: { email: string; id: string; identityId?: string },
  ): Promise<GetJobProfileResponseDto> {
    this.logger.log(`Getting job profile ${jobProfileId} for user ${user.id}`);

    const result = await this.queryBus.execute(
      new GetJobProfileQuery(user.id, jobProfileId),
    );

    return JobProfileHttpMapper.toGetResponse(result);
  }
}
