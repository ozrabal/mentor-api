import { JobProfileDto } from "../../../application/dto/job-profile.dto";
import { PaginatedJobProfilesDto } from "../../../application/queries/handlers/list-job-profiles.handler";
import { GetJobProfileResponseDto } from "../dto/get-job-profile-response.dto";
import {
  JobProfileListItemDto,
  ListJobProfilesResponseDto,
} from "../dto/list-job-profiles-response.dto";
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

  static toListItemResponse(dto: JobProfileDto): JobProfileListItemDto {
    return {
      companyName: dto.companyName,
      createdAt: dto.createdAt,
      id: dto.id,
      interviewDifficultyLevel: dto.interviewDifficultyLevel,
      jobTitle: dto.jobTitle,
      seniorityLevel: dto.seniorityLevel,
      updatedAt: dto.updatedAt,
      userId: dto.userId,
    };
  }

  static toListResponse(
    paginated: PaginatedJobProfilesDto,
  ): ListJobProfilesResponseDto {
    return {
      profiles: paginated.profiles.map((profile) =>
        this.toListItemResponse(profile),
      ),
      total: paginated.total,
    };
  }
}
