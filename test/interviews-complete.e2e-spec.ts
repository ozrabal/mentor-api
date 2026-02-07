/**
 * Complete Interview E2E Tests
 *
 * End-to-end tests for the complete interview endpoint.
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

describe("Complete Interview (e2e)", () => {
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

  describe("POST /api/v1/interviews/:sessionId/complete", () => {
    const sessionId = "123e4567-e89b-12d3-a456-426614174000";

    it("should complete interview session successfully", async () => {
      // Arrange
      const mockResult = {
        competency_breakdown: {
          "Overall Performance": {
            comment: "Strong performance with minor areas for improvement",
            gap: -5,
            score: 75,
          },
          Communication: {
            comment: "Clear explanations with room for improvement",
            gap: 0,
            score: 70,
          },
        },
        report: {
          created_at: "2026-02-06T10:30:00.000Z",
          id: "report-uuid-123",
        },
        sessionId,
        session_overall_score: 75.5,
        strengths: [
          "Strong problem-solving approach",
          "Clear communication",
          "Good understanding of core concepts",
        ],
        success_probability: 0.72,
        top_gaps: [
          {
            action: "Review distributed systems patterns",
            gap: "Technical depth in system design",
            priority: "HIGH",
          },
          {
            action: "Practice STAR method with concrete examples",
            gap: "Behavioral examples lacking specificity",
            priority: "MEDIUM",
          },
        ],
      };

      commandBusMock.execute.mockResolvedValue(mockResult);

      // Act
      const response = await apiClient.post(
        `/api/v1/interviews/${sessionId}/complete`,
        {
          endedEarly: false,
        },
      );

      // Assert
      const body = ResponseValidator.expectSuccess(response, 200);
      expect(body).toHaveProperty("sessionId");
      expect(body).toHaveProperty("session_overall_score");
      expect(body).toHaveProperty("success_probability");
      expect(body).toHaveProperty("competency_breakdown");
      expect(body).toHaveProperty("top_gaps");
      expect(body).toHaveProperty("strengths");
      expect(body).toHaveProperty("report");
      expect(body.sessionId).toBe(sessionId);
      expect(body.session_overall_score).toBe(75.5);
      expect(body.success_probability).toBe(0.72);
      expect(body.competency_breakdown).toBeDefined();
      expect(body.top_gaps).toBeInstanceOf(Array);
      expect(body.strengths).toBeInstanceOf(Array);
      expect(body.report).toHaveProperty("id");
      expect(body.report).toHaveProperty("created_at");
      ResponseValidator.expectContentType(response, "json");
    });

    it("should complete interview with endedEarly flag", async () => {
      // Arrange
      const mockResult = {
        competency_breakdown: {
          "Overall Performance": {
            comment: "Adequate performance but needs improvement",
            gap: 20,
            score: 50,
          },
        },
        report: {
          created_at: "2026-02-06T10:30:00.000Z",
          id: "report-uuid-456",
        },
        sessionId,
        session_overall_score: 50,
        strengths: ["Good effort and engagement"],
        success_probability: 0.4,
        top_gaps: [
          {
            action: "Practice STAR method and structured responses",
            gap: "Answer clarity and structure",
            priority: "HIGH",
          },
          {
            action: "Ensure all parts of the question are addressed",
            gap: "Completeness of answers",
            priority: "HIGH",
          },
        ],
      };

      commandBusMock.execute.mockResolvedValue(mockResult);

      // Act
      const response = await apiClient.post(
        `/api/v1/interviews/${sessionId}/complete`,
        {
          endedEarly: true,
        },
      );

      // Assert
      const body = ResponseValidator.expectSuccess(response, 200);
      expect(body.sessionId).toBe(sessionId);
      expect(body.session_overall_score).toBe(50);
      expect(commandBusMock.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          endedEarly: true,
        }),
      );
    });

    it("should complete interview without endedEarly field", async () => {
      // Arrange
      const mockResult = {
        competency_breakdown: {},
        report: {
          created_at: "2026-02-06T10:30:00.000Z",
          id: "report-uuid-789",
        },
        sessionId,
        session_overall_score: 85,
        strengths: ["Excellent performance demonstrated"],
        success_probability: 0.85,
        top_gaps: [],
      };

      commandBusMock.execute.mockResolvedValue(mockResult);

      // Act
      const response = await apiClient.post(
        `/api/v1/interviews/${sessionId}/complete`,
        {},
      );

      // Assert
      const body = ResponseValidator.expectSuccess(response, 200);
      expect(body.sessionId).toBe(sessionId);
      expect(body.success_probability).toBe(0.85);
    });

    it("should validate endedEarly is boolean", async () => {
      // Act
      const response = await apiClient.post(
        `/api/v1/interviews/${sessionId}/complete`,
        {
          endedEarly: "invalid",
        },
      );

      // Assert
      ResponseValidator.expectError(response, 400);
    });

    it("should reject non-whitelisted fields", async () => {
      // Act
      const response = await apiClient.post(
        `/api/v1/interviews/${sessionId}/complete`,
        {
          endedEarly: false,
          extraField: "should-be-rejected",
        },
      );

      // Assert
      ResponseValidator.expectError(response, 400);
    });

    it("should return complete competency breakdown structure", async () => {
      // Arrange
      const mockResult = {
        competency_breakdown: {
          "Problem Solving": {
            comment: "Strong analytical approach demonstrated",
            gap: -10,
            score: 80,
          },
          Communication: {
            comment: "Clear explanations with room for improvement",
            gap: 0,
            score: 70,
          },
          Leadership: {
            comment: "Good team collaboration skills",
            gap: 5,
            score: 65,
          },
        },
        report: {
          created_at: "2026-02-06T11:00:00.000Z",
          id: "report-uuid-abc",
        },
        sessionId,
        session_overall_score: 71.67,
        strengths: ["Strong problem-solving approach", "Clear communication"],
        success_probability: 0.72,
        top_gaps: [
          {
            action: "Practice leadership scenarios",
            gap: "Leadership experience",
            priority: "MEDIUM",
          },
        ],
      };

      commandBusMock.execute.mockResolvedValue(mockResult);

      // Act
      const response = await apiClient.post(
        `/api/v1/interviews/${sessionId}/complete`,
        { endedEarly: false },
      );

      // Assert
      const body = ResponseValidator.expectSuccess(response, 200);
      expect(body.competency_breakdown["Problem Solving"]).toEqual({
        comment: "Strong analytical approach demonstrated",
        gap: -10,
        score: 80,
      });
      expect(body.competency_breakdown.Communication).toEqual({
        comment: "Clear explanations with room for improvement",
        gap: 0,
        score: 70,
      });
      expect(body.competency_breakdown.Leadership).toEqual({
        comment: "Good team collaboration skills",
        gap: 5,
        score: 65,
      });
    });

    it("should return top gaps with priority levels", async () => {
      // Arrange
      const mockResult = {
        competency_breakdown: {},
        report: {
          created_at: "2026-02-06T11:00:00.000Z",
          id: "report-uuid-def",
        },
        sessionId,
        session_overall_score: 60,
        strengths: ["Solid overall performance"],
        success_probability: 0.55,
        top_gaps: [
          {
            action: "Review distributed systems patterns",
            gap: "Technical depth in system design",
            priority: "HIGH",
          },
          {
            action: "Practice STAR method with concrete examples",
            gap: "Behavioral examples lacking specificity",
            priority: "MEDIUM",
          },
          {
            action: "Reduce filler words",
            gap: "Communication confidence",
            priority: "LOW",
          },
        ],
      };

      commandBusMock.execute.mockResolvedValue(mockResult);

      // Act
      const response = await apiClient.post(
        `/api/v1/interviews/${sessionId}/complete`,
        {},
      );

      // Assert
      const body = ResponseValidator.expectSuccess(response, 200);
      expect(body.top_gaps).toHaveLength(3);
      expect(body.top_gaps[0].priority).toBe("HIGH");
      expect(body.top_gaps[1].priority).toBe("MEDIUM");
      expect(body.top_gaps[2].priority).toBe("LOW");
      expect(body.top_gaps[0]).toHaveProperty("gap");
      expect(body.top_gaps[0]).toHaveProperty("action");
    });

    it("should return success probability within valid range", async () => {
      // Arrange
      const testCases = [
        { score: 85, expectedProbability: 0.85 },
        { score: 75, expectedProbability: 0.72 },
        { score: 65, expectedProbability: 0.55 },
        { score: 55, expectedProbability: 0.4 },
        { score: 45, expectedProbability: 0.25 },
      ];

      for (const testCase of testCases) {
        const mockResult = {
          competency_breakdown: {},
          report: {
            created_at: "2026-02-06T11:00:00.000Z",
            id: "report-uuid",
          },
          sessionId,
          session_overall_score: testCase.score,
          strengths: ["Some strength"],
          success_probability: testCase.expectedProbability,
          top_gaps: [],
        };

        commandBusMock.execute.mockResolvedValue(mockResult);

        // Act
        const response = await apiClient.post(
          `/api/v1/interviews/${sessionId}/complete`,
          {},
        );

        // Assert
        const body = ResponseValidator.expectSuccess(response, 200);
        expect(body.success_probability).toBe(testCase.expectedProbability);
        expect(body.success_probability).toBeGreaterThanOrEqual(0);
        expect(body.success_probability).toBeLessThanOrEqual(1);
      }
    });

    it("should handle different session IDs in URL", async () => {
      // Arrange
      const differentSessionId = "different-session-uuid-123";
      const mockResult = {
        competency_breakdown: {},
        report: {
          created_at: "2026-02-06T11:00:00.000Z",
          id: "report-uuid-ghi",
        },
        sessionId: differentSessionId,
        session_overall_score: 70,
        strengths: ["Good performance"],
        success_probability: 0.72,
        top_gaps: [],
      };

      commandBusMock.execute.mockResolvedValue(mockResult);

      // Act
      const response = await apiClient.post(
        `/api/v1/interviews/${differentSessionId}/complete`,
        {},
      );

      // Assert
      const body = ResponseValidator.expectSuccess(response, 200);
      expect(body.sessionId).toBe(differentSessionId);
    });

    it("should handle command bus errors with 500", async () => {
      // Arrange
      commandBusMock.execute.mockRejectedValue(new Error("Database error"));

      // Act
      const response = await apiClient.post(
        `/api/v1/interviews/${sessionId}/complete`,
        { endedEarly: false },
      );

      // Assert
      ResponseValidator.expectError(response, 500);
    });

    it("should include all required response fields", async () => {
      // Arrange
      const mockResult = {
        competency_breakdown: {
          "Technical Skills": {
            comment: "Strong technical foundation",
            gap: -5,
            score: 75,
          },
        },
        report: {
          created_at: "2026-02-06T12:00:00.000Z",
          id: "report-uuid-jkl",
        },
        sessionId,
        session_overall_score: 75,
        strengths: [
          "Strong technical skills",
          "Good problem-solving",
          "Effective communication",
        ],
        success_probability: 0.72,
        top_gaps: [
          {
            action: "Practice system design interviews",
            gap: "System design complexity",
            priority: "MEDIUM",
          },
        ],
      };

      commandBusMock.execute.mockResolvedValue(mockResult);

      // Act
      const response = await apiClient.post(
        `/api/v1/interviews/${sessionId}/complete`,
        {},
      );

      // Assert
      const body = ResponseValidator.expectSuccess(response, 200);
      expect(body.sessionId).toBe(sessionId);
      expect(body.session_overall_score).toBe(75);
      expect(body.success_probability).toBe(0.72);
      expect(body.competency_breakdown["Technical Skills"].score).toBe(75);
      expect(body.competency_breakdown["Technical Skills"].gap).toBe(-5);
      expect(body.competency_breakdown["Technical Skills"].comment).toBe(
        "Strong technical foundation",
      );
      expect(body.top_gaps).toHaveLength(1);
      expect(body.top_gaps[0].gap).toBe("System design complexity");
      expect(body.top_gaps[0].priority).toBe("MEDIUM");
      expect(body.top_gaps[0].action).toBe("Practice system design interviews");
      expect(body.strengths).toHaveLength(3);
      expect(body.report.id).toBe("report-uuid-jkl");
      expect(body.report.created_at).toBe("2026-02-06T12:00:00.000Z");
    });

    it("should handle empty arrays in response", async () => {
      // Arrange
      const mockResult = {
        competency_breakdown: {},
        report: {
          created_at: "2026-02-06T12:00:00.000Z",
          id: "report-uuid-mno",
        },
        sessionId,
        session_overall_score: 0,
        strengths: [],
        success_probability: 0.25,
        top_gaps: [],
      };

      commandBusMock.execute.mockResolvedValue(mockResult);

      // Act
      const response = await apiClient.post(
        `/api/v1/interviews/${sessionId}/complete`,
        {},
      );

      // Assert
      const body = ResponseValidator.expectSuccess(response, 200);
      expect(body.top_gaps).toEqual([]);
      expect(body.strengths).toEqual([]);
      expect(body.competency_breakdown).toEqual({});
    });
  });
});
