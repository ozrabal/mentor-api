import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";

import { InterviewSession } from "../../../domain/entities/interview-session.entity";
import {
  IInterviewSessionRepository,
  INTERVIEW_SESSION_REPOSITORY,
} from "../../../domain/repositories/interview-session.repository.interface";
import { CompleteInterviewCommand } from "../impl/complete-interview.command";
import { CompleteInterviewHandler } from "./complete-interview.handler";

type MockSession = Pick<
  InterviewSession,
  | "belongsToUser"
  | "complete"
  | "getClarityScores"
  | "getCompletenessScores"
  | "getConfidenceScores"
  | "getId"
  | "getOverallScores"
  | "getRelevanceScores"
  | "getSessionOverallScore"
  | "getStatus"
>;

describe("CompleteInterviewHandler", () => {
  let handler: CompleteInterviewHandler;
  let mockSessionRepository: jest.Mocked<IInterviewSessionRepository>;

  const mockSessionId = "123e4567-e89b-12d3-a456-426614174000";
  const mockUserId = "user-id-123";
  const mockOtherUserId = "other-user-id";

  const createMockSession = (
    overrides: Partial<MockSession> = {},
  ): MockSession => ({
    belongsToUser: jest.fn().mockReturnValue(true),
    complete: jest.fn(),
    getClarityScores: jest.fn().mockReturnValue([7, 7, 7]),
    getCompletenessScores: jest.fn().mockReturnValue([7, 7, 7]),
    getConfidenceScores: jest.fn().mockReturnValue([7, 7, 7]),
    getId: jest.fn().mockReturnValue({ getValue: () => mockSessionId }),
    getOverallScores: jest.fn().mockReturnValue([70, 70, 70]),
    getRelevanceScores: jest.fn().mockReturnValue([7, 7, 7]),
    getSessionOverallScore: jest.fn().mockReturnValue(70),
    getStatus: jest.fn().mockReturnValue("in_progress"),
    ...overrides,
  });

  beforeEach(async () => {
    mockSessionRepository = {
      findById: jest.fn(),
      save: jest.fn(),
    } as jest.Mocked<IInterviewSessionRepository>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CompleteInterviewHandler,
        {
          provide: INTERVIEW_SESSION_REPOSITORY,
          useValue: mockSessionRepository,
        },
      ],
    }).compile();

    handler = module.get<CompleteInterviewHandler>(CompleteInterviewHandler);
  });

  it("should be defined", () => {
    expect(handler).toBeDefined();
  });

  describe("execute", () => {
    it("should complete interview session successfully", async () => {
      // Arrange
      const mockSession = createMockSession({
        belongsToUser: jest.fn().mockReturnValue(true),
        complete: jest.fn(),
        getClarityScores: jest.fn().mockReturnValue([8, 9, 7]),
        getCompletenessScores: jest.fn().mockReturnValue([7, 8, 6]),
        getConfidenceScores: jest.fn().mockReturnValue([8, 8, 7]),
        getId: jest.fn().mockReturnValue({ getValue: () => mockSessionId }),
        getOverallScores: jest.fn().mockReturnValue([75, 80, 70]),
        getRelevanceScores: jest.fn().mockReturnValue([7, 7, 8]),
        getSessionOverallScore: jest.fn().mockReturnValue(75),
        getStatus: jest.fn().mockReturnValue("in_progress"),
      });

      mockSessionRepository.findById.mockResolvedValue(
        mockSession as unknown as InterviewSession,
      );
      mockSessionRepository.save.mockResolvedValue(undefined);

      const command = new CompleteInterviewCommand(
        mockSessionId,
        mockUserId,
        false,
      );

      // Act
      const result = await handler.execute(command);

      // Assert
      expect(mockSessionRepository.findById).toHaveBeenCalledWith(
        expect.objectContaining({ value: mockSessionId }),
      );
      expect(mockSession.belongsToUser).toHaveBeenCalledWith(mockUserId);
      expect(mockSession.complete).toHaveBeenCalledWith(75, false);
      expect(mockSessionRepository.save).toHaveBeenCalledWith(mockSession);
      expect(result.sessionId).toBe(mockSessionId);
      expect(result.session_overall_score).toBe(75);
      expect(result.success_probability).toBe(0.72);
      expect(result.competency_breakdown).toBeDefined();
      expect(result.top_gaps).toBeDefined();
      expect(result.strengths).toBeDefined();
      expect(result.report).toBeDefined();
      expect(result.report.id).toBeDefined();
      expect(result.report.created_at).toBeDefined();
    });

    it("should complete interview with endedEarly flag", async () => {
      // Arrange
      const mockSession = createMockSession({
        belongsToUser: jest.fn().mockReturnValue(true),
        complete: jest.fn(),
        getClarityScores: jest.fn().mockReturnValue([8]),
        getCompletenessScores: jest.fn().mockReturnValue([7]),
        getConfidenceScores: jest.fn().mockReturnValue([8]),
        getId: jest.fn().mockReturnValue({ getValue: () => mockSessionId }),
        getOverallScores: jest.fn().mockReturnValue([80]),
        getRelevanceScores: jest.fn().mockReturnValue([7]),
        getSessionOverallScore: jest.fn().mockReturnValue(80),
        getStatus: jest.fn().mockReturnValue("in_progress"),
      });

      mockSessionRepository.findById.mockResolvedValue(
        mockSession as unknown as InterviewSession,
      );

      const command = new CompleteInterviewCommand(
        mockSessionId,
        mockUserId,
        true,
      );

      // Act
      await handler.execute(command);

      // Assert
      expect(mockSession.complete).toHaveBeenCalledWith(80, true);
    });

    it("should throw NotFoundException when session does not exist", async () => {
      // Arrange
      mockSessionRepository.findById.mockResolvedValue(null);
      const command = new CompleteInterviewCommand(
        mockSessionId,
        mockUserId,
        false,
      );

      // Act & Assert
      await expect(handler.execute(command)).rejects.toThrow(NotFoundException);
      await expect(handler.execute(command)).rejects.toThrow(
        `Interview session with ID ${mockSessionId} not found`,
      );
      expect(mockSessionRepository.findById).toHaveBeenCalled();
      expect(mockSessionRepository.save).not.toHaveBeenCalled();
    });

    it("should throw ForbiddenException when user does not own session", async () => {
      // Arrange
      const mockSession = createMockSession({
        belongsToUser: jest.fn().mockReturnValue(false),
        getStatus: jest.fn().mockReturnValue("in_progress"),
      });

      mockSessionRepository.findById.mockResolvedValue(
        mockSession as unknown as InterviewSession,
      );
      const command = new CompleteInterviewCommand(
        mockSessionId,
        mockOtherUserId,
        false,
      );

      // Act & Assert
      await expect(handler.execute(command)).rejects.toThrow(
        ForbiddenException,
      );
      await expect(handler.execute(command)).rejects.toThrow(
        "You do not have permission to complete this interview session",
      );
      expect(mockSessionRepository.save).not.toHaveBeenCalled();
    });

    it("should throw BadRequestException when session is not in progress", async () => {
      // Arrange
      const mockSession = createMockSession({
        belongsToUser: jest.fn().mockReturnValue(true),
        getStatus: jest.fn().mockReturnValue("completed"),
      });

      mockSessionRepository.findById.mockResolvedValue(
        mockSession as unknown as InterviewSession,
      );
      const command = new CompleteInterviewCommand(
        mockSessionId,
        mockUserId,
        false,
      );

      // Act & Assert
      await expect(handler.execute(command)).rejects.toThrow(
        BadRequestException,
      );
      await expect(handler.execute(command)).rejects.toThrow(
        "Cannot complete interview session with status: completed",
      );
      expect(mockSessionRepository.save).not.toHaveBeenCalled();
    });

    it("should throw BadRequestException when session status is cancelled", async () => {
      // Arrange
      const mockSession = createMockSession({
        belongsToUser: jest.fn().mockReturnValue(true),
        getStatus: jest.fn().mockReturnValue("cancelled"),
      });

      mockSessionRepository.findById.mockResolvedValue(
        mockSession as unknown as InterviewSession,
      );
      const command = new CompleteInterviewCommand(
        mockSessionId,
        mockUserId,
        false,
      );

      // Act & Assert
      await expect(handler.execute(command)).rejects.toThrow(
        BadRequestException,
      );
      await expect(handler.execute(command)).rejects.toThrow(
        "Cannot complete interview session with status: cancelled",
      );
    });

    it("should calculate correct success probability for high scores (>= 80)", async () => {
      // Arrange
      const mockSession = createMockSession({
        getClarityScores: jest.fn().mockReturnValue([9, 9, 8]),
        getCompletenessScores: jest.fn().mockReturnValue([9, 8, 9]),
        getConfidenceScores: jest.fn().mockReturnValue([8, 9, 8]),
        getOverallScores: jest.fn().mockReturnValue([85, 90, 80]),
        getRelevanceScores: jest.fn().mockReturnValue([8, 9, 8]),
        getSessionOverallScore: jest.fn().mockReturnValue(85),
      });

      mockSessionRepository.findById.mockResolvedValue(
        mockSession as unknown as InterviewSession,
      );
      const command = new CompleteInterviewCommand(
        mockSessionId,
        mockUserId,
        false,
      );

      // Act
      const result = await handler.execute(command);

      // Assert
      expect(result.success_probability).toBe(0.85);
    });

    it("should calculate correct success probability for good scores (70-79)", async () => {
      // Arrange
      const mockSession = createMockSession({
        belongsToUser: jest.fn().mockReturnValue(true),
        complete: jest.fn(),
        getClarityScores: jest.fn().mockReturnValue([7, 8, 7]),
        getCompletenessScores: jest.fn().mockReturnValue([7, 8, 7]),
        getConfidenceScores: jest.fn().mockReturnValue([7, 7, 8]),
        getOverallScores: jest.fn().mockReturnValue([75, 70, 72]),
        getRelevanceScores: jest.fn().mockReturnValue([7, 7, 7]),
        getSessionOverallScore: jest.fn().mockReturnValue(72),
        getStatus: jest.fn().mockReturnValue("in_progress"),
      });

      mockSessionRepository.findById.mockResolvedValue(
        mockSession as unknown as InterviewSession,
      );
      const command = new CompleteInterviewCommand(
        mockSessionId,
        mockUserId,
        false,
      );

      // Act
      const result = await handler.execute(command);

      // Assert
      expect(result.success_probability).toBe(0.72);
    });

    it("should calculate correct success probability for average scores (60-69)", async () => {
      // Arrange
      const mockSession = createMockSession({
        belongsToUser: jest.fn().mockReturnValue(true),
        complete: jest.fn(),
        getClarityScores: jest.fn().mockReturnValue([6, 7, 6]),
        getCompletenessScores: jest.fn().mockReturnValue([6, 6, 7]),
        getConfidenceScores: jest.fn().mockReturnValue([6, 6, 6]),
        getOverallScores: jest.fn().mockReturnValue([65, 60, 62]),
        getRelevanceScores: jest.fn().mockReturnValue([6, 6, 7]),
        getSessionOverallScore: jest.fn().mockReturnValue(62),
        getStatus: jest.fn().mockReturnValue("in_progress"),
      });

      mockSessionRepository.findById.mockResolvedValue(
        mockSession as unknown as InterviewSession,
      );
      const command = new CompleteInterviewCommand(
        mockSessionId,
        mockUserId,
        false,
      );

      // Act
      const result = await handler.execute(command);

      // Assert
      expect(result.success_probability).toBe(0.55);
    });

    it("should calculate correct success probability for below average scores (50-59)", async () => {
      // Arrange
      const mockSession = createMockSession({
        belongsToUser: jest.fn().mockReturnValue(true),
        complete: jest.fn(),
        getClarityScores: jest.fn().mockReturnValue([5, 5, 6]),
        getCompletenessScores: jest.fn().mockReturnValue([5, 6, 5]),
        getConfidenceScores: jest.fn().mockReturnValue([5, 5, 5]),
        getOverallScores: jest.fn().mockReturnValue([55, 50, 52]),
        getRelevanceScores: jest.fn().mockReturnValue([5, 5, 6]),
        getSessionOverallScore: jest.fn().mockReturnValue(52),
        getStatus: jest.fn().mockReturnValue("in_progress"),
      });

      mockSessionRepository.findById.mockResolvedValue(
        mockSession as unknown as InterviewSession,
      );
      const command = new CompleteInterviewCommand(
        mockSessionId,
        mockUserId,
        false,
      );

      // Act
      const result = await handler.execute(command);

      // Assert
      expect(result.success_probability).toBe(0.4);
    });

    it("should calculate correct success probability for low scores (< 50)", async () => {
      // Arrange
      const mockSession = createMockSession({
        belongsToUser: jest.fn().mockReturnValue(true),
        complete: jest.fn(),
        getClarityScores: jest.fn().mockReturnValue([4, 4, 5]),
        getCompletenessScores: jest.fn().mockReturnValue([4, 5, 4]),
        getConfidenceScores: jest.fn().mockReturnValue([4, 4, 4]),
        getOverallScores: jest.fn().mockReturnValue([45, 40, 42]),
        getRelevanceScores: jest.fn().mockReturnValue([4, 4, 5]),
        getSessionOverallScore: jest.fn().mockReturnValue(42),
        getStatus: jest.fn().mockReturnValue("in_progress"),
      });

      mockSessionRepository.findById.mockResolvedValue(
        mockSession as unknown as InterviewSession,
      );
      const command = new CompleteInterviewCommand(
        mockSessionId,
        mockUserId,
        false,
      );

      // Act
      const result = await handler.execute(command);

      // Assert
      expect(result.success_probability).toBe(0.25);
    });

    it("should handle session with no scores", async () => {
      // Arrange
      const mockSession = createMockSession({
        belongsToUser: jest.fn().mockReturnValue(true),
        complete: jest.fn(),
        getClarityScores: jest.fn().mockReturnValue([]),
        getCompletenessScores: jest.fn().mockReturnValue([]),
        getConfidenceScores: jest.fn().mockReturnValue([]),
        getOverallScores: jest.fn().mockReturnValue([]),
        getRelevanceScores: jest.fn().mockReturnValue([]),
        getSessionOverallScore: jest.fn().mockReturnValue(0),
        getStatus: jest.fn().mockReturnValue("in_progress"),
      });

      mockSessionRepository.findById.mockResolvedValue(
        mockSession as unknown as InterviewSession,
      );
      const command = new CompleteInterviewCommand(
        mockSessionId,
        mockUserId,
        false,
      );

      // Act
      const result = await handler.execute(command);

      // Assert
      expect(mockSession.complete).toHaveBeenCalledWith(0, false);
      expect(result.session_overall_score).toBe(0);
      expect(result.success_probability).toBe(0.25);
    });

    it("should identify top gaps for low clarity scores", async () => {
      // Arrange
      const mockSession = createMockSession({
        belongsToUser: jest.fn().mockReturnValue(true),
        complete: jest.fn(),
        getClarityScores: jest.fn().mockReturnValue([4, 5, 4]),
        getCompletenessScores: jest.fn().mockReturnValue([7, 8, 7]),
        getConfidenceScores: jest.fn().mockReturnValue([7, 7, 8]),
        getOverallScores: jest.fn().mockReturnValue([60, 65, 62]),
        getRelevanceScores: jest.fn().mockReturnValue([7, 7, 7]),
        getSessionOverallScore: jest.fn().mockReturnValue(62),
        getStatus: jest.fn().mockReturnValue("in_progress"),
      });

      mockSessionRepository.findById.mockResolvedValue(
        mockSession as unknown as InterviewSession,
      );
      const command = new CompleteInterviewCommand(
        mockSessionId,
        mockUserId,
        false,
      );

      // Act
      const result = await handler.execute(command);

      // Assert
      expect(result.top_gaps).toContainEqual(
        expect.objectContaining({
          gap: "Answer clarity and structure",
          priority: "HIGH",
        }),
      );
    });

    it("should identify strengths for high clarity scores", async () => {
      // Arrange
      const mockSession = createMockSession({
        belongsToUser: jest.fn().mockReturnValue(true),
        complete: jest.fn(),
        getClarityScores: jest.fn().mockReturnValue([9, 9, 8]),
        getCompletenessScores: jest.fn().mockReturnValue([7, 7, 7]),
        getConfidenceScores: jest.fn().mockReturnValue([7, 7, 7]),
        getOverallScores: jest.fn().mockReturnValue([80, 80, 75]),
        getRelevanceScores: jest.fn().mockReturnValue([7, 7, 7]),
        getSessionOverallScore: jest.fn().mockReturnValue(78),
        getStatus: jest.fn().mockReturnValue("in_progress"),
      });

      mockSessionRepository.findById.mockResolvedValue(
        mockSession as unknown as InterviewSession,
      );
      const command = new CompleteInterviewCommand(
        mockSessionId,
        mockUserId,
        false,
      );

      // Act
      const result = await handler.execute(command);

      // Assert
      expect(result.strengths).toContain(
        "Excellent clarity and structure in answers",
      );
    });

    it("should limit top gaps to maximum of 3", async () => {
      // Arrange
      const mockSession = createMockSession({
        belongsToUser: jest.fn().mockReturnValue(true),
        complete: jest.fn(),
        getClarityScores: jest.fn().mockReturnValue([4, 4, 4]),
        getCompletenessScores: jest.fn().mockReturnValue([4, 4, 4]),
        getConfidenceScores: jest.fn().mockReturnValue([4, 4, 4]),
        getOverallScores: jest.fn().mockReturnValue([40, 40, 40]),
        getRelevanceScores: jest.fn().mockReturnValue([4, 4, 4]),
        getSessionOverallScore: jest.fn().mockReturnValue(40),
        getStatus: jest.fn().mockReturnValue("in_progress"),
      });

      mockSessionRepository.findById.mockResolvedValue(
        mockSession as unknown as InterviewSession,
      );
      const command = new CompleteInterviewCommand(
        mockSessionId,
        mockUserId,
        false,
      );

      // Act
      const result = await handler.execute(command);

      // Assert
      expect(result.top_gaps.length).toBeLessThanOrEqual(3);
    });
  });
});
