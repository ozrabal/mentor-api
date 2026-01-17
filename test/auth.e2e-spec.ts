/**
 * Auth E2E Tests
 *
 * End-to-end tests for the auth module HTTP endpoints.
 * Tests the complete request-response cycle with CommandBus and QueryBus mocked.
 */

import {
  ExecutionContext,
  INestApplication,
  ValidationPipe,
} from "@nestjs/common";
import { CommandBus, CqrsModule, QueryBus } from "@nestjs/cqrs";
import { Test } from "@nestjs/testing";

import { AuthController } from "../src/modules/auth/presentation/http/controllers/auth.controller";
import { SupabaseJwtGuard } from "../src/modules/auth/guards/supabase-jwt.guard";

import { E2ETestAppFactory } from "./utils/e2e-app-factory";
import { ApiTestClient, ResponseValidator } from "./utils/e2e-test.utils";

describe("Auth (e2e)", () => {
  let app: INestApplication;
  let apiClient: ApiTestClient;
  let commandBusMock: { execute: jest.Mock };
  let queryBusMock: { execute: jest.Mock };

  beforeAll(async () => {
    commandBusMock = {
      execute: jest.fn(),
    };

    queryBusMock = {
      execute: jest.fn(),
    };

    // Mock the guard to bypass authentication in E2E tests
    const mockGuard = {
      canActivate: (context: ExecutionContext) => {
        const request = context.switchToHttp().getRequest();
        request.user = {
          email: "test@example.com",
          userId: "test-user-id",
        };
        return true;
      },
    };

    const moduleFixture = await Test.createTestingModule({
      controllers: [AuthController],
      imports: [CqrsModule],
      providers: [
        {
          provide: CommandBus,
          useValue: commandBusMock,
        },
        {
          provide: QueryBus,
          useValue: queryBusMock,
        },
      ],
    })
      .overrideGuard(SupabaseJwtGuard)
      .useValue(mockGuard)
      .compile();

    app = moduleFixture.createNestApplication();

    // Apply global validation pipe
    app.useGlobalPipes(
      new ValidationPipe({
        forbidNonWhitelisted: true,
        transform: true,
        whitelist: true,
      }),
    );

    await app.init();

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

  describe("/api/v1/auth/me (GET)", () => {
    it("should return current user information", async () => {
      // Arrange
      queryBusMock.execute.mockResolvedValue({
        email: "user@example.com",
        userId: "a1b2c3d4-e5f6-7890-1234-567890abcdef",
      });

      // Act
      const response = await apiClient.get("/api/v1/auth/me", {
        Authorization: "Bearer valid-token",
      });

      // Assert
      const body = ResponseValidator.expectSuccess(response, 200);
      expect(body).toEqual({
        email: "user@example.com",
        id: "a1b2c3d4-e5f6-7890-1234-567890abcdef",
      });
      ResponseValidator.expectContentType(response, "json");
    });

    it("should handle different user data", async () => {
      // Arrange
      queryBusMock.execute.mockResolvedValue({
        email: "another@example.com",
        userId: "different-user-id",
      });

      // Act
      const response = await apiClient.get("/api/v1/auth/me");

      // Assert
      const body = ResponseValidator.expectSuccess(response, 200);
      expect(body.id).toBe("different-user-id");
      expect(body.email).toBe("another@example.com");
    });

    it("should propagate query bus errors", async () => {
      // Arrange
      queryBusMock.execute.mockRejectedValue(new Error("Query failed"));

      // Act
      const response = await apiClient.get("/api/v1/auth/me");

      // Assert
      ResponseValidator.expectError(response, 500);
    });
  });
});
