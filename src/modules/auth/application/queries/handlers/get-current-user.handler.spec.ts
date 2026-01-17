/**
 * Get Current User Handler Unit Tests
 *
 * Tests the GetCurrentUserHandler application layer component.
 * Tests the CQRS query handler for retrieving current user information.
 */

import { Test, TestingModule } from "@nestjs/testing";

import { CurrentUserDto } from "../../dto/current-user.dto";
import { GetCurrentUserQuery } from "../impl/get-current-user.query";
import { GetCurrentUserHandler } from "./get-current-user.handler";

describe("GetCurrentUserHandler", () => {
  let handler: GetCurrentUserHandler;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [GetCurrentUserHandler],
    }).compile();

    handler = module.get<GetCurrentUserHandler>(GetCurrentUserHandler);
  });

  describe("execute", () => {
    it("should return current user dto with provided user id and email", async () => {
      // Arrange
      const query = new GetCurrentUserQuery(
        "a1b2c3d4-e5f6-7890-1234-567890abcdef",
        "user@example.com",
      );

      // Act
      const result = await handler.execute(query);

      // Assert
      expect(result).toBeInstanceOf(CurrentUserDto);
      expect(result.userId).toBe("a1b2c3d4-e5f6-7890-1234-567890abcdef");
      expect(result.email).toBe("user@example.com");
    });

    it("should handle different user ids", async () => {
      // Arrange
      const query = new GetCurrentUserQuery(
        "different-user-id",
        "another@example.com",
      );

      // Act
      const result = await handler.execute(query);

      // Assert
      expect(result.userId).toBe("different-user-id");
      expect(result.email).toBe("another@example.com");
    });

    it("should preserve exact email format", async () => {
      // Arrange
      const query = new GetCurrentUserQuery(
        "user-id",
        "Test.User+Tag@Example.COM",
      );

      // Act
      const result = await handler.execute(query);

      // Assert
      expect(result.email).toBe("Test.User+Tag@Example.COM");
    });
  });
});
