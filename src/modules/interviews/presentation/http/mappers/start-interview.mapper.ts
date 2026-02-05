import { StartInterviewCommand } from "@modules/interviews/application/commands/impl/start-interview.command";
import { InterviewSessionDto } from "@modules/interviews/application/dto/interview-session.dto";

import { StartInterviewRequestDto } from "../dto/start-interview-request.dto";
import { StartInterviewResponseDto } from "../dto/start-interview-response.dto";

export class StartInterviewMapper {
  static toCommand(
    dto: StartInterviewRequestDto,
    userId: string,
  ): StartInterviewCommand {
    return new StartInterviewCommand(
      dto.jobProfileId,
      userId,
      dto.interviewType,
    );
  }

  static toResponseDto(
    sessionDto: InterviewSessionDto,
  ): StartInterviewResponseDto {
    return {
      question: {
        category: sessionDto.question.category,
        difficulty: sessionDto.question.difficulty,
        id: sessionDto.question.id,
        text: sessionDto.question.text,
      },
      sessionId: sessionDto.sessionId,
      sessionToken: sessionDto.sessionToken,
    };
  }
}
