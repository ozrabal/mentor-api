/**
 * Auth Controller Unit Tests
 *
 * Tests the AuthController presentation layer component.
 * Tests HTTP endpoint orchestration and mapping.
 */

import { ExecutionContext } from "@nestjs/common";
import { CommandBus, QueryBus } from "@nestjs/cqrs";
import { Test, TestingModule } from "@nestjs/testing";

import { LoginCommand } from "../../../application/commands/impl/login.command";
import { RegisterCommand } from "../../../application/commands/impl/register.command";
import { GetCurrentUserQuery } from "../../../application/queries/impl/get-current-user.query";
import { AuthResultDto } from "../../../application/dto/auth-result.dto";
import { CurrentUserDto } from "../../../application/dto/current-user.dto";
import { SupabaseJwtGuard } from "../../../guards/supabase-jwt.guard";
import { CurrentUserResponseDto } from "../dto/current-user-response.dto";
import { LoginRequestDto } from "../dto/login-request.dto";
import { RegisterRequestDto } from "../dto/register-request.dto";
import { AuthController } from "./auth.controller";

describe("AuthController", () => {
  let controller: AuthController;
  let commandBus: jest.Mocked<CommandBus>;
  let queryBus: jest.Mocked<QueryBus>;

  beforeEach(async () => {
    const mockCommandBus: jest.Mocked<CommandBus> = {
      execute: jest.fn(),
    } as any;

    const mockQueryBus: jest.Mocked<QueryBus> = {
      execute: jest.fn(),
    } as any;

    // Mock the guard to bypass authentication in unit tests
    const mockGuard = {
      canActivate: jest.fn((context: ExecutionContext) => {
        const request = context.switchToHttp().getRequest();
        request.user = {
          email: "test@example.com",
          userId: "test-user-id",
        };
        return true;
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: CommandBus,
          useValue: mockCommandBus,
        },
        {
          provide: QueryBus,
          useValue: mockQueryBus,
        },
      ],
    })
      .overrideGuard(SupabaseJwtGuard)
      .useValue(mockGuard)
      .compile();

    controller = module.get<AuthController>(AuthController);
    commandBus = module.get(CommandBus);
    queryBus = module.get(QueryBus);
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

  describe("getCurrentUser", () => {
    it("should execute GetCurrentUserQuery and return CurrentUserResponseDto", async () => {
      // Arrange
      const user = {
        email: "user@example.com",
        id: "a1b2c3d4-e5f6-7890-1234-567890abcdef",
      };
      const currentUserDto = new CurrentUserDto(user.id, user.email);
      queryBus.execute.mockResolvedValue(currentUserDto);

      // Act
      const response = await controller.getCurrentUser(user);

      // Assert
      expect(queryBus.execute).toHaveBeenCalledWith(
        expect.any(GetCurrentUserQuery),
      );
      expect(response).toBeInstanceOf(CurrentUserResponseDto);
      expect(response.id).toBe("a1b2c3d4-e5f6-7890-1234-567890abcdef");
      expect(response.email).toBe("user@example.com");
    });

    it("should handle different user data", async () => {
      // Arrange
      const user = {
        email: "another@example.com",
        id: "different-user-id",
      };
      const currentUserDto = new CurrentUserDto(user.id, user.email);
      queryBus.execute.mockResolvedValue(currentUserDto);

      // Act
      const response = await controller.getCurrentUser(user);

      // Assert
      expect(response.id).toBe("different-user-id");
      expect(response.email).toBe("another@example.com");
    });

    it("should propagate query bus errors", async () => {
      // Arrange
      const user = {
        email: "user@example.com",
        id: "user-id",
      };
      queryBus.execute.mockRejectedValue(new Error("Query bus error"));

      // Act & Assert
      await expect(controller.getCurrentUser(user)).rejects.toThrow(
        "Query bus error",
      );
    });
  });
});
