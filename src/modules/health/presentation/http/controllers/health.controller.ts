/**
 * Health Controller
 *
 * HTTP controller for health check endpoint.
 * This controller is thin - it only orchestrates and maps.
 */

import { Controller, Get, UseGuards } from "@nestjs/common";
import { QueryBus } from "@nestjs/cqrs";
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";

import { SupabaseJwtGuard } from "@/modules/auth/public";
import { HealthDto } from "@/modules/health/application/dto/health.dto";

import { GetHealthQuery } from "../../../application/queries/impl/get-health.query";
import { HealthResponseDto } from "../dto/health-response.dto";
import { HealthMapper } from "../mappers/health.mapper";

@ApiBearerAuth("JWT-auth")
@ApiTags("health")
@Controller("api/v1/health")
@UseGuards(SupabaseJwtGuard)
export class HealthController {
  constructor(private readonly queryBus: QueryBus) {}

  @ApiOperation({
    description:
      "Returns the current health status of the API. Requires authentication.",
    summary: "Health check (protected)",
  })
  @ApiResponse({
    description: "API is healthy",
    status: 200,
    type: HealthResponseDto,
  })
  @ApiResponse({
    description: "Unauthorized - invalid or missing JWT token",
    status: 401,
  })
  @ApiResponse({
    description: "Internal server error",
    status: 500,
  })
  @Get()
  async getHealth(): Promise<HealthResponseDto> {
    const healthDto = await this.queryBus.execute<GetHealthQuery, HealthDto>(
      new GetHealthQuery(),
    );
    return HealthMapper.toResponseDto(healthDto);
  }
}
