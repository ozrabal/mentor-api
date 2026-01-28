import { JobProfileDto } from "../../../application/dto/job-profile.dto";
import { GetJobProfileResponseDto } from "../dto/get-job-profile-response.dto";
import { ParseJobDescriptionResponseDto } from "../dto/parse-job-description-response.dto";

export class JobProfileHttpMapper {
  static toParseResponse(dto: JobProfileDto): ParseJobDescriptionResponseDto {
    return {
      companyName: dto.companyName,
      competencies: dto.competencies,
      createdAt: dto.createdAt,
      hardSkills: dto.hardSkills,
      id: dto.id,
      interviewDifficultyLevel: dto.interviewDifficultyLevel,
      jobTitle: dto.jobTitle,
      seniorityLevel: dto.seniorityLevel,
      softSkills: dto.softSkills,
    };
  }

  static toGetResponse(dto: JobProfileDto): GetJobProfileResponseDto {
    return {
      companyName: dto.companyName,
      competencies: dto.competencies,
      createdAt: dto.createdAt,
      hardSkills: dto.hardSkills,
      id: dto.id,
      interviewDifficultyLevel: dto.interviewDifficultyLevel,
      jobTitle: dto.jobTitle,
      jobUrl: dto.jobUrl,
      rawJD: dto.rawJD,
      seniorityLevel: dto.seniorityLevel,
      softSkills: dto.softSkills,
      updatedAt: dto.updatedAt,
      userId: dto.userId,
    };
  }
}
