import { Logger } from "@nestjs/common";
import { CommandHandler, ICommandHandler } from "@nestjs/cqrs";

import { JobProfileDto } from "../../dto/job-profile.dto";
import { UpdateJobProfileCommand } from "../impl/update-job-profile.command";

@CommandHandler(UpdateJobProfileCommand)
export class UpdateJobProfileHandler implements ICommandHandler<UpdateJobProfileCommand> {
  private readonly logger = new Logger(UpdateJobProfileHandler.name);

  async execute(command: UpdateJobProfileCommand): Promise<JobProfileDto> {
    this.logger.log(
      `Updating job profile ${command.jobProfileId} for user ${command.userId}`,
    );

    // TODO: This is placeholder data - will be replaced in Step 2
    // Simulate async behavior to satisfy linter
    await Promise.resolve();

    const mockResponse: JobProfileDto = {
      companyName: command.companyName || "Updated Company (placeholder)",
      competencies: command.competencies || [
        { depth: 7, name: "Updated Competency", weight: 0.5 },
      ],
      createdAt: new Date("2026-01-27T10:00:00Z"),
      hardSkills: command.hardSkills || ["Updated Skill 1", "Updated Skill 2"],
      id: command.jobProfileId,
      interviewDifficultyLevel: command.interviewDifficultyLevel || 8,
      jobTitle: command.jobTitle || "Updated Job Title (placeholder)",
      jobUrl: undefined,
      rawJD: "Original job description (immutable)",
      seniorityLevel: command.seniorityLevel || 7,
      softSkills: command.softSkills || ["Updated Soft Skill"],
      updatedAt: new Date(), // Now
      userId: command.userId,
    };

    this.logger.log(
      `Returning placeholder updated job profile with id ${mockResponse.id}`,
    );
    return mockResponse;
  }
}
