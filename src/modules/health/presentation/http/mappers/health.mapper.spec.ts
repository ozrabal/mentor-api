/**
 * Health Mapper Unit Tests
 *
 * Tests the HealthMapper presentation layer mapper.
 * Tests mapping between application and presentation DTOs.
 */

import { HealthMapper } from './health.mapper';
import { HealthDto } from '../../../application/dto/health.dto';
import { HealthResponseDto } from '../dto/health-response.dto';

describe('HealthMapper', () => {
  describe('toResponseDto', () => {
    it('should map health dto to response dto', () => {
      // Arrange
      const healthDto = new HealthDto('ok', new Date('2024-01-01T12:30:00.000Z'));

      // Act
      const result = HealthMapper.toResponseDto(healthDto);

      // Assert
      expect(result).toBeInstanceOf(HealthResponseDto);
      expect(result.status).toBe('ok');
      expect(result.timestamp).toBe('2024-01-01T12:30:00.000Z');
    });

    it('should handle different status values', () => {
      // Arrange
      const healthDto = new HealthDto('error', new Date('2024-01-01T12:30:00.000Z'));

      // Act
      const result = HealthMapper.toResponseDto(healthDto);

      // Assert
      expect(result.status).toBe('error');
    });

    it('should preserve timestamp accuracy', () => {
      // Arrange
      const timestamp = new Date('2024-01-01T12:30:45.123Z');
      const healthDto = new HealthDto('ok', timestamp);

      // Act
      const result = HealthMapper.toResponseDto(healthDto);

      // Assert
      expect(result.timestamp).toBe('2024-01-01T12:30:45.123Z');
    });
  });
});