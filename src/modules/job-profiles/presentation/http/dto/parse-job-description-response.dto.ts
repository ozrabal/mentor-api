export class CompetencyResponseDto {
  name!: string;
  weight!: number;
  depth!: number;
}

export class ParseJobDescriptionResponseDto {
  id!: string;
  jobTitle?: string;
  companyName?: string;
  competencies!: CompetencyResponseDto[];
  hardSkills!: string[];
  softSkills!: string[];
  seniorityLevel?: number;
  interviewDifficultyLevel?: number;
  createdAt!: Date;
}
