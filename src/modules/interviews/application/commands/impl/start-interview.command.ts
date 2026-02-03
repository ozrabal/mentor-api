export class StartInterviewCommand {
  constructor(
    public readonly jobProfileId: string,
    public readonly userId: string,
    public readonly interviewType?: "behavioral" | "mixed" | "technical",
  ) {}
}
