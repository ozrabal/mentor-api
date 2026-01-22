import { CompetencyDto } from "./competency.dto";

export interface JobProfileDto {
  companyName?: string;
  competencies: CompetencyDto[];
  createdAt: Date;
  hardSkills: string[];
  id: string;
  interviewDifficultyLevel?: number;
  jobTitle?: string;
  jobUrl?: string;
  rawJD?: string;
  seniorityLevel?: number;
  softSkills: string[];
  updatedAt: Date;
  userId: string;
}
