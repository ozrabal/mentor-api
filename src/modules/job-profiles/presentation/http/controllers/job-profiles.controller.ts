import {
  BadRequestException,
  Body,
  Controller,
  Logger,
  Post,
  UseGuards,
} from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";

import { CurrentUser } from "@/common/decorators/current-user.decorator";
import { SupabaseJwtGuard } from "@/modules/auth/guards/supabase-jwt.guard";

import { Competency } from "../../../domain/entities/competency.entity";
import { JobProfile } from "../../../domain/entities/job-profile.entity";
import { SeniorityLevel } from "../../../domain/value-objects/seniority-level";
import { UserId } from "../../../domain/value-objects/user-id";
import { ParseJobDescriptionRequestDto } from "../dto/parse-job-description-request.dto";
import { ParseJobDescriptionResponseDto } from "../dto/parse-job-description-response.dto";

@ApiTags("job-profiles")
@Controller("api/v1/job-profiles")
@UseGuards(SupabaseJwtGuard)
export class JobProfilesController {
  private readonly logger = new Logger(JobProfilesController.name);

  @ApiOperation({
    description: "Parse a job description to create a job profile",
    summary: "Parse job description",
  })
  @Post("parse")
  parse(
    @Body() dto: ParseJobDescriptionRequestDto,
    @CurrentUser() user: { email: string; sub?: string; userId?: string },
  ): ParseJobDescriptionResponseDto {
    // Extract userId from JWT payload (sub field) or validated user (userId field)
    const userId = user.userId || user.sub || "";

    this.logger.log(`Parsing job description for user ${userId}`);

    if (!dto.jobUrl && !dto.rawJD) {
      throw new BadRequestException("Either jobUrl or rawJD must be provided");
    }

    // Create domain entity with placeholder data
    const jobProfile = JobProfile.createNew({
      companyName: "Example Corp (placeholder)",
      competencies: [
        Competency.create({ depth: 5, name: "Programming", weight: 0.5 }),
        Competency.create({ depth: 5, name: "Communication", weight: 0.5 }),
      ],
      hardSkills: ["JavaScript", "TypeScript"],
      interviewDifficultyLevel: 5,
      jobTitle: dto.jobTitle || "Software Engineer (placeholder)",
      jobUrl: dto.jobUrl,
      rawJD: dto.rawJD,
      seniorityLevel: dto.seniority
        ? SeniorityLevel.create(dto.seniority)
        : SeniorityLevel.create(5),
      softSkills: ["Communication", "Teamwork"],
      userId: UserId.create(userId),
    });

    // Map domain entity to response DTO
    const response: ParseJobDescriptionResponseDto = {
      companyName: jobProfile.getCompanyName(),
      competencies: jobProfile.getCompetencies().map((c) => ({
        depth: c.getDepth(),
        name: c.getName(),
        weight: c.getWeight(),
      })),
      createdAt: jobProfile.getCreatedAt(),
      hardSkills: jobProfile.getHardSkills(),
      id: jobProfile.getId().getValue(),
      interviewDifficultyLevel: jobProfile.getInterviewDifficultyLevel(),
      jobTitle: jobProfile.getJobTitle(),
      seniorityLevel: jobProfile.getSeniorityLevel()?.getValue(),
      softSkills: jobProfile.getSoftSkills(),
    };

    this.logger.log(`Returning job profile with id ${response.id}`);
    return response;
  }
}
