/**
 * Register Handler Unit Tests
 *
 * Tests the RegisterHandler application layer component.
 */

import { ConflictException } from "@nestjs/common";

import { AuthService } from "../../../auth.service";
import { User } from "../../../domain/entities/user.entity";
import { IUserRepository } from "../../../domain/repositories/user.repository.interface";
import { AuthResultDto } from "../../dto/auth-result.dto";
import { RegisterCommand } from "../impl/register.command";
import { RegisterHandler } from "./register.handler";

describe("RegisterHandler", () => {
  let handler: RegisterHandler;
  let authService: jest.Mocked<AuthService>;
  let userRepository: jest.Mocked<IUserRepository>;

  beforeEach(() => {
    authService = {
      login: jest.fn(),
      register: jest.fn(),
    } as any;

    userRepository = {
      findByEmail: jest.fn(),
      findById: jest.fn(),
      findByIdentityId: jest.fn(),
      restore: jest.fn(),
      save: jest.fn(),
      softDelete: jest.fn(),
    } as any;

    handler = new RegisterHandler(authService, userRepository);
  });

  describe("execute", () => {
    it("should register user, persist to database, and return auth result", async () => {
      // Arrange
      const command = new RegisterCommand("new@example.com", "SecurePass123");
      const supabaseId = "123e4567-e89b-12d3-a456-426614174000";
      const result: AuthResultDto = {
        accessToken: "access",
        email: "new@example.com",
        refreshToken: "refresh",
        userId: supabaseId,
      };

      userRepository.findByEmail.mockResolvedValue(null); // No existing user
      authService.register.mockResolvedValue(result);
      userRepository.save.mockResolvedValue(undefined);

      // Act
      const response = await handler.execute(command);

      // Assert
      expect(userRepository.findByEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          getValue: expect.any(Function),
        }),
      );
      expect(authService.register).toHaveBeenCalledWith(
        "new@example.com",
        "SecurePass123",
      );
      expect(userRepository.save).toHaveBeenCalledWith(expect.any(User));
      expect(response).toEqual(result);
    });

    it("should throw ConflictException if user already exists", async () => {
      // Arrange
      const command = new RegisterCommand("existing@example.com", "password");
      const existingIdentityId = "223e4567-e89b-12d3-a456-426614174001";
      const existingUser = User.createNew(
        "existing@example.com",
        existingIdentityId,
      );

      userRepository.findByEmail.mockResolvedValue(existingUser);

      // Act & Assert
      await expect(handler.execute(command)).rejects.toThrow(ConflictException);
      expect(authService.register).not.toHaveBeenCalled();
      expect(userRepository.save).not.toHaveBeenCalled();
    });

    it("should propagate database save errors", async () => {
      // Arrange
      const command = new RegisterCommand("new@example.com", "password");
      const supabaseId = "323e4567-e89b-12d3-a456-426614174002";
      const result: AuthResultDto = {
        accessToken: "access",
        email: "new@example.com",
        refreshToken: "refresh",
        userId: supabaseId,
      };

      userRepository.findByEmail.mockResolvedValue(null);
      authService.register.mockResolvedValue(result);
      userRepository.save.mockRejectedValue(new Error("Database error"));

      // Act & Assert
      await expect(handler.execute(command)).rejects.toThrow("Database error");
    });

    it("should propagate service errors", async () => {
      // Arrange
      const command = new RegisterCommand("new@example.com", "weak");

      userRepository.findByEmail.mockResolvedValue(null);
      authService.register.mockRejectedValue(new Error("Registration failed"));

      // Act & Assert
      await expect(handler.execute(command)).rejects.toThrow(
        "Registration failed",
      );
      expect(userRepository.save).not.toHaveBeenCalled();
    });
  });
});
