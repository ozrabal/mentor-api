/**
 * Start Interview E2E Tests
 *
 * End-to-end tests for the start interview endpoint.
 * Tests the complete request-response cycle with CommandBus mocked.
 */

import {
  ExecutionContext,
  INestApplication,
  ValidationPipe,
} from "@nestjs/common";
import { CommandBus, CqrsModule } from "@nestjs/cqrs";
import { Test } from "@nestjs/testing";

import { SupabaseJwtGuard } from "../src/modules/auth/guards/supabase-jwt.guard";
import { InterviewsController } from "../src/modules/interviews/presentation/http/controllers/interviews.controller";

import { E2ETestAppFactory } from "./utils/e2e-app-factory";
import { ApiTestClient, ResponseValidator } from "./utils/e2e-test.utils";

describe("Start Interview (e2e)", () => {
  let app: INestApplication;
  let apiClient: ApiTestClient;
  let commandBusMock: { execute: jest.Mock };

  beforeAll(async () => {
    commandBusMock = {
      execute: jest.fn(),
    };

    // Mock the guard to bypass authentication in E2E tests
    const mockGuard = {
      canActivate: (context: ExecutionContext) => {
        const request = context.switchToHttp().getRequest();
        request.user = {
          email: "test@example.com",
          id: "test-user-id",
        };
        return true;
      },
    };

    const moduleFixture = await Test.createTestingModule({
      controllers: [InterviewsController],
      imports: [CqrsModule],
      providers: [
        {
          provide: CommandBus,
          useValue: commandBusMock,
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

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("POST /api/v1/interviews/start", () => {
    it("should create interview session successfully", async () => {
      // Arrange
      const mockResult = {
        question: {
          category: "leadership",
          difficulty: 7,
          id: "question-uuid",
          text: "Tell me about a time when you led a team through a challenging project.",
        },
        sessionId: "session-uuid",
        sessionToken: "session_session-uuid",
      };

      commandBusMock.execute.mockResolvedValue(mockResult);

      // Act
      const response = await apiClient.post("/api/v1/interviews/start", {
        interviewType: "mixed",
        jobProfileId: "job-profile-uuid",
      });

      // Assert
      const body = ResponseValidator.expectSuccess(response, 200);
      expect(body).toHaveProperty("sessionId");
      expect(body).toHaveProperty("question");
      expect(body.question).toHaveProperty("id");
      expect(body.question).toHaveProperty("text");
      expect(body.question).toHaveProperty("category");
      expect(body.question).toHaveProperty("difficulty");
      expect(body).toHaveProperty("sessionToken");
      ResponseValidator.expectContentType(response, "json");
    });

    it("should validate required jobProfileId field", async () => {
      // Act
      const response = await apiClient.post("/api/v1/interviews/start", {});

      // Assert
      ResponseValidator.expectError(response, 400);
    });

    it("should validate interviewType enum values", async () => {
      // Act
      const response = await apiClient.post("/api/v1/interviews/start", {
        interviewType: "invalid-type",
        jobProfileId: "job-profile-uuid",
      });

      // Assert
      ResponseValidator.expectError(response, 400);
    });

    it("should accept behavioral interview type", async () => {
      // Arrange
      const mockResult = {
        question: {
          category: "leadership",
          difficulty: 7,
          id: "question-uuid",
          text: "Question text",
        },
        sessionId: "session-uuid",
        sessionToken: "session_session-uuid",
      };

      commandBusMock.execute.mockResolvedValue(mockResult);

      // Act
      const response = await apiClient.post("/api/v1/interviews/start", {
        interviewType: "behavioral",
        jobProfileId: "job-profile-uuid",
      });

      // Assert
      ResponseValidator.expectSuccess(response, 200);
    });

    it("should accept technical interview type", async () => {
      // Arrange
      const mockResult = {
        question: {
          category: "technical",
          difficulty: 7,
          id: "question-uuid",
          text: "Question text",
        },
        sessionId: "session-uuid",
        sessionToken: "session_session-uuid",
      };

      commandBusMock.execute.mockResolvedValue(mockResult);

      // Act
      const response = await apiClient.post("/api/v1/interviews/start", {
        interviewType: "technical",
        jobProfileId: "job-profile-uuid",
      });

      // Assert
      ResponseValidator.expectSuccess(response, 200);
    });

    it("should accept mixed interview type", async () => {
      // Arrange
      const mockResult = {
        question: {
          category: "leadership",
          difficulty: 7,
          id: "question-uuid",
          text: "Question text",
        },
        sessionId: "session-uuid",
        sessionToken: "session_session-uuid",
      };

      commandBusMock.execute.mockResolvedValue(mockResult);

      // Act
      const response = await apiClient.post("/api/v1/interviews/start", {
        interviewType: "mixed",
        jobProfileId: "job-profile-uuid",
      });

      // Assert
      ResponseValidator.expectSuccess(response, 200);
    });

    it("should work without interviewType (default to mixed)", async () => {
      // Arrange
      const mockResult = {
        question: {
          category: "leadership",
          difficulty: 7,
          id: "question-uuid",
          text: "Question text",
        },
        sessionId: "session-uuid",
        sessionToken: "session_session-uuid",
      };

      commandBusMock.execute.mockResolvedValue(mockResult);

      // Act
      const response = await apiClient.post("/api/v1/interviews/start", {
        jobProfileId: "job-profile-uuid",
      });

      // Assert
      ResponseValidator.expectSuccess(response, 200);
    });

    it("should reject non-whitelisted fields", async () => {
      // Act
      const response = await apiClient.post("/api/v1/interviews/start", {
        extraField: "should-be-removed",
        jobProfileId: "job-profile-uuid",
      });

      // Assert
      ResponseValidator.expectError(response, 400);
    });

    it("should handle command bus errors with 500", async () => {
      // Arrange
      commandBusMock.execute.mockRejectedValue(new Error("Database error"));

      // Act
      const response = await apiClient.post("/api/v1/interviews/start", {
        jobProfileId: "job-profile-uuid",
      });

      // Assert
      ResponseValidator.expectError(response, 500);
    });

    it("should include all required response fields", async () => {
      // Arrange
      const mockResult = {
        question: {
          category: "leadership",
          difficulty: 7,
          id: "question-uuid",
          text: "Tell me about a time when you led a team.",
        },
        sessionId: "session-uuid",
        sessionToken: "session_session-uuid",
      };

      commandBusMock.execute.mockResolvedValue(mockResult);

      // Act
      const response = await apiClient.post("/api/v1/interviews/start", {
        interviewType: "mixed",
        jobProfileId: "job-profile-uuid",
      });

      // Assert
      const body = ResponseValidator.expectSuccess(response, 200);
      expect(body.sessionId).toBe("session-uuid");
      expect(body.question.id).toBe("question-uuid");
      expect(body.question.text).toBe(
        "Tell me about a time when you led a team.",
      );
      expect(body.question.category).toBe("leadership");
      expect(body.question.difficulty).toBe(7);
      expect(body.sessionToken).toBe("session_session-uuid");
    });
  });
});
