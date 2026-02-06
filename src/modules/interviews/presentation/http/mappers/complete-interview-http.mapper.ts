import { CompleteInterviewCommand } from "@modules/interviews/application/commands/impl/complete-interview.command";
import {
  CompetencyBreakdownItemDto,
  CompleteInterviewResultDto,
  TopGapDto,
} from "@modules/interviews/application/dto/complete-interview.dto";

import { CompleteInterviewRequestDto } from "../dto/complete-interview-request.dto";
import {
  CompetencyBreakdownItemResponseDto,
  CompleteInterviewResponseDto,
  TopGapResponseDto,
} from "../dto/complete-interview-response.dto";

export class CompleteInterviewHttpMapper {
  static toCommand(
    sessionId: string,
    userId: string,
    dto: CompleteInterviewRequestDto,
  ): CompleteInterviewCommand {
    return new CompleteInterviewCommand(sessionId, userId, dto.endedEarly);
  }

  static toResponseDto(
    result: CompleteInterviewResultDto,
  ): CompleteInterviewResponseDto {
    return {
      competency_breakdown: Object.entries(result.competency_breakdown).reduce(
        (acc, [key, value]) => {
          acc[key] = this.toCompetencyBreakdownItemResponseDto(value);
          return acc;
        },
        {} as Record<string, CompetencyBreakdownItemResponseDto>,
      ),
      report: result.report,
      session_overall_score: result.session_overall_score,
      sessionId: result.sessionId,
      strengths: result.strengths,
      success_probability: result.success_probability,
      top_gaps: result.top_gaps.map(this.toTopGapResponseDto),
    };
  }

  private static toCompetencyBreakdownItemResponseDto(
    this: void,
    item: CompetencyBreakdownItemDto,
  ): CompetencyBreakdownItemResponseDto {
    return {
      comment: item.comment,
      gap: item.gap,
      score: item.score,
    };
  }

  private static toTopGapResponseDto(
    this: void,
    gap: TopGapDto,
  ): TopGapResponseDto {
    return {
      action: gap.action,
      gap: gap.gap,
      priority: gap.priority,
    };
  }
}
