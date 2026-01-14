/**
 * Health Controller Unit Tests
 *
 * Tests the HealthController presentation layer component.
 * Tests HTTP endpoint orchestration and mapping.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { QueryBus } from '@nestjs/cqrs';
import { HealthController } from './health.controller';
import { GetHealthQuery } from '../../../application/queries/impl/get-health.query';
import { HealthDto } from '../../../application/dto/health.dto';
import { HealthResponseDto } from '../dto/health-response.dto';

describe('HealthController', () => {
  let controller: HealthController;
  let queryBus: jest.Mocked<QueryBus>;

  beforeEach(async () => {
    const mockQueryBus = {
      execute: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        {
          provide: QueryBus,
          useValue: mockQueryBus,
        },
      ],
    }).compile();

    controller = module.get<HealthController>(HealthController);
    queryBus = module.get(QueryBus);
  });

  describe('getHealth', () => {
    it('should return health response dto', async () => {
      // Arrange
      const healthDto = new HealthDto('ok', new Date('2024-01-01'));
      queryBus.execute.mockResolvedValue(healthDto);

      // Act
      const result = await controller.getHealth();

      // Assert
      expect(queryBus.execute).toHaveBeenCalledWith(expect.any(GetHealthQuery));
      expect(result).toBeInstanceOf(HealthResponseDto);
      expect(result.status).toBe('ok');
      expect(result.timestamp).toBe('2024-01-01T00:00:00.000Z');
    });

    it('should handle different health statuses', async () => {
      // Arrange
      const healthDto = new HealthDto('error', new Date('2024-01-01'));
      queryBus.execute.mockResolvedValue(healthDto);

      // Act
      const result = await controller.getHealth();

      // Assert
      expect(result.status).toBe('error');
    });

    it('should propagate query bus errors', async () => {
      // Arrange
      const error = new Error('Query bus error');
      queryBus.execute.mockRejectedValue(error);

      // Act & Assert
      await expect(controller.getHealth()).rejects.toThrow('Query bus error');
    });
  });
});