import { JobProfile } from "../../domain/entities/job-profile.entity";
import { JobProfileDto } from "../dto/job-profile.dto";

export class JobProfileMapper {
  static toDto(domain: JobProfile): JobProfileDto {
    return {
      companyName: domain.getCompanyName(),
      competencies: domain.getCompetencies().map((c) => ({
        depth: c.getDepth(),
        name: c.getName(),
        weight: c.getWeight(),
      })),
      createdAt: domain.getCreatedAt(),
      hardSkills: domain.getHardSkills(),
      id: domain.getId().getValue(),
      interviewDifficultyLevel: domain.getInterviewDifficultyLevel(),
      jobTitle: domain.getJobTitle(),
      jobUrl: domain.getJobUrl(),
      rawJD: domain.getRawJD(),
      seniorityLevel: domain.getSeniorityLevel()?.getValue(),
      softSkills: domain.getSoftSkills(),
      updatedAt: domain.getUpdatedAt(),
      userId: domain.getUserId().getValue(),
    };
  }
}
