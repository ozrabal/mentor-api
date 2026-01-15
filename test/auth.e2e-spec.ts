/**
 * Auth E2E Tests
 *
 * End-to-end tests for the auth module HTTP endpoints.
 * Tests the complete request-response cycle with CommandBus mocked.
 */

import { INestApplication } from "@nestjs/common";
import { CommandBus } from "@nestjs/cqrs";

import { AuthController } from "@/modules/auth/presentation/http/controllers/auth.controller";

import { E2ETestAppFactory } from "./utils/e2e-app-factory";
import { ApiTestClient, ResponseValidator } from "./utils/e2e-test.utils";

describe("Auth (e2e)", () => {
  let app: INestApplication;
  let apiClient: ApiTestClient;
  let commandBusMock: { execute: jest.Mock };

  beforeAll(async () => {
    commandBusMock = {
      execute: jest.fn(),
    };

    app = await E2ETestAppFactory.create({
      controllers: [AuthController],
      enableValidation: true,
      providers: [
        {
          provide: CommandBus,
          useValue: commandBusMock,
        },
      ],
    });

    apiClient = new ApiTestClient(app);
  });

  afterAll(async () => {
    await E2ETestAppFactory.cleanup(app);
  });

  describe("/api/v1/auth/register (POST)", () => {
    it("should register user and return tokens", async () => {
      // Arrange
      commandBusMock.execute.mockResolvedValue({
        accessToken: "access",
        email: "new@example.com",
        refreshToken: "refresh",
        userId: "user-1",
      });

      // Act
      const response = await apiClient.post("/api/v1/auth/register", {
        email: "new@example.com",
        password: "SecurePass123",
      });

      // Assert
      const body = ResponseValidator.expectSuccess(response, 201);
      expect(body).toEqual({
        accessToken: "access",
        email: "new@example.com",
        refreshToken: "refresh",
        userId: "user-1",
      });
      ResponseValidator.expectContentType(response, "json");
    });

    it("should validate payload and return 400 on invalid input", async () => {
      // Act
      const response = await apiClient.post("/api/v1/auth/register", {
        email: "bad-email",
        password: "123",
      });

      // Assert
      ResponseValidator.expectError(response, 400);
    });
  });

  describe("/api/v1/auth/login (POST)", () => {
    it("should login and return tokens", async () => {
      // Arrange
      commandBusMock.execute.mockResolvedValue({
        accessToken: "access-login",
        email: "user@example.com",
        refreshToken: "refresh-login",
        userId: "user-2",
      });

      // Act
      const response = await apiClient.post("/api/v1/auth/login", {
        email: "user@example.com",
        password: "SecurePass123",
      });

      // Assert
      const body = ResponseValidator.expectSuccess(response, 201);
      expect(body).toEqual({
        accessToken: "access-login",
        email: "user@example.com",
        refreshToken: "refresh-login",
        userId: "user-2",
      });
    });

    it("should validate payload and return 400 on invalid input", async () => {
      // Act
      const response = await apiClient.post("/api/v1/auth/login", {
        email: "not-an-email",
        password: "123",
      });

      // Assert
      ResponseValidator.expectError(response, 400);
    });
  });
});
