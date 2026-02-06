import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";

import { JOB_PROFILES_ACL } from "@modules/job-profiles/public";

import { AnswerScores } from "../../../domain/value-objects/answer-scores";
import { InterviewType } from "../../../domain/value-objects/interview-type.vo";
import { SessionId } from "../../../domain/value-objects/session-id.vo";
import {
  IInterviewSessionRepository,
  INTERVIEW_SESSION_REPOSITORY,
} from "../../../domain/repositories/interview-session.repository.interface";
import { AdaptiveQuestionSelectorService } from "../../services/adaptive-question-selector.service";
import { FeedbackGeneratorService } from "../../services/feedback-generator.service";
import { ScoringService } from "../../services/scoring.service";
import { SubmitAnswerCommand } from "../impl/submit-answer.command";
import { SubmitAnswerHandler } from "./submit-answer.handler";

describe("SubmitAnswerHandler", () => {
  let handler: SubmitAnswerHandler;
  let mockSessionRepository: jest.Mocked<IInterviewSessionRepository>;
  let mockJobProfilesACL: any;
  let mockScoringService: jest.Mocked<ScoringService>;
  let mockQuestionSelector: jest.Mocked<AdaptiveQuestionSelectorService>;
  let mockFeedbackGenerator: jest.Mocked<FeedbackGeneratorService>;

  beforeEach(async () => {
    mockSessionRepository = {
      findById: jest.fn(),
      save: jest.fn(),
    };

    mockJobProfilesACL = {
      getJobProfileInfo: jest.fn(),
    };

    mockScoringService = {
      scoreAnswer: jest.fn(),
    } as any;

    mockQuestionSelector = {
      selectNextQuestion: jest.fn(),
    } as any;

    mockFeedbackGenerator = {
      generateFeedback: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SubmitAnswerHandler,
        {
          provide: INTERVIEW_SESSION_REPOSITORY,
          useValue: mockSessionRepository,
        },
        {
          provide: JOB_PROFILES_ACL,
          useValue: mockJobProfilesACL,
        },
        {
          provide: ScoringService,
          useValue: mockScoringService,
        },
        {
          provide: AdaptiveQuestionSelectorService,
          useValue: mockQuestionSelector,
        },
        {
          provide: FeedbackGeneratorService,
          useValue: mockFeedbackGenerator,
        },
      ],
    }).compile();

    handler = module.get<SubmitAnswerHandler>(SubmitAnswerHandler);
  });

  it("should be defined", () => {
    expect(handler).toBeDefined();
  });

  describe("execute", () => {
    const command = new SubmitAnswerCommand(
      "session-id",
      "question-id",
      "My detailed answer using STAR format with situation, task, action, and result.",
      120,
      "user-id",
    );

    it("should submit answer successfully and return scores with next question", async () => {
      // Arrange
      const mockSession = {
        addQuestion: jest.fn(),
        belongsToUser: jest.fn().mockReturnValue(true),
        getCurrentQuestion: jest
          .fn()
          .mockReturnValue({ category: "Leadership", id: "question-id" }),
        getInterviewType: jest
          .fn()
          .mockReturnValue({ getValue: () => "behavioral" }),
        getJobProfileId: jest.fn().mockReturnValue("job-profile-id"),
        getProgress: jest.fn().mockReturnValue("1/10"),
        getTimeRemaining: jest.fn().mockReturnValue(1680),
        isInProgress: jest.fn().mockReturnValue(true),
        submitAnswer: jest.fn(),
      };

      const mockJobProfile = {
        competencies: [
          { depth: 3, name: "Leadership", weight: 0.8 },
          { depth: 2, name: "Communication", weight: 0.6 },
        ],
        id: "job-profile-id",
        interviewDifficultyLevel: 7,
        jobTitle: "Senior Software Engineer",
        userId: "user-id",
      };

      const mockScores = AnswerScores.create(8, 9, 7, 8);
      const mockQuestion = {
        category: "Teamwork",
        difficulty: 5,
        id: "next-q-id",
        text: "Tell me about a time when you worked with a difficult team member.",
      };

      mockSessionRepository.findById.mockResolvedValue(mockSession as any);
      mockJobProfilesACL.getJobProfileInfo.mockResolvedValue(mockJobProfile);
      mockScoringService.scoreAnswer.mockReturnValue(mockScores);
      mockQuestionSelector.selectNextQuestion.mockResolvedValue(mockQuestion);
      mockFeedbackGenerator.generateFeedback.mockReturnValue(null);

      // Act
      const result = await handler.execute(command);

      // Assert
      expect(result.scoring.clarity).toBe(8);
      expect(result.scoring.completeness).toBe(9);
      expect(result.scoring.relevance).toBe(7);
      expect(result.scoring.confidence).toBe(8);
      expect(result.overall_score).toBeGreaterThan(70);
      expect(result.question).toEqual(mockQuestion);
      expect(result.feedback).toBeUndefined();
      expect(result.sessionProgress).toBe("1/10");
      expect(result.timeRemaining).toBe(1680);
      expect(mockSession.submitAnswer).toHaveBeenCalledWith(
        "question-id",
        command.answerText,
        120,
        mockScores,
      );
      expect(mockSession.addQuestion).toHaveBeenCalledWith(mockQuestion);
      expect(mockSessionRepository.save).toHaveBeenCalledWith(mockSession);
    });

    it("should throw NotFoundException if session not found", async () => {
      // Arrange
      mockSessionRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(handler.execute(command)).rejects.toThrow(NotFoundException);
      await expect(handler.execute(command)).rejects.toThrow(
        "Interview session not found",
      );
      expect(mockSessionRepository.save).not.toHaveBeenCalled();
    });

    it("should throw ForbiddenException if session belongs to another user", async () => {
      // Arrange
      const mockSession = {
        belongsToUser: jest.fn().mockReturnValue(false),
      };

      mockSessionRepository.findById.mockResolvedValue(mockSession as any);

      // Act & Assert
      await expect(handler.execute(command)).rejects.toThrow(
        ForbiddenException,
      );
      await expect(handler.execute(command)).rejects.toThrow(
        "You do not have access to this interview session",
      );
      expect(mockSessionRepository.save).not.toHaveBeenCalled();
    });

    it("should throw BadRequestException if session is not in progress", async () => {
      // Arrange
      const mockSession = {
        belongsToUser: jest.fn().mockReturnValue(true),
        isInProgress: jest.fn().mockReturnValue(false),
      };

      mockSessionRepository.findById.mockResolvedValue(mockSession as any);

      // Act & Assert
      await expect(handler.execute(command)).rejects.toThrow(
        BadRequestException,
      );
      await expect(handler.execute(command)).rejects.toThrow(
        "Interview session is not in progress",
      );
      expect(mockSessionRepository.save).not.toHaveBeenCalled();
    });

    it("should throw BadRequestException if questionId does not match current question", async () => {
      // Arrange
      const mockSession = {
        belongsToUser: jest.fn().mockReturnValue(true),
        getCurrentQuestion: jest
          .fn()
          .mockReturnValue({ id: "different-question-id" }),
        isInProgress: jest.fn().mockReturnValue(true),
      };

      mockSessionRepository.findById.mockResolvedValue(mockSession as any);

      // Act & Assert
      await expect(handler.execute(command)).rejects.toThrow(
        BadRequestException,
      );
      await expect(handler.execute(command)).rejects.toThrow(
        "Question ID does not match the current question",
      );
      expect(mockSessionRepository.save).not.toHaveBeenCalled();
    });

    it("should throw NotFoundException if job profile not found", async () => {
      // Arrange
      const mockSession = {
        belongsToUser: jest.fn().mockReturnValue(true),
        getCurrentQuestion: jest.fn().mockReturnValue({ id: "question-id" }),
        getJobProfileId: jest.fn().mockReturnValue("job-profile-id"),
        isInProgress: jest.fn().mockReturnValue(true),
      };

      mockSessionRepository.findById.mockResolvedValue(mockSession as any);
      mockJobProfilesACL.getJobProfileInfo.mockResolvedValue(null);

      // Act & Assert
      await expect(handler.execute(command)).rejects.toThrow(NotFoundException);
      await expect(handler.execute(command)).rejects.toThrow(
        "Job profile not found",
      );
      expect(mockSessionRepository.save).not.toHaveBeenCalled();
    });

    it("should generate feedback for low scores", async () => {
      // Arrange
      const mockSession = {
        addQuestion: jest.fn(),
        belongsToUser: jest.fn().mockReturnValue(true),
        getCurrentQuestion: jest
          .fn()
          .mockReturnValue({ category: "Leadership", id: "question-id" }),
        getInterviewType: jest
          .fn()
          .mockReturnValue({ getValue: () => "behavioral" }),
        getJobProfileId: jest.fn().mockReturnValue("job-profile-id"),
        getProgress: jest.fn().mockReturnValue("1/10"),
        getTimeRemaining: jest.fn().mockReturnValue(1680),
        isInProgress: jest.fn().mockReturnValue(true),
        submitAnswer: jest.fn(),
      };

      const mockJobProfile = {
        competencies: [{ depth: 3, name: "Leadership", weight: 0.8 }],
        id: "job-profile-id",
        interviewDifficultyLevel: 7,
        jobTitle: "Senior Software Engineer",
        userId: "user-id",
      };

      const mockScores = AnswerScores.create(3, 4, 3, 4); // Low scores
      const mockFeedback = "Consider using the STAR format.";

      mockSessionRepository.findById.mockResolvedValue(mockSession as any);
      mockJobProfilesACL.getJobProfileInfo.mockResolvedValue(mockJobProfile);
      mockScoringService.scoreAnswer.mockReturnValue(mockScores);
      mockQuestionSelector.selectNextQuestion.mockResolvedValue(null);
      mockFeedbackGenerator.generateFeedback.mockReturnValue(mockFeedback);

      // Act
      const result = await handler.execute(command);

      // Assert
      expect(result.overall_score).toBeLessThan(50);
      expect(result.feedback).toBe(mockFeedback);
      expect(mockFeedbackGenerator.generateFeedback).toHaveBeenCalledWith(
        mockScores,
        "behavioral",
      );
    });

    it("should handle session end (no next question)", async () => {
      // Arrange
      const mockSession = {
        addQuestion: jest.fn(),
        belongsToUser: jest.fn().mockReturnValue(true),
        getCurrentQuestion: jest
          .fn()
          .mockReturnValue({ category: "Leadership", id: "question-id" }),
        getInterviewType: jest
          .fn()
          .mockReturnValue({ getValue: () => "behavioral" }),
        getJobProfileId: jest.fn().mockReturnValue("job-profile-id"),
        getProgress: jest.fn().mockReturnValue("10/10"),
        getTimeRemaining: jest.fn().mockReturnValue(0),
        isInProgress: jest.fn().mockReturnValue(true),
        submitAnswer: jest.fn(),
      };

      const mockJobProfile = {
        competencies: [{ depth: 3, name: "Leadership", weight: 0.8 }],
        id: "job-profile-id",
        interviewDifficultyLevel: 7,
        jobTitle: "Senior Software Engineer",
        userId: "user-id",
      };

      const mockScores = AnswerScores.create(8, 9, 7, 8);

      mockSessionRepository.findById.mockResolvedValue(mockSession as any);
      mockJobProfilesACL.getJobProfileInfo.mockResolvedValue(mockJobProfile);
      mockScoringService.scoreAnswer.mockReturnValue(mockScores);
      mockQuestionSelector.selectNextQuestion.mockResolvedValue(null); // No next question
      mockFeedbackGenerator.generateFeedback.mockReturnValue(null);

      // Act
      const result = await handler.execute(command);

      // Assert
      expect(result.question).toBeUndefined();
      expect(mockSession.addQuestion).not.toHaveBeenCalled();
      expect(mockSessionRepository.save).toHaveBeenCalledWith(mockSession);
    });

    it("should pass correct parameters to scoring service", async () => {
      // Arrange
      const mockSession = {
        addQuestion: jest.fn(),
        belongsToUser: jest.fn().mockReturnValue(true),
        getCurrentQuestion: jest.fn().mockReturnValue({
          category: "Technical Problem Solving",
          id: "question-id",
        }),
        getInterviewType: jest
          .fn()
          .mockReturnValue({ getValue: () => "technical" }),
        getJobProfileId: jest.fn().mockReturnValue("job-profile-id"),
        getProgress: jest.fn().mockReturnValue("1/10"),
        getTimeRemaining: jest.fn().mockReturnValue(1680),
        isInProgress: jest.fn().mockReturnValue(true),
        submitAnswer: jest.fn(),
      };

      const mockJobProfile = {
        competencies: [
          { depth: 3, name: "Technical Problem Solving", weight: 0.9 },
          { depth: 2, name: "System Design", weight: 0.7 },
        ],
        id: "job-profile-id",
        interviewDifficultyLevel: 8,
        jobTitle: "Staff Engineer",
        userId: "user-id",
      };

      const mockScores = AnswerScores.create(8, 9, 7, 8);

      mockSessionRepository.findById.mockResolvedValue(mockSession as any);
      mockJobProfilesACL.getJobProfileInfo.mockResolvedValue(mockJobProfile);
      mockScoringService.scoreAnswer.mockReturnValue(mockScores);
      mockQuestionSelector.selectNextQuestion.mockResolvedValue(null);
      mockFeedbackGenerator.generateFeedback.mockReturnValue(null);

      // Act
      await handler.execute(command);

      // Assert
      expect(mockScoringService.scoreAnswer).toHaveBeenCalledWith(
        command.answerText,
        "Technical Problem Solving",
        "technical",
        ["Technical Problem Solving", "System Design"],
      );
    });
  });
});
