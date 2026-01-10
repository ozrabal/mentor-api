/**
 * Health Response DTO
 *
 * HTTP response DTO for health check endpoint.
 * This is the contract exposed to clients.
 */

export class HealthResponseDto {
  status: string;
  timestamp: string;

  constructor(status: string, timestamp: Date) {
    this.status = status;
    this.timestamp = timestamp.toISOString();
  }
}
