/**
 * Filter options for job profile queries
 */
export interface JobProfileQueryFilters {
  companyName?: string;
  interviewDifficultyLevelMax?: number;
  interviewDifficultyLevelMin?: number;
  jobTitle?: string;
  seniorityLevelMax?: number;
  seniorityLevelMin?: number;
}

/**
 * Sort options for job profile queries
 */
export interface JobProfileQuerySort {
  direction: "asc" | "desc";
  field:
    | "companyName"
    | "createdAt"
    | "jobTitle"
    | "seniorityLevel"
    | "updatedAt";
}

/**
 * Query for listing job profiles with filtering and sorting
 */
export class ListJobProfilesQuery {
  constructor(
    public readonly userId: string,
    public readonly limit: number = 10,
    public readonly offset: number = 0,
    public readonly filters: JobProfileQueryFilters = {},
    public readonly sort: JobProfileQuerySort = {
      direction: "desc",
      field: "createdAt",
    },
  ) {}
}
