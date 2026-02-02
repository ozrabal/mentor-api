export class UpdateJobProfileCommand {
  constructor(
    public readonly userId: string,
    public readonly jobProfileId: string,
    public readonly jobTitle?: string,
    public readonly companyName?: string,
    public readonly competencies?: Array<{
      depth: number;
      name: string;
      weight: number;
    }>,
    public readonly hardSkills?: string[],
    public readonly softSkills?: string[],
    public readonly seniorityLevel?: number,
    public readonly interviewDifficultyLevel?: number,
  ) {}
}
