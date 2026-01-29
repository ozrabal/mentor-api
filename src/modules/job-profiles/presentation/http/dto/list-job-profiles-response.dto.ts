export class JobProfileListItemDto {
  id!: string;
  userId!: string;
  jobTitle?: string;
  companyName?: string;
  seniorityLevel?: number;
  interviewDifficultyLevel?: number;
  createdAt!: Date;
  updatedAt!: Date;
}

export class ListJobProfilesResponseDto {
  profiles!: JobProfileListItemDto[];
  total!: number;
}
