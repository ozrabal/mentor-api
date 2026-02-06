export interface CompetencyBreakdownItemResponseDto {
  comment: string;
  gap: number;
  score: number;
}

export interface TopGapResponseDto {
  action: string;
  gap: string;
  priority: "HIGH" | "LOW" | "MEDIUM";
}

export interface CompleteInterviewResponseDto {
  competency_breakdown: Record<string, CompetencyBreakdownItemResponseDto>;
  report: {
    created_at: string;
    id: string;
  };
  session_overall_score: number;
  sessionId: string;
  strengths: string[];
  success_probability: number;
  top_gaps: TopGapResponseDto[];
}
