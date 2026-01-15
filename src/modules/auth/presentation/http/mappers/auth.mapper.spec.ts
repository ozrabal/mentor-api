/**
 * Auth Mapper Unit Tests
 *
 * Tests the AuthMapper presentation layer mapper.
 */

import { AuthResultDto } from "../../../application/dto/auth-result.dto";
import { AuthMapper } from "./auth.mapper";

describe("AuthMapper", () => {
  describe("toResponseDto", () => {
    it("should map AuthResultDto to AuthResponseDto", () => {
      // Arrange
      const input: AuthResultDto = {
        accessToken: "access",
        email: "user@example.com",
        refreshToken: "refresh",
        userId: "user-1",
      };

      // Act
      const result = AuthMapper.toResponseDto(input);

      // Assert
      expect(result).toEqual({
        accessToken: "access",
        email: "user@example.com",
        refreshToken: "refresh",
        userId: "user-1",
      });
    });
  });
});
