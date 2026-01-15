/**
 * Auth Response DTO Unit Tests
 */

import { AuthResponseDto } from "./auth-response.dto";

describe("AuthResponseDto", () => {
  it("should hold expected properties", () => {
    const dto: AuthResponseDto = {
      accessToken: "a",
      email: "user@example.com",
      refreshToken: "r",
      userId: "u",
    };

    expect(dto.accessToken).toBe("a");
    expect(dto.refreshToken).toBe("r");
    expect(dto.userId).toBe("u");
    expect(dto.email).toBe("user@example.com");
  });
});
