/**
 * Health E2E Tests
 *
 * End-to-end tests for the health module HTTP endpoints.
 * Tests the complete request-response cycle.
 */

import { INestApplication } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { HealthModule } from '@modules/health/health.module';
import { E2ETestAppFactory } from './utils/e2e-app-factory';
import { ApiTestClient, ResponseValidator } from './utils/e2e-test.utils';

describe('Health (e2e)', () => {
  let app: INestApplication;
  let apiClient: ApiTestClient;

  beforeAll(async () => {
    app = await E2ETestAppFactory.create({
      imports: [CqrsModule, HealthModule],
      enableValidation: true,
    });

    apiClient = new ApiTestClient(app);
  });

  afterAll(async () => {
    await E2ETestAppFactory.cleanup(app);
  });

  describe('/health (GET)', () => {
    it('should return health status', async () => {
      // Act
      const response = await apiClient.get('/health');

      // Assert
      const body = ResponseValidator.expectSuccess(response, 200);
      expect(body).toEqual({
        status: 'ok',
        timestamp: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/),
      });
    });

    it('should return consistent status across multiple calls', async () => {
      // Act
      const response1 = await apiClient.get('/health');
      const response2 = await apiClient.get('/health');

      // Assert
      const body1 = ResponseValidator.expectSuccess(response1, 200);
      const body2 = ResponseValidator.expectSuccess(response2, 200);
      
      expect(body1.status).toBe('ok');
      expect(body2.status).toBe('ok');
      expect(body1.status).toBe(body2.status);
    });

    it('should return content-type application/json', async () => {
      // Act
      const response = await apiClient.get('/health');

      // Assert
      ResponseValidator.expectSuccess(response, 200);
      ResponseValidator.expectContentType(response, 'json');
    });

    it('should handle concurrent requests', async () => {
      // Act
      const promises = Array(3).fill(null).map(() => apiClient.get('/health'));
      const responses = await Promise.all(promises);

      // Assert
      responses.forEach(response => {
        const body = ResponseValidator.expectSuccess(response, 200);
        expect(body.status).toBe('ok');
        expect(body.timestamp).toBeDefined();
      });
    });
  });
});