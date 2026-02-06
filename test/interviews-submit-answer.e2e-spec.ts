/**
 * Submit Answer E2E Tests
 *
 * End-to-end tests for the submit answer endpoint.
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

import { ApiTestClient, ResponseValidator } from "./utils/e2e-test.utils";
import { E2ETestAppFactory } from "./utils/e2e-app-factory";

describe("Submit Answer (e2e)", () => {
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

  describe("POST /api/v1/interviews/:sessionId/answer", () => {
    const sessionId = "session-uuid-123";

    it("should submit answer successfully and return scores with next question", async () => {
      // Arrange
      const mockResult = {
        feedback: undefined,
        overall_score: 83.75,
        question: {
          category: "Teamwork",
          difficulty: 6,
          id: "next-question-uuid",
          text: "Describe a situation where you had to work with a difficult team member.",
        },
        scoring: {
          clarity: 8.5,
          completeness: 10,
          confidence: 8,
          relevance: 7,
        },
        sessionProgress: "1/10",
        timeRemaining: 1620,
      };

      commandBusMock.execute.mockResolvedValue(mockResult);

      // Act
      const response = await apiClient.post(
        `/api/v1/interviews/${sessionId}/answer`,
        {
          answerText:
            "In my previous role at TechCorp, we faced a critical production issue where our API was timing out. I was tasked with identifying and resolving the issue within 24 hours. I analyzed the logs, identified a database query bottleneck, optimized the indexes, and implemented caching. As a result, we reduced response time by 80% and prevented customer churn.",
          durationSeconds: 180,
          questionId: "question-uuid-1",
        },
      );

      // Assert
      const body = ResponseValidator.expectSuccess(response, 200);
      expect(body).toHaveProperty("scoring");
      expect(body.scoring).toHaveProperty("clarity");
      expect(body.scoring).toHaveProperty("completeness");
      expect(body.scoring).toHaveProperty("relevance");
      expect(body.scoring).toHaveProperty("confidence");
      expect(body).toHaveProperty("overall_score");
      expect(body).toHaveProperty("sessionProgress");
      expect(body).toHaveProperty("timeRemaining");
      expect(body).toHaveProperty("question");
      expect(body.question).toHaveProperty("id");
      expect(body.question).toHaveProperty("text");
      expect(body.question).toHaveProperty("category");
      expect(body.question).toHaveProperty("difficulty");
      ResponseValidator.expectContentType(response, "json");
    });

    it("should validate required questionId field", async () => {
      // Act
      const response = await apiClient.post(
        `/api/v1/interviews/${sessionId}/answer`,
        {
          answerText: "My answer",
          durationSeconds: 120,
        },
      );

      // Assert
      ResponseValidator.expectError(response, 400);
    });

    it("should validate required answerText field", async () => {
      // Act
      const response = await apiClient.post(
        `/api/v1/interviews/${sessionId}/answer`,
        {
          durationSeconds: 120,
          questionId: "question-uuid",
        },
      );

      // Assert
      ResponseValidator.expectError(response, 400);
    });

    it("should validate required durationSeconds field", async () => {
      // Act
      const response = await apiClient.post(
        `/api/v1/interviews/${sessionId}/answer`,
        {
          answerText: "My answer",
          questionId: "question-uuid",
        },
      );

      // Assert
      ResponseValidator.expectError(response, 400);
    });

    it("should validate answerText is not empty", async () => {
      // Act
      const response = await apiClient.post(
        `/api/v1/interviews/${sessionId}/answer`,
        {
          answerText: "",
          durationSeconds: 120,
          questionId: "question-uuid",
        },
      );

      // Assert
      ResponseValidator.expectError(response, 400);
    });

    it("should validate durationSeconds is a positive number", async () => {
      // Act
      const response = await apiClient.post(
        `/api/v1/interviews/${sessionId}/answer`,
        {
          answerText: "My answer",
          durationSeconds: -10,
          questionId: "question-uuid",
        },
      );

      // Assert
      ResponseValidator.expectError(response, 400);
    });

    it("should return feedback for low scores", async () => {
      // Arrange
      const mockResult = {
        feedback: "Consider using the STAR format.",
        overall_score: 35.5,
        question: {
          category: "Leadership",
          difficulty: 5,
          id: "next-question-uuid",
          text: "Next question text",
        },
        scoring: {
          clarity: 3,
          completeness: 4,
          confidence: 4,
          relevance: 3,
        },
        sessionProgress: "1/10",
        timeRemaining: 1680,
      };

      commandBusMock.execute.mockResolvedValue(mockResult);

      // Act
      const response = await apiClient.post(
        `/api/v1/interviews/${sessionId}/answer`,
        {
          answerText: "I did it.",
          durationSeconds: 30,
          questionId: "question-uuid",
        },
      );

      // Assert
      const body = ResponseValidator.expectSuccess(response, 200);
      expect(body.feedback).toBeDefined();
      expect(body.overall_score).toBeLessThan(50);
    });

    it("should not return feedback for good scores", async () => {
      // Arrange
      const mockResult = {
        feedback: undefined,
        overall_score: 75.5,
        question: {
          category: "Leadership",
          difficulty: 6,
          id: "next-question-uuid",
          text: "Next question text",
        },
        scoring: {
          clarity: 8,
          completeness: 8,
          confidence: 7,
          relevance: 7,
        },
        sessionProgress: "1/10",
        timeRemaining: 1680,
      };

      commandBusMock.execute.mockResolvedValue(mockResult);

      // Act
      const response = await apiClient.post(
        `/api/v1/interviews/${sessionId}/answer`,
        {
          answerText: "Detailed answer with proper structure and content.",
          durationSeconds: 120,
          questionId: "question-uuid",
        },
      );

      // Assert
      const body = ResponseValidator.expectSuccess(response, 200);
      expect(body.feedback).toBeUndefined();
      expect(body.overall_score).toBeGreaterThanOrEqual(50);
    });

    it("should handle session end (no next question)", async () => {
      // Arrange
      const mockResult = {
        feedback: undefined,
        overall_score: 85,
        question: undefined,
        scoring: {
          clarity: 9,
          completeness: 9,
          confidence: 8,
          relevance: 8,
        },
        sessionProgress: "10/10",
        timeRemaining: 0,
      };

      commandBusMock.execute.mockResolvedValue(mockResult);

      // Act
      const response = await apiClient.post(
        `/api/v1/interviews/${sessionId}/answer`,
        {
          answerText: "Final answer",
          durationSeconds: 120,
          questionId: "question-uuid",
        },
      );

      // Assert
      const body = ResponseValidator.expectSuccess(response, 200);
      expect(body.question).toBeUndefined();
      expect(body.sessionProgress).toBe("10/10");
      expect(body.timeRemaining).toBe(0);
    });

    it("should reject non-whitelisted fields", async () => {
      // Act
      const response = await apiClient.post(
        `/api/v1/interviews/${sessionId}/answer`,
        {
          answerText: "My answer",
          durationSeconds: 120,
          extraField: "should-be-removed",
          questionId: "question-uuid",
        },
      );

      // Assert
      ResponseValidator.expectError(response, 400);
    });

    it("should handle command bus errors with 500", async () => {
      // Arrange
      commandBusMock.execute.mockRejectedValue(new Error("Database error"));

      // Act
      const response = await apiClient.post(
        `/api/v1/interviews/${sessionId}/answer`,
        {
          answerText: "My answer",
          durationSeconds: 120,
          questionId: "question-uuid",
        },
      );

      // Assert
      ResponseValidator.expectError(response, 500);
    });

    it("should include all required response fields", async () => {
      // Arrange
      const mockResult = {
        feedback: undefined,
        overall_score: 83.75,
        question: {
          category: "Technical Skills",
          difficulty: 7,
          id: "question-uuid-2",
          text: "Explain your approach to system design.",
        },
        scoring: {
          clarity: 8.5,
          completeness: 10,
          confidence: 8,
          relevance: 7,
        },
        sessionProgress: "3/10",
        timeRemaining: 1440,
      };

      commandBusMock.execute.mockResolvedValue(mockResult);

      // Act
      const response = await apiClient.post(
        `/api/v1/interviews/${sessionId}/answer`,
        {
          answerText: "Comprehensive answer with details.",
          durationSeconds: 180,
          questionId: "question-uuid-1",
        },
      );

      // Assert
      const body = ResponseValidator.expectSuccess(response, 200);
      expect(body.scoring.clarity).toBe(8.5);
      expect(body.scoring.completeness).toBe(10);
      expect(body.scoring.relevance).toBe(7);
      expect(body.scoring.confidence).toBe(8);
      expect(body.overall_score).toBe(83.75);
      expect(body.question.id).toBe("question-uuid-2");
      expect(body.question.text).toBe(
        "Explain your approach to system design.",
      );
      expect(body.question.category).toBe("Technical Skills");
      expect(body.question.difficulty).toBe(7);
      expect(body.sessionProgress).toBe("3/10");
      expect(body.timeRemaining).toBe(1440);
    });

    it("should handle different session IDs in URL", async () => {
      // Arrange
      const differentSessionId = "different-session-uuid";
      const mockResult = {
        feedback: undefined,
        overall_score: 75,
        question: undefined,
        scoring: {
          clarity: 7,
          completeness: 8,
          confidence: 7,
          relevance: 7,
        },
        sessionProgress: "5/10",
        timeRemaining: 900,
      };

      commandBusMock.execute.mockResolvedValue(mockResult);

      // Act
      const response = await apiClient.post(
        `/api/v1/interviews/${differentSessionId}/answer`,
        {
          answerText: "Answer for different session",
          durationSeconds: 90,
          questionId: "question-uuid",
        },
      );

      // Assert
      const body = ResponseValidator.expectSuccess(response, 200);
      expect(body).toHaveProperty("scoring");
      expect(body).toHaveProperty("overall_score");
    });

    it("should validate answerText minimum length", async () => {
      // Act
      const response = await apiClient.post(
        `/api/v1/interviews/${sessionId}/answer`,
        {
          answerText: "",
          durationSeconds: 120,
          questionId: "question-uuid",
        },
      );

      // Assert
      ResponseValidator.expectError(response, 400);
    });

    it("should accept valid long answers", async () => {
      // Arrange
      const longAnswer =
        "This is a very detailed answer that provides comprehensive information. " +
        "It covers all aspects of the STAR format including situation, task, action, and result. " +
        "The situation was complex and required careful analysis. " +
        "My task was clearly defined and had specific objectives. " +
        "I took decisive action based on thorough evaluation. " +
        "The results exceeded expectations and delivered significant value.";

      const mockResult = {
        feedback: undefined,
        overall_score: 90,
        question: {
          category: "Communication",
          difficulty: 6,
          id: "next-question-uuid",
          text: "Next question",
        },
        scoring: {
          clarity: 9,
          completeness: 10,
          confidence: 9,
          relevance: 8,
        },
        sessionProgress: "2/10",
        timeRemaining: 1620,
      };

      commandBusMock.execute.mockResolvedValue(mockResult);

      // Act
      const response = await apiClient.post(
        `/api/v1/interviews/${sessionId}/answer`,
        {
          answerText: longAnswer,
          durationSeconds: 240,
          questionId: "question-uuid",
        },
      );

      // Assert
      const body = ResponseValidator.expectSuccess(response, 200);
      expect(body.overall_score).toBeGreaterThan(80);
    });
  });
});
