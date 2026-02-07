import { CommandBus } from "@nestjs/cqrs";
import { Test, TestingModule } from "@nestjs/testing";

import { CompleteInterviewRequestDto } from "../dto/complete-interview-request.dto";
import { StartInterviewRequestDto } from "../dto/start-interview-request.dto";
import { InterviewsController } from "./interviews.controller";

describe("InterviewsController", () => {
  let controller: InterviewsController;
  let commandBus: CommandBus;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [InterviewsController],
      providers: [
        {
          provide: CommandBus,
          useValue: {
            execute: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<InterviewsController>(InterviewsController);
    commandBus = module.get<CommandBus>(CommandBus);
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });

  it("should start interview and return session", async () => {
    // Arrange
    const dto: StartInterviewRequestDto = {
      interviewType: "mixed",
      jobProfileId: "job-profile-id",
    };

    const user = { id: "user-id" };

    const mockResult = {
      question: {
        category: "leadership",
        difficulty: 7,
        id: "question-id",
        text: "Question text",
      },
      sessionId: "session-id",
      sessionToken: "session_session-id",
    };

    jest.spyOn(commandBus, "execute").mockResolvedValue(mockResult);

    // Act
    const result = await controller.startInterview(dto, user);

    // Assert
    expect(result).toEqual({
      question: {
        category: "leadership",
        difficulty: 7,
        id: "question-id",
        text: "Question text",
      },
      sessionId: "session-id",
      sessionToken: "session_session-id",
    });
    expect(commandBus.execute).toHaveBeenCalledTimes(1);
  });

  describe("completeInterview", () => {
    it("should complete interview session successfully", async () => {
      // Arrange
      const sessionId = "123e4567-e89b-12d3-a456-426614174000";
      const userId = "user-id-123";
      const dto: CompleteInterviewRequestDto = { endedEarly: false };

      const mockResult = {
        competency_breakdown: {
          "Overall Performance": {
            comment: "Strong performance with minor areas for improvement",
            gap: -5,
            score: 75,
          },
        },
        report: {
          created_at: "2026-02-06T10:30:00.000Z",
          id: "report-id-123",
        },
        sessionId,
        session_overall_score: 75.5,
        strengths: [
          "Excellent clarity and structure in answers",
          "Comprehensive and thorough responses",
        ],
        success_probability: 0.72,
        top_gaps: [
          {
            action: "Practice STAR method and structured responses",
            gap: "Answer clarity and structure",
            priority: "MEDIUM",
          },
        ],
      };

      jest.spyOn(commandBus, "execute").mockResolvedValue(mockResult);

      // Act
      const result = await controller.completeInterview(sessionId, dto, {
        id: userId,
      });

      // Assert
      expect(result.sessionId).toBe(sessionId);
      expect(result.session_overall_score).toBe(75.5);
      expect(result.success_probability).toBe(0.72);
      expect(result.competency_breakdown).toBeDefined();
      expect(result.top_gaps).toBeDefined();
      expect(result.strengths).toBeDefined();
      expect(result.report).toBeDefined();
      expect(commandBus.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          endedEarly: false,
          sessionId,
          userId,
        }),
      );
    });

    it("should complete interview with endedEarly flag", async () => {
      // Arrange
      const sessionId = "session-id-456";
      const userId = "user-id-456";
      const dto: CompleteInterviewRequestDto = { endedEarly: true };

      const mockResult = {
        competency_breakdown: {},
        report: {
          created_at: "2026-02-06T10:30:00.000Z",
          id: "report-id-456",
        },
        sessionId,
        session_overall_score: 50,
        strengths: ["Solid overall performance"],
        success_probability: 0.4,
        top_gaps: [],
      };

      jest.spyOn(commandBus, "execute").mockResolvedValue(mockResult);

      // Act
      const result = await controller.completeInterview(sessionId, dto, {
        id: userId,
      });

      // Assert
      expect(result.sessionId).toBe(sessionId);
      expect(commandBus.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          endedEarly: true,
          sessionId,
          userId,
        }),
      );
    });

    it("should complete interview without endedEarly flag", async () => {
      // Arrange
      const sessionId = "session-id-789";
      const userId = "user-id-789";
      const dto: CompleteInterviewRequestDto = {};

      const mockResult = {
        competency_breakdown: {},
        report: {
          created_at: "2026-02-06T10:30:00.000Z",
          id: "report-id-789",
        },
        sessionId,
        session_overall_score: 85,
        strengths: ["Excellent performance"],
        success_probability: 0.85,
        top_gaps: [],
      };

      jest.spyOn(commandBus, "execute").mockResolvedValue(mockResult);

      // Act
      const result = await controller.completeInterview(sessionId, dto, {
        id: userId,
      });

      // Assert
      expect(result.sessionId).toBe(sessionId);
      expect(commandBus.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          endedEarly: undefined,
          sessionId,
          userId,
        }),
      );
    });
  });
});
