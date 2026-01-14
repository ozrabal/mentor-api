/**
 * Health Response DTO Unit Tests
 *
 * Tests the HealthResponseDto presentation layer data transfer object.
 */

import { HealthResponseDto } from './health-response.dto';

describe('HealthResponseDto', () => {
  describe('constructor', () => {
    it('should create health response dto with ISO timestamp', () => {
      // Arrange
      const status = 'ok';
      const timestamp = new Date('2024-01-01T12:30:00.000Z');

      // Act
      const dto = new HealthResponseDto(status, timestamp);

      // Assert
      expect(dto.status).toBe(status);
      expect(dto.timestamp).toBe('2024-01-01T12:30:00.000Z');
    });

    it('should handle different status values', () => {
      // Arrange
      const status = 'error';
      const timestamp = new Date('2024-01-01T12:30:00.000Z');

      // Act
      const dto = new HealthResponseDto(status, timestamp);

      // Assert
      expect(dto.status).toBe(status);
      expect(dto.timestamp).toBe('2024-01-01T12:30:00.000Z');
    });

    it('should convert timestamp to ISO string format', () => {
      // Arrange
      const status = 'ok';
      const timestamp = new Date(2024, 0, 1, 12, 30, 45, 123); // Local date

      // Act
      const dto = new HealthResponseDto(status, timestamp);

      // Assert
      expect(dto.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/);
      expect(new Date(dto.timestamp)).toEqual(timestamp);
    });
  });
});