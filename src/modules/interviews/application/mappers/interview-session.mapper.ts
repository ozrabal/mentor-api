import { InterviewSession } from "@modules/interviews/domain/entities/interview-session.entity";

import { InterviewSessionDto } from "../dto/interview-session.dto";

export class InterviewSessionMapper {
  static toDto(session: InterviewSession): InterviewSessionDto {
    const question = session.getQuestion();

    if (!question) {
      throw new Error("Interview session must have at least one question");
    }

    return {
      question: {
        category: question.category,
        difficulty: question.difficulty,
        id: question.id,
        text: question.text,
      },
      sessionId: session.getId().getValue(),
      sessionToken: `session_${session.getId().getValue()}`,
    };
  }
}
