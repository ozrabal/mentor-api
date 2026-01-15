/**
 * Register Handler Unit Tests
 *
 * Tests the RegisterHandler application layer component.
 */

import { AuthService } from "../../../auth.service";
import { AuthResultDto } from "../../dto/auth-result.dto";
import { RegisterCommand } from "../impl/register.command";
import { RegisterHandler } from "./register.handler";

describe("RegisterHandler", () => {
  let handler: RegisterHandler;
  let authService: jest.Mocked<AuthService>;

  beforeEach(() => {
    authService = {
      login: jest.fn(),
      register: jest.fn(),
    } as any;
    handler = new RegisterHandler(authService);
  });

  describe("execute", () => {
    it("should return auth result from service", async () => {
      // Arrange
      const command = new RegisterCommand("new@example.com", "SecurePass123");
      const result: AuthResultDto = {
        accessToken: "access",
        email: "new@example.com",
        refreshToken: "refresh",
        userId: "id-2",
      };
      authService.register.mockResolvedValue(result);

      // Act
      const response = await handler.execute(command);

      // Assert
      expect(authService.register).toHaveBeenCalledWith(
        "new@example.com",
        "SecurePass123",
      );
      expect(response).toEqual(result);
    });

    it("should propagate service errors", async () => {
      // Arrange
      const command = new RegisterCommand("taken@example.com", "weak");
      authService.register.mockRejectedValue(new Error("Registration failed"));

      // Act & Assert
      await expect(handler.execute(command)).rejects.toThrow(
        "Registration failed",
      );
    });
  });
});
