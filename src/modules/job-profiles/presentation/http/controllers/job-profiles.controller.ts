import {
  BadRequestException,
  Body,
  Controller,
  Logger,
  Post,
  UseGuards,
} from "@nestjs/common";

import { CurrentUser } from "@/common/decorators/current-user.decorator";
import { SupabaseJwtGuard } from "@/modules/auth/guards/supabase-jwt.guard";

import { ParseJobDescriptionRequestDto } from "../dto/parse-job-description-request.dto";
import { ParseJobDescriptionResponseDto } from "../dto/parse-job-description-response.dto";

@Controller("api/v1/job-profiles")
@UseGuards(SupabaseJwtGuard)
export class JobProfilesController {
  private readonly logger = new Logger(JobProfilesController.name);

  @Post("parse")
  async parse(
    @Body() dto: ParseJobDescriptionRequestDto,
    @CurrentUser() user: { id: string },
  ): Promise<ParseJobDescriptionResponseDto> {
    this.logger.log(`Parsing job description for user ${user.id}`);

    // Validate that at least one input is provided
    if (!dto.jobUrl && !dto.rawJD) {
      throw new BadRequestException("Either jobUrl or rawJD must be provided");
    }

    // TODO: This is placeholder data - will be replaced in subsequent steps
    const mockResponse: ParseJobDescriptionResponseDto = {
      companyName: "Example Corp (placeholder)",
      competencies: [
        { depth: 5, name: "Programming", weight: 0.5 },
        { depth: 5, name: "Communication", weight: 0.5 },
      ],
      createdAt: new Date(),
      hardSkills: ["JavaScript", "TypeScript"],
      id: crypto.randomUUID(),
      interviewDifficultyLevel: 5,
      jobTitle: dto.jobTitle || "Software Engineer (placeholder)",
      seniorityLevel: dto.seniority || 5,
      softSkills: ["Communication", "Teamwork"],
    };

    this.logger.log(
      `Returning placeholder job profile with id ${mockResponse.id}`,
    );
    return mockResponse;
  }
}
