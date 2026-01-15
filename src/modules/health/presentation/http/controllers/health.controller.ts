/**
 * Health Controller
 *
 * HTTP controller for health check endpoint.
 * This controller is thin - it only orchestrates and maps.
 */

import { Controller, Get } from "@nestjs/common";
import { QueryBus } from "@nestjs/cqrs";
import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";

import { HealthDto } from "@/modules/health/application/dto/health.dto";

import { GetHealthQuery } from "../../../application/queries/impl/get-health.query";
import { HealthResponseDto } from "../dto/health-response.dto";
import { HealthMapper } from "../mappers/health.mapper";

@ApiTags("health")
@Controller("api/v1/health")
export class HealthController {
  constructor(private readonly queryBus: QueryBus) {}

  @ApiOperation({
    description: "Returns the current health status of the API",
    summary: "Health check",
  })
  @ApiResponse({
    description: "API is healthy",
    status: 200,
    type: HealthResponseDto,
  })
  @ApiResponse({
    description: "Internal server error",
    status: 500,
  })
  @Get()
  async getHealth(): Promise<HealthResponseDto> {
    const healthDto = await this.queryBus.execute(new GetHealthQuery());
    return HealthMapper.toResponseDto(healthDto as HealthDto);
  }
}
