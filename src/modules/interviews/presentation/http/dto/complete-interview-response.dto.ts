import { ApiProperty } from "@nestjs/swagger";

export class CompetencyBreakdownItemResponseDto {
  @ApiProperty({
    description: "Score for this competency (0-100)",
    example: 75,
  })
  score!: number;

  @ApiProperty({
    description: "Gap from target score (negative means above target)",
    example: -5,
  })
  gap!: number;

  @ApiProperty({
    description: "Comment about performance in this competency",
    example: "Strong analytical approach demonstrated",
  })
  comment!: string;
}

export class TopGapResponseDto {
  @ApiProperty({
    description: "Description of the identified gap",
    example: "Technical depth in system design",
  })
  gap!: string;

  @ApiProperty({
    description: "Priority level of this gap",
    enum: ["HIGH", "MEDIUM", "LOW"],
    example: "HIGH",
  })
  priority!: "HIGH" | "LOW" | "MEDIUM";

  @ApiProperty({
    description: "Recommended action to address this gap",
    example: "Review distributed systems patterns",
  })
  action!: string;
}

export class CompleteInterviewResponseDto {
  @ApiProperty({
    description: "Interview session ID",
    example: "123e4567-e89b-12d3-a456-426614174000",
  })
  sessionId!: string;

  @ApiProperty({
    description: "Overall session score (0-100)",
    example: 75.5,
  })
  session_overall_score!: number;

  @ApiProperty({
    description: "Success probability (0-1)",
    example: 0.72,
  })
  success_probability!: number;

  @ApiProperty({
    description: "Breakdown of scores by competency",
    example: {
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
  })
  competency_breakdown!: Record<string, CompetencyBreakdownItemResponseDto>;

  @ApiProperty({
    description: "Top identified gaps requiring improvement",
    type: [TopGapResponseDto],
  })
  top_gaps!: TopGapResponseDto[];

  @ApiProperty({
    description: "Identified strengths from the interview",
    example: [
      "Strong problem-solving approach",
      "Clear communication",
      "Good understanding of core concepts",
    ],
    type: [String],
  })
  strengths!: string[];

  @ApiProperty({
    description: "Generated report information",
    example: {
      created_at: "2026-02-06T10:30:00.000Z",
      id: "123e4567-e89b-12d3-a456-426614174001",
    },
  })
  report!: {
    created_at: string;
    id: string;
  };
}
