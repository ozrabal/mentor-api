export interface JobProfileInfoDto {
  competencies: Array<{ depth: number; name: string; weight: number }>;
  id: string;
  interviewDifficultyLevel: number;
  jobTitle: string;
  userId: string;
}

export interface IJobProfilesACL {
  getJobProfileInfo(jobProfileId: string): Promise<JobProfileInfoDto | null>;
}
