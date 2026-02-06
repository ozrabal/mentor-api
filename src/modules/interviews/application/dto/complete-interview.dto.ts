export interface CompetencyBreakdownItemDto {
  comment: string;
  gap: number;
  score: number;
}

export interface TopGapDto {
  action: string;
  gap: string;
  priority: "HIGH" | "LOW" | "MEDIUM";
}

export interface CompleteInterviewResultDto {
  competency_breakdown: Record<string, CompetencyBreakdownItemDto>;
  report: {
    created_at: string;
    id: string;
  };
  session_overall_score: number;
  sessionId: string;
  strengths: string[];
  success_probability: number;
  top_gaps: TopGapDto[];
}
