export class GetJobProfileResponseDto {
  id!: string;
  userId!: string;
  jobTitle?: string;
  companyName?: string;
  jobUrl?: string;
  rawJD?: string;
  competencies!: Array<{
    depth: number;
    name: string;
    weight: number;
  }>;
  hardSkills!: string[];
  softSkills!: string[];
  seniorityLevel?: number;
  interviewDifficultyLevel?: number;
  createdAt!: Date;
  updatedAt!: Date;
}
