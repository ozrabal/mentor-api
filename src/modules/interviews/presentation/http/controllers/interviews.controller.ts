import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  UseGuards,
} from "@nestjs/common";
import { CommandBus } from "@nestjs/cqrs";
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";

import { CurrentUser } from "@/common/decorators/current-user.decorator";
import { SupabaseJwtGuard } from "@/modules/auth/guards/supabase-jwt.guard";
import { CompleteInterviewCommand } from "@/modules/interviews/application/commands/impl/complete-interview.command";
import { StartInterviewCommand } from "@/modules/interviews/application/commands/impl/start-interview.command";
import { SubmitAnswerCommand } from "@/modules/interviews/application/commands/impl/submit-answer.command";
import { CompleteInterviewResultDto } from "@/modules/interviews/application/dto/complete-interview.dto";
import { InterviewSessionDto } from "@/modules/interviews/application/dto/interview-session.dto";
import { SubmitAnswerResultDto } from "@/modules/interviews/application/dto/submit-answer.dto";

import { CompleteInterviewRequestDto } from "../dto/complete-interview-request.dto";
import { CompleteInterviewResponseDto } from "../dto/complete-interview-response.dto";
import { StartInterviewRequestDto } from "../dto/start-interview-request.dto";
import { StartInterviewResponseDto } from "../dto/start-interview-response.dto";
import { SubmitAnswerRequestDto } from "../dto/submit-answer-request.dto";
import { SubmitAnswerResponseDto } from "../dto/submit-answer-response.dto";
import { CompleteInterviewHttpMapper } from "../mappers/complete-interview-http.mapper";
import { StartInterviewMapper } from "../mappers/start-interview.mapper";
import { SubmitAnswerMapper } from "../mappers/submit-answer.mapper";

@ApiBearerAuth("JWT-auth")
@ApiTags("interviews")
@Controller("api/v1/interviews")
@UseGuards(SupabaseJwtGuard)
export class InterviewsController {
  constructor(private readonly commandBus: CommandBus) {}

  @ApiOperation({
    description:
      "Creates a new interview session for a specific job profile. Validates that the job profile exists and belongs to the authenticated user, then selects the first question based on job profile competencies and difficulty level.",
    summary: "Start a new interview session",
  })
  @ApiResponse({
    description: "Interview session successfully created",
    status: HttpStatus.OK,
    type: StartInterviewResponseDto,
  })
  @ApiResponse({
    description: "Validation error - invalid request body",
    schema: {
      properties: {
        error: { example: "Bad Request", type: "string" },
        message: {
          example: ["jobProfileId must be a string"],
          type: "array",
        },
        statusCode: { example: 400, type: "number" },
      },
      type: "object",
    },
    status: HttpStatus.BAD_REQUEST,
  })
  @ApiResponse({
    description: "Unauthorized - missing or invalid JWT token",
    schema: {
      properties: {
        message: { example: "Unauthorized", type: "string" },
        statusCode: { example: 401, type: "number" },
      },
      type: "object",
    },
    status: HttpStatus.UNAUTHORIZED,
  })
  @ApiResponse({
    description: "Forbidden - job profile does not belong to the user",
    schema: {
      properties: {
        error: { example: "Forbidden", type: "string" },
        message: {
          example: "You do not have access to this job profile",
          type: "string",
        },
        statusCode: { example: 403, type: "number" },
      },
      type: "object",
    },
    status: HttpStatus.FORBIDDEN,
  })
  @ApiResponse({
    description: "Not Found - job profile does not exist",
    schema: {
      properties: {
        error: { example: "Not Found", type: "string" },
        message: { example: "Job profile not found", type: "string" },
        statusCode: { example: 404, type: "number" },
      },
      type: "object",
    },
    status: HttpStatus.NOT_FOUND,
  })
  @ApiResponse({
    description: "Internal Server Error",
    schema: {
      properties: {
        error: { example: "Internal Server Error", type: "string" },
        message: { example: "Internal server error", type: "string" },
        statusCode: { example: 500, type: "number" },
      },
      type: "object",
    },
    status: HttpStatus.INTERNAL_SERVER_ERROR,
  })
  @HttpCode(HttpStatus.OK)
  @Post("start")
  async startInterview(
    @Body() dto: StartInterviewRequestDto,
    @CurrentUser() user: { id: string },
  ): Promise<StartInterviewResponseDto> {
    const command = StartInterviewMapper.toCommand(dto, user.id);
    const result = await this.commandBus.execute<
      StartInterviewCommand,
      InterviewSessionDto
    >(command);
    return StartInterviewMapper.toResponseDto(result);
  }

  /**
   * Submit an answer to an interview question
   *
   * POST /api/v1/interviews/:sessionId/answer
   */
  @ApiOperation({
    description:
      "Submits an answer to the current question in an active interview session.",
    summary: "Submit an answer to an interview question",
  })
  @ApiParam({
    description: "Interview session ID",
    example: "550e8400-e29b-41d4-a716-446655440000",
    name: "sessionId",
  })
  @ApiResponse({
    description: "Answer submitted successfully with scores and next question",
    status: 200,
    type: SubmitAnswerResponseDto,
  })
  @ApiResponse({
    description:
      "Bad Request - Session not in progress, invalid question ID, or validation error",
    schema: {
      example: {
        error: "Bad Request",
        message: "Interview session is not in progress",
        statusCode: 400,
      },
    },
    status: 400,
  })
  @ApiResponse({
    description: "Unauthorized - Missing or invalid JWT token",
    status: 401,
  })
  @ApiResponse({
    description: "Forbidden - User does not own this interview session",
    schema: {
      example: {
        error: "Forbidden",
        message: "You do not have access to this interview session",
        statusCode: 403,
      },
    },
    status: 403,
  })
  @ApiResponse({
    description: "Not Found - Interview session or job profile not found",
    schema: {
      example: {
        error: "Not Found",
        message: "Interview session not found",
        statusCode: 404,
      },
    },
    status: 404,
  })
  @ApiResponse({
    description: "Internal Server Error",
    status: 500,
  })
  @HttpCode(HttpStatus.OK)
  @Post(":sessionId/answer")
  async submitAnswer(
    @Param("sessionId") sessionId: string,
    @Body() dto: SubmitAnswerRequestDto,
    @CurrentUser() user: { id: string },
  ): Promise<SubmitAnswerResponseDto> {
    const command = SubmitAnswerMapper.toCommand(sessionId, dto, user.id);
    const result = await this.commandBus.execute<
      SubmitAnswerCommand,
      SubmitAnswerResultDto
    >(command);
    return SubmitAnswerMapper.toResponseDto(result);
  }

  @ApiBody({
    description: "Optional completion parameters",
    type: CompleteInterviewRequestDto,
  })
  @ApiOperation({
    description:
      "Finalizes an interview session by calculating aggregate scores, generating competency breakdown, calculating success probability, creating a report, and updating the session status to completed",
    summary: "Complete interview session",
  })
  @ApiParam({
    description: "Interview session ID",
    example: "123e4567-e89b-12d3-a456-426614174000",
    name: "sessionId",
    type: "string",
  })
  @ApiResponse({
    description: "Interview session completed successfully",
    status: 200,
    type: CompleteInterviewResponseDto,
  })
  @ApiResponse({
    description: "Session is not in progress or invalid state",
    schema: {
      example: {
        error: "Bad Request",
        message: "Cannot complete interview session with status: completed",
        statusCode: 400,
      },
    },
    status: 400,
  })
  @ApiResponse({
    description: "Unauthorized - Invalid or missing JWT token",
    schema: {
      example: {
        message: "Unauthorized",
        statusCode: 401,
      },
    },
    status: 401,
  })
  @ApiResponse({
    description: "Forbidden - User does not own this session",
    schema: {
      example: {
        error: "Forbidden",
        message:
          "You do not have permission to complete this interview session",
        statusCode: 403,
      },
    },
    status: 403,
  })
  @ApiResponse({
    description: "Interview session not found",
    schema: {
      example: {
        error: "Not Found",
        message: "Interview session with ID xxx not found",
        statusCode: 404,
      },
    },
    status: 404,
  })
  @ApiResponse({
    description: "Internal server error",
    schema: {
      example: {
        error: "Internal Server Error",
        message: "Internal server error",
        statusCode: 500,
      },
    },
    status: 500,
  })
  @HttpCode(HttpStatus.OK)
  @Post(":sessionId/complete")
  async completeInterview(
    @Param("sessionId") sessionId: string,
    @Body() dto: CompleteInterviewRequestDto,
    @CurrentUser() user: { id: string },
  ): Promise<CompleteInterviewResponseDto> {
    const command = CompleteInterviewHttpMapper.toCommand(
      sessionId,
      user.id,
      dto,
    );
    const result = await this.commandBus.execute<
      CompleteInterviewCommand,
      CompleteInterviewResultDto
    >(command);
    return CompleteInterviewHttpMapper.toResponseDto(result);
  }
}
