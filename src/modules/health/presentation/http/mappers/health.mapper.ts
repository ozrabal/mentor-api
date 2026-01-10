/**
 * Health Mapper
 *
 * Maps between Application DTOs and Presentation DTOs.
 * This ensures clean separation between layers.
 */

import { HealthDto } from '../../../application/dto/health.dto';
import { HealthResponseDto } from '../dto/health-response.dto';

export class HealthMapper {
  static toResponseDto(dto: HealthDto): HealthResponseDto {
    return new HealthResponseDto(dto.status, dto.timestamp);
  }
}
