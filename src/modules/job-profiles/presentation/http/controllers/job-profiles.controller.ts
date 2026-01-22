import { Body, Controller, Logger, Post, UseGuards } from "@nestjs/common";
import { CommandBus } from "@nestjs/cqrs";
import { ApiOperation, ApiTags } from "@nestjs/swagger";

import { CurrentUser } from "@/common/decorators/current-user.decorator";
import { SupabaseJwtGuard } from "@/modules/auth/guards/supabase-jwt.guard";

import { ParseJobDescriptionCommand } from "../../../application/commands/impl/parse-job-description.command";
import { JobProfileDto } from "../../../application/dto/job-profile.dto";
import { ParseJobDescriptionRequestDto } from "../dto/parse-job-description-request.dto";
import { ParseJobDescriptionResponseDto } from "../dto/parse-job-description-response.dto";
import { JobProfileHttpMapper } from "../mappers/job-profile-http.mapper";

@ApiTags("job-profiles")
@Controller("api/v1/job-profiles")
@UseGuards(SupabaseJwtGuard)
export class JobProfilesController {
  private readonly logger = new Logger(JobProfilesController.name);

  constructor(private readonly commandBus: CommandBus) {}

  @ApiOperation({
    description: "Parse a job description to create a job profile",
    summary: "Parse job description",
  })
  @Post("parse")
  async parse(
    @Body() dto: ParseJobDescriptionRequestDto,
    @CurrentUser() user: { email: string; sub?: string; userId?: string },
  ): Promise<ParseJobDescriptionResponseDto> {
    // Extract userId from JWT payload (sub field) or validated user (userId field)
    const userId = user.userId || user.sub || "";

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
}
