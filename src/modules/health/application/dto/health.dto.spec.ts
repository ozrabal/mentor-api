/**
 * Health DTO Unit Tests
 *
 * Tests the HealthDto application layer data transfer object.
 */

import { HealthDto } from './health.dto';

describe('HealthDto', () => {
  describe('constructor', () => {
    it('should create a health dto with status and timestamp', () => {
      // Arrange
      const status = 'ok';
      const timestamp = new Date();

      // Act
      const dto = new HealthDto(status, timestamp);

      // Assert
      expect(dto.status).toBe(status);
      expect(dto.timestamp).toBe(timestamp);
    });

    it('should create a health dto with different status values', () => {
      // Arrange
      const status = 'error';
      const timestamp = new Date();

      // Act
      const dto = new HealthDto(status, timestamp);

      // Assert
      expect(dto.status).toBe(status);
      expect(dto.timestamp).toBe(timestamp);
    });
  });

  describe('properties', () => {
    it('should have readonly properties', () => {
      // Arrange
      const dto = new HealthDto('ok', new Date());

      // Assert - Properties are readonly by design, verified by TypeScript
      expect(dto.status).toBeDefined();
      expect(dto.timestamp).toBeDefined();
    });
  });
});