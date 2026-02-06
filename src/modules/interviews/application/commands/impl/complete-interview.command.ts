export class CompleteInterviewCommand {
  constructor(
    public readonly sessionId: string,
    public readonly userId: string,
    public readonly endedEarly?: boolean,
  ) {}
}
