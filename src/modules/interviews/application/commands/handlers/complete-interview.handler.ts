import { CommandHandler, ICommandHandler } from "@nestjs/cqrs";

import { CompleteInterviewResultDto } from "../../dto/complete-interview.dto";
import { CompleteInterviewCommand } from "../impl/complete-interview.command";

@CommandHandler(CompleteInterviewCommand)
export class CompleteInterviewHandler implements ICommandHandler<CompleteInterviewCommand> {
  async execute(
    command: CompleteInterviewCommand,
  ): Promise<CompleteInterviewResultDto> {
    // TODO: Placeholder implementation
    // Step 2 will add real repository queries and scoring logic

    return {
      competency_breakdown: {
        Communication: {
          comment: "Clear explanations with room for improvement",
          gap: 0,
          score: 70,
        },
        "Problem Solving": {
          comment: "Strong analytical approach demonstrated",
          gap: -10,
          score: 80,
        },
      },
      report: {
        created_at: new Date().toISOString(),
        id: crypto.randomUUID(),
      },
      session_overall_score: 75.5,
      sessionId: command.sessionId,
      strengths: [
        "Strong problem-solving approach",
        "Clear communication",
        "Good understanding of core concepts",
      ],
      success_probability: 0.72,
      top_gaps: [
        {
          action: "Review distributed systems patterns",
          gap: "Technical depth in system design",
          priority: "HIGH",
        },
        {
          action: "Practice STAR method with concrete examples",
          gap: "Behavioral examples lacking specificity",
          priority: "MEDIUM",
        },
      ],
    };
  }
}
