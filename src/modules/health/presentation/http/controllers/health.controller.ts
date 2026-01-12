/**
 * Health Controller
 *
 * HTTP controller for health check endpoint.
 * This controller is thin - it only orchestrates and maps.
 */

import { Controller, Get } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { GetHealthQuery } from '../../../application/queries/impl/get-health.query';
import { HealthMapper } from '../mappers/health.mapper';
import { HealthResponseDto } from '../dto/health-response.dto';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(private readonly queryBus: QueryBus) {}

  @Get()
  @ApiOperation({
    summary: 'Health check',
    description: 'Returns the current health status of the API',
  })
  @ApiResponse({
    status: 200,
    description: 'API is healthy',
    type: HealthResponseDto,
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  async getHealth(): Promise<HealthResponseDto> {
    const healthDto = await this.queryBus.execute(new GetHealthQuery());
    return HealthMapper.toResponseDto(healthDto);
  }
}
