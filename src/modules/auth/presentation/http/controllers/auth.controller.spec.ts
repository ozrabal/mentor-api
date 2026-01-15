/**
 * Auth Controller Unit Tests
 *
 * Tests the AuthController presentation layer component.
 * Tests HTTP endpoint orchestration and mapping.
 */

import { CommandBus } from "@nestjs/cqrs";
import { Test, TestingModule } from "@nestjs/testing";

import { LoginCommand } from "../../../application/commands/impl/login.command";
import { RegisterCommand } from "../../../application/commands/impl/register.command";
import { AuthResultDto } from "../../../application/dto/auth-result.dto";
import { LoginRequestDto } from "../dto/login-request.dto";
import { RegisterRequestDto } from "../dto/register-request.dto";
import { AuthController } from "./auth.controller";

describe("AuthController", () => {
  let controller: AuthController;
  let commandBus: jest.Mocked<CommandBus>;

  beforeEach(async () => {
    const mockCommandBus: jest.Mocked<CommandBus> = {
      execute: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: CommandBus,
          useValue: mockCommandBus,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    commandBus = module.get(CommandBus);
  });

  describe("register", () => {
    it("should execute RegisterCommand and return AuthResponseDto", async () => {
      // Arrange
      const req: RegisterRequestDto = {
        email: "user@example.com",
        password: "SecurePass123",
      };
      const result: AuthResultDto = {
        accessToken: "access",
        email: req.email,
        refreshToken: "refresh",
        userId: "user-1",
      };
      commandBus.execute.mockResolvedValue(result);

      // Act
      const response = await controller.register(req);

      // Assert
      expect(commandBus.execute).toHaveBeenCalledWith(
        expect.any(RegisterCommand),
      );
      // Note: mapper returns a plain object matching AuthResponseDto shape
      expect(response).toEqual({
        accessToken: "access",
        email: "user@example.com",
        refreshToken: "refresh",
        userId: "user-1",
      });
    });

    it("should propagate command bus errors", async () => {
      // Arrange
      const req: RegisterRequestDto = {
        email: "user@example.com",
        password: "SecurePass123",
      };
      commandBus.execute.mockRejectedValue(new Error("Registration failed"));

      // Act & Assert
      await expect(controller.register(req)).rejects.toThrow(
        "Registration failed",
      );
    });
  });

  describe("login", () => {
    it("should execute LoginCommand and return AuthResponseDto", async () => {
      // Arrange
      const req: LoginRequestDto = {
        email: "user@example.com",
        password: "SecurePass123",
      };
      const result: AuthResultDto = {
        accessToken: "access-login",
        email: req.email,
        refreshToken: "refresh-login",
        userId: "user-2",
      };
      commandBus.execute.mockResolvedValue(result);

      // Act
      const response = await controller.login(req);

      // Assert
      expect(commandBus.execute).toHaveBeenCalledWith(expect.any(LoginCommand));
      // Note: mapper returns a plain object matching AuthResponseDto shape
      expect(response).toEqual({
        accessToken: "access-login",
        email: "user@example.com",
        refreshToken: "refresh-login",
        userId: "user-2",
      });
    });

    it("should propagate command bus errors", async () => {
      // Arrange
      const req: LoginRequestDto = {
        email: "user@example.com",
        password: "SecurePass123",
      };
      commandBus.execute.mockRejectedValue(new Error("Login failed"));

      // Act & Assert
      await expect(controller.login(req)).rejects.toThrow("Login failed");
    });
  });
});
