/**
 * Current User Response DTO Unit Tests
 *
 * Tests the CurrentUserResponseDto presentation layer DTO.
 * Tests DTO construction and property values.
 */

import { CurrentUserResponseDto } from "./current-user-response.dto";

describe("CurrentUserResponseDto", () => {
  describe("constructor", () => {
    it("should create dto with id and email", () => {
      // Arrange & Act
      const dto = new CurrentUserResponseDto(
        "a1b2c3d4-e5f6-7890-1234-567890abcdef",
        "user@example.com",
      );

      // Assert
      expect(dto).toBeInstanceOf(CurrentUserResponseDto);
      expect(dto.id).toBe("a1b2c3d4-e5f6-7890-1234-567890abcdef");
      expect(dto.email).toBe("user@example.com");
    });

    it("should handle different user ids and emails", () => {
      // Arrange & Act
      const dto = new CurrentUserResponseDto(
        "different-id",
        "another@example.com",
      );

      // Assert
      expect(dto.id).toBe("different-id");
      expect(dto.email).toBe("another@example.com");
    });

    it("should preserve exact email format", () => {
      // Arrange & Act
      const dto = new CurrentUserResponseDto(
        "user-id",
        "Test.User+Tag@Example.COM",
      );

      // Assert
      expect(dto.email).toBe("Test.User+Tag@Example.COM");
    });

    it("should have correct property names for API contract", () => {
      // Arrange & Act
      const dto = new CurrentUserResponseDto("user-id", "user@example.com");

      // Assert
      expect(dto).toHaveProperty("id");
      expect(dto).toHaveProperty("email");
      expect(dto).not.toHaveProperty("userId");
    });
  });
});
