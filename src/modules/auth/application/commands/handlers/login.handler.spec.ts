/**
 * Login Handler Unit Tests
 *
 * Tests the LoginHandler application layer component.
 */

import { AuthService } from "../../../auth.service";
import { AuthResultDto } from "../../dto/auth-result.dto";
import { LoginCommand } from "../impl/login.command";
import { LoginHandler } from "./login.handler";

describe("LoginHandler", () => {
  let handler: LoginHandler;
  let authService: jest.Mocked<AuthService>;

  beforeEach(() => {
    authService = {
      login: jest.fn(),
      register: jest.fn(),
    } as any;
    handler = new LoginHandler(authService);
  });

  describe("execute", () => {
    it("should return auth result from service", async () => {
      // Arrange
      const command = new LoginCommand("user@example.com", "SecurePass123");
      const result: AuthResultDto = {
        accessToken: "access",
        email: "user@example.com",
        refreshToken: "refresh",
        userId: "id-1",
      };
      authService.login.mockResolvedValue(result);

      // Act
      const response = await handler.execute(command);

      // Assert
      expect(authService.login).toHaveBeenCalledWith(
        "user@example.com",
        "SecurePass123",
      );
      expect(response).toEqual(result);
    });

    it("should propagate service errors", async () => {
      // Arrange
      const command = new LoginCommand("user@example.com", "bad");
      authService.login.mockRejectedValue(new Error("Invalid credentials"));

      // Act & Assert
      await expect(handler.execute(command)).rejects.toThrow(
        "Invalid credentials",
      );
    });
  });
});
