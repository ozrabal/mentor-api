import { QuestionDto } from "./question.dto";

export interface InterviewSessionDto {
  firstQuestion: QuestionDto;
  sessionId: string;
  sessionToken: string;
}
