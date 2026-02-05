export class QuestionResponseDto {
  id!: string;
  text!: string;
  category!: string;
  difficulty!: number;
}

export class StartInterviewResponseDto {
  sessionId!: string;
  question!: QuestionResponseDto;
  sessionToken!: string;
}
