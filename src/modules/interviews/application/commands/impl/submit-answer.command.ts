/**
 * Command to submit an answer to an interview question
 */
export class SubmitAnswerCommand {
  constructor(
    public readonly sessionId: string,
    public readonly questionId: string,
    public readonly answerText: string,
    public readonly durationSeconds: number,
    public readonly userId: string,
  ) {}
}
