import { CommandHandler, ICommandHandler } from "@nestjs/cqrs";

import { InterviewSessionDto } from "../../dto/interview-session.dto";
import { StartInterviewCommand } from "../impl/start-interview.command";

@CommandHandler(StartInterviewCommand)
export class StartInterviewHandler implements ICommandHandler<StartInterviewCommand> {
  async execute(command: StartInterviewCommand): Promise<InterviewSessionDto> {
    // TODO: Step 1 - Placeholder implementation
    const sessionId = crypto.randomUUID();

    return {
      firstQuestion: {
        category: "behavioral",
        difficulty: 5,
        id: crypto.randomUUID(),
        text: "Tell me about a time when you faced a challenging situation at work.",
      },
      sessionId,
      sessionToken: `session_${sessionId}`,
    };
  }
}
