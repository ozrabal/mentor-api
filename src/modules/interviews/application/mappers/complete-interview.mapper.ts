import { InterviewSession } from "@modules/interviews/domain/entities/interview-session.entity";

import {
  CompetencyBreakdownItemDto,
  CompleteInterviewResultDto,
  TopGapDto,
} from "../dto/complete-interview.dto";

export class CompleteInterviewMapper {
  static toResultDto(
    session: InterviewSession,
    reportId: string,
    reportCreatedAt: Date,
  ): CompleteInterviewResultDto {
    return {
      competency_breakdown: this.buildCompetencyBreakdown(session),
      report: {
        created_at: reportCreatedAt.toISOString(),
        id: reportId,
      },
      session_overall_score: session.getSessionOverallScore() ?? 0,
      sessionId: session.getId().getValue(),
      strengths: this.identifyStrengths(session),
      success_probability: this.calculateSuccessProbability(
        session.getSessionOverallScore() ?? 0,
      ),
      top_gaps: this.identifyTopGaps(session),
    };
  }

  private static calculateSuccessProbability(
    sessionOverallScore: number,
  ): number {
    // Rule-based success probability calculation (from PRD Section 6.4)
    if (sessionOverallScore >= 80) return 0.85;
    if (sessionOverallScore >= 70) return 0.72;
    if (sessionOverallScore >= 60) return 0.55;
    if (sessionOverallScore >= 50) return 0.4;
    return 0.25;
  }

  private static buildCompetencyBreakdown(
    session: InterviewSession,
  ): Record<string, CompetencyBreakdownItemDto> {
    // TODO: This will need job profile competencies and question mappings
    // For now, calculate based on overall scores
    const overallScores = session.getOverallScores() ?? [];
    const avgScore =
      overallScores.length > 0
        ? overallScores.reduce((a, b) => a + b, 0) / overallScores.length
        : 0;

    // Placeholder competency breakdown
    // In real implementation, this should map questions to competencies
    return {
      "Overall Performance": {
        comment: this.generateCompetencyComment(avgScore),
        gap: 70 - avgScore, // Assuming 70 is target
        score: avgScore,
      },
    };
  }

  private static generateCompetencyComment(score: number): string {
    if (score >= 80) return "Excellent performance demonstrated";
    if (score >= 70)
      return "Strong performance with minor areas for improvement";
    if (score >= 60) return "Satisfactory performance with room for growth";
    if (score >= 50) return "Adequate performance but needs improvement";
    return "Significant improvement needed";
  }

  private static identifyTopGaps(session: InterviewSession): TopGapDto[] {
    const overallScores = session.getOverallScores() ?? [];
    const _avgScore =
      overallScores.length > 0
        ? overallScores.reduce((a, b) => a + b, 0) / overallScores.length
        : 0;

    const gaps: TopGapDto[] = [];

    // Identify gaps based on score dimensions
    const clarityScores = session.getClarityScores() ?? [];
    const completenessScores = session.getCompletenessScores() ?? [];
    const relevanceScores = session.getRelevanceScores() ?? [];
    const confidenceScores = session.getConfidenceScores() ?? [];

    const avgClarity =
      clarityScores.length > 0
        ? clarityScores.reduce((a, b) => a + b, 0) / clarityScores.length
        : 0;
    const avgCompleteness =
      completenessScores.length > 0
        ? completenessScores.reduce((a, b) => a + b, 0) /
          completenessScores.length
        : 0;
    const avgRelevance =
      relevanceScores.length > 0
        ? relevanceScores.reduce((a, b) => a + b, 0) / relevanceScores.length
        : 0;
    const avgConfidence =
      confidenceScores.length > 0
        ? confidenceScores.reduce((a, b) => a + b, 0) / confidenceScores.length
        : 0;

    // Identify weakest areas
    if (avgClarity < 7) {
      gaps.push({
        action: "Practice STAR method and structured responses",
        gap: "Answer clarity and structure",
        priority: avgClarity < 5 ? "HIGH" : "MEDIUM",
      });
    }

    if (avgCompleteness < 7) {
      gaps.push({
        action: "Ensure all parts of the question are addressed",
        gap: "Completeness of answers",
        priority: avgCompleteness < 5 ? "HIGH" : "MEDIUM",
      });
    }

    if (avgRelevance < 7) {
      gaps.push({
        action: "Study job description and align examples with requirements",
        gap: "Answer relevance to role requirements",
        priority: avgRelevance < 5 ? "HIGH" : "MEDIUM",
      });
    }

    if (avgConfidence < 7) {
      gaps.push({
        action: "Practice speaking aloud and reduce filler words",
        gap: "Communication confidence",
        priority: avgConfidence < 5 ? "HIGH" : "MEDIUM",
      });
    }

    // Sort by priority and limit to top 3
    const priorityOrder = { HIGH: 0, LOW: 2, MEDIUM: 1 };
    return gaps
      .sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority])
      .slice(0, 3);
  }

  private static identifyStrengths(session: InterviewSession): string[] {
    const strengths: string[] = [];

    const clarityScores = session.getClarityScores() ?? [];
    const completenessScores = session.getCompletenessScores() ?? [];
    const relevanceScores = session.getRelevanceScores() ?? [];
    const confidenceScores = session.getConfidenceScores() ?? [];

    const avgClarity =
      clarityScores.length > 0
        ? clarityScores.reduce((a, b) => a + b, 0) / clarityScores.length
        : 0;
    const avgCompleteness =
      completenessScores.length > 0
        ? completenessScores.reduce((a, b) => a + b, 0) /
          completenessScores.length
        : 0;
    const avgRelevance =
      relevanceScores.length > 0
        ? relevanceScores.reduce((a, b) => a + b, 0) / relevanceScores.length
        : 0;
    const avgConfidence =
      confidenceScores.length > 0
        ? confidenceScores.reduce((a, b) => a + b, 0) / confidenceScores.length
        : 0;

    // Identify strong areas (score >= 8)
    if (avgClarity >= 8) {
      strengths.push("Excellent clarity and structure in answers");
    }
    if (avgCompleteness >= 8) {
      strengths.push("Comprehensive and thorough responses");
    }
    if (avgRelevance >= 8) {
      strengths.push("Strong alignment with role requirements");
    }
    if (avgConfidence >= 8) {
      strengths.push("Confident and articulate communication");
    }

    // If no specific strengths, provide general positive feedback
    if (strengths.length === 0) {
      const overallScores = session.getOverallScores() ?? [];
      const avgScore =
        overallScores.length > 0
          ? overallScores.reduce((a, b) => a + b, 0) / overallScores.length
          : 0;
      if (avgScore >= 60) {
        strengths.push("Solid overall performance");
      }
      if (avgScore >= 50) {
        strengths.push("Good effort and engagement");
      }
    }

    return strengths.length > 0 ? strengths : ["Completed the interview"];
  }
}
