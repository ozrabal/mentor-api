/**
 * Current User Mapper Unit Tests
 *
 * Tests the CurrentUserMapper presentation layer mapper.
 * Tests mapping between application and presentation DTOs.
 */

import { CurrentUserDto } from "../../../application/dto/current-user.dto";
import { CurrentUserResponseDto } from "../dto/current-user-response.dto";
import { CurrentUserMapper } from "./current-user.mapper";

describe("CurrentUserMapper", () => {
  describe("toResponseDto", () => {
    it("should map current user dto to response dto", () => {
      // Arrange
      const currentUserDto = new CurrentUserDto(
        "a1b2c3d4-e5f6-7890-1234-567890abcdef",
        "user@example.com",
      );

      // Act
      const result = CurrentUserMapper.toResponseDto(currentUserDto);

      // Assert
      expect(result).toBeInstanceOf(CurrentUserResponseDto);
      expect(result.id).toBe("a1b2c3d4-e5f6-7890-1234-567890abcdef");
      expect(result.email).toBe("user@example.com");
    });

    it("should correctly map userId to id", () => {
      // Arrange
      const currentUserDto = new CurrentUserDto("user-123", "test@example.com");

      // Act
      const result = CurrentUserMapper.toResponseDto(currentUserDto);

      // Assert
      expect(result.id).toBe("user-123");
      expect(result).not.toHaveProperty("userId");
    });

    it("should preserve email exactly as provided", () => {
      // Arrange
      const currentUserDto = new CurrentUserDto(
        "user-id",
        "Test.User+Tag@Example.COM",
      );

      // Act
      const result = CurrentUserMapper.toResponseDto(currentUserDto);

      // Assert
      expect(result.email).toBe("Test.User+Tag@Example.COM");
    });

    it("should handle different user ids and emails", () => {
      // Arrange
      const currentUserDto = new CurrentUserDto(
        "another-user-id",
        "different@example.com",
      );

      // Act
      const result = CurrentUserMapper.toResponseDto(currentUserDto);

      // Assert
      expect(result.id).toBe("another-user-id");
      expect(result.email).toBe("different@example.com");
    });
  });
});
