export class QuestionResponseDto {
  id!: string;
  text!: string;
  category!: string;
  difficulty!: number;
}

export class StartInterviewResponseDto {
  sessionId!: string;
  firstQuestion!: QuestionResponseDto;
  sessionToken!: string;
}
