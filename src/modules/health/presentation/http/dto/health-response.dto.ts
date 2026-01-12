/**
 * Health Response DTO
 *
 * HTTP response DTO for health check endpoint.
 * This is the contract exposed to clients.
 */

import { ApiProperty } from '@nestjs/swagger';

export class HealthResponseDto {
  @ApiProperty({
    description: 'Health status of the API',
    example: 'ok',
  })
  status: string;

  @ApiProperty({
    description: 'ISO 8601 timestamp of the health check',
    example: '2026-01-15T10:30:00.000Z',
  })
  timestamp: string;

  constructor(status: string, timestamp: Date) {
    this.status = status;
    this.timestamp = timestamp.toISOString();
  }
}
