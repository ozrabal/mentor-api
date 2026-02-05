import { Body, Controller, Post, UseGuards } from "@nestjs/common";
import { CommandBus } from "@nestjs/cqrs";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";

import { CurrentUser } from "@/common/decorators/current-user.decorator";
import { SupabaseJwtGuard } from "@/modules/auth/guards/supabase-jwt.guard";
import { StartInterviewCommand } from "@/modules/interviews/application/commands/impl/start-interview.command";
import { InterviewSessionDto } from "@/modules/interviews/application/dto/interview-session.dto";

import { StartInterviewRequestDto } from "../dto/start-interview-request.dto";
import { StartInterviewResponseDto } from "../dto/start-interview-response.dto";
import { StartInterviewMapper } from "../mappers/start-interview.mapper";

@ApiBearerAuth("JWT-auth")
@ApiTags("interviews")
@Controller("api/v1/interviews")
@UseGuards(SupabaseJwtGuard)
export class InterviewsController {
  constructor(private readonly commandBus: CommandBus) {}

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
}
