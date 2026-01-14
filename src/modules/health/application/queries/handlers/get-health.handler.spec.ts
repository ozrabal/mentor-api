/**
 * Get Health Handler Unit Tests
 *
 * Tests the GetHealthHandler application layer component.
 * This tests the query handler in isolation.
 */

import { HealthDto } from "../../dto/health.dto";
import { GetHealthQuery } from "../impl/get-health.query";
import { GetHealthHandler } from "./get-health.handler";

describe("GetHealthHandler", () => {
  let handler: GetHealthHandler;

  beforeEach(() => {
    handler = new GetHealthHandler();
  });

  describe("execute", () => {
    it("should return health status with timestamp", async () => {
      // Arrange
      const query = new GetHealthQuery();
      const beforeTime = new Date();

      // Act
      const result = await handler.execute(query);

      // Assert
      expect(result).toBeInstanceOf(HealthDto);
      expect(result.status).toBe("ok");
      expect(result.timestamp).toBeInstanceOf(Date);
      expect(result.timestamp.getTime()).toBeGreaterThanOrEqual(
        beforeTime.getTime(),
      );
    });

    it("should return consistent status across multiple calls", async () => {
      // Arrange
      const query = new GetHealthQuery();

      // Act
      const result1 = await handler.execute(query);
      const result2 = await handler.execute(query);

      // Assert
      expect(result1.status).toBe(result2.status);
      expect(result1.status).toBe("ok");
    });
  });
});
