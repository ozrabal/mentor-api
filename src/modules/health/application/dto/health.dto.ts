/**
 * Health Application DTO
 *
 * Data Transfer Object for health check results at the application layer.
 */

export class HealthDto {
  constructor(
    public readonly status: string,
    public readonly timestamp: Date,
  ) {}
}
