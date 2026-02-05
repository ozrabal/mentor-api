import { ApiProperty } from "@nestjs/swagger";

export class QuestionResponseDto {
  @ApiProperty({
    description: "Unique question identifier",
    example: "987e6543-e21b-12d3-a456-426614174999",
  })
  id!: string;

  @ApiProperty({
    description: "Question text",
    example:
      "Tell me about a time when you led a team through a challenging project.",
  })
  text!: string;

  @ApiProperty({
    description: "Competency category",
    example: "leadership",
  })
  category!: string;

  @ApiProperty({
    description: "Question difficulty level (1-10)",
    example: 6,
    maximum: 10,
    minimum: 1,
  })
  difficulty!: number;
}

export class StartInterviewResponseDto {
  @ApiProperty({
    description: "Interview session ID",
    example: "123e4567-e89b-12d3-a456-426614174001",
  })
  sessionId!: string;

  @ApiProperty({
    description: "First question in the interview",
    type: QuestionResponseDto,
  })
  question!: QuestionResponseDto;

  @ApiProperty({
    description: "Session token for subsequent requests",
    example: "session_123e4567-e89b-12d3-a456-426614174001",
  })
  sessionToken!: string;
}
