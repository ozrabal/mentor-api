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
  ApiOperation,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";

import { CurrentUser } from "@/common/decorators/current-user.decorator";
import { SupabaseJwtGuard } from "@/modules/auth/guards/supabase-jwt.guard";
import { StartInterviewCommand } from "@/modules/interviews/application/commands/impl/start-interview.command";
import { InterviewSessionDto } from "@/modules/interviews/application/dto/interview-session.dto";

import { StartInterviewRequestDto } from "../dto/start-interview-request.dto";
import { StartInterviewResponseDto } from "../dto/start-interview-response.dto";
import { SubmitAnswerRequestDto } from "../dto/submit-answer-request.dto";
import { SubmitAnswerResponseDto } from "../dto/submit-answer-response.dto";
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
  @HttpCode(HttpStatus.OK)
  @Post(":sessionId/answer")
  async submitAnswer(
    @Param("sessionId") sessionId: string,
    @Body() dto: SubmitAnswerRequestDto,
    @CurrentUser() user: { id: string },
  ): Promise<SubmitAnswerResponseDto> {
    const command = SubmitAnswerMapper.toCommand(sessionId, dto, user.id);
    const result = await this.commandBus.execute(command);
    return SubmitAnswerMapper.toResponseDto(result);
  }
}
