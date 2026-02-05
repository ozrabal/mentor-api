import { QuestionDto } from "./question.dto";

export interface InterviewSessionDto {
  question: QuestionDto;
  sessionId: string;
  sessionToken: string;
}
