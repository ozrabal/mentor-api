import { ForbiddenException, NotFoundException } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";

import { JOB_PROFILES_ACL } from "@modules/job-profiles/public";

import {
  IInterviewSessionRepository,
  INTERVIEW_SESSION_REPOSITORY,
} from "../../../domain/repositories/interview-session.repository.interface";
import {
  IQuestionSelectorService,
  QUESTION_SELECTOR_SERVICE,
} from "../../../domain/services/question-selector.service.interface";
import { StartInterviewCommand } from "../impl/start-interview.command";
import { StartInterviewHandler } from "./start-interview.handler";

describe("StartInterviewHandler", () => {
  let handler: StartInterviewHandler;
  let mockSessionRepository: jest.Mocked<IInterviewSessionRepository>;
  let mockQuestionSelector: jest.Mocked<IQuestionSelectorService>;
  let mockJobProfilesACL: any;

  beforeEach(async () => {
    mockSessionRepository = {
      save: jest.fn(),
      findById: jest.fn(),
    };

    mockQuestionSelector = {
      selectQuestion: jest.fn(),
    };

    mockJobProfilesACL = {
      getJobProfileInfo: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StartInterviewHandler,
        {
          provide: INTERVIEW_SESSION_REPOSITORY,
          useValue: mockSessionRepository,
        },
        {
          provide: QUESTION_SELECTOR_SERVICE,
          useValue: mockQuestionSelector,
        },
        {
          provide: JOB_PROFILES_ACL,
          useValue: mockJobProfilesACL,
        },
      ],
    }).compile();

    handler = module.get<StartInterviewHandler>(StartInterviewHandler);
  });

  it("should be defined", () => {
    expect(handler).toBeDefined();
  });

  it("should create interview session with first question", async () => {
    // Arrange
    const command = new StartInterviewCommand(
      "job-profile-id",
      "user-id",
      "mixed",
    );

    mockJobProfilesACL.getJobProfileInfo.mockResolvedValue({
      competencies: [
        { depth: 3, name: "leadership", weight: 0.8 },
        { depth: 2, name: "communication", weight: 0.6 },
      ],
      id: "job-profile-id",
      interviewDifficultyLevel: 7,
      jobTitle: "Senior Software Engineer",
      userId: "user-id",
    });

    mockQuestionSelector.selectQuestion.mockResolvedValue({
      category: "leadership",
      difficulty: 7,
      id: "question-id",
      text: "Tell me about a time...",
    });

    // Act
    const result = await handler.execute(command);

    // Assert
    expect(result).toHaveProperty("sessionId");
    expect(result.question).toEqual({
      category: "leadership",
      difficulty: 7,
      id: "question-id",
      text: "Tell me about a time...",
    });
    expect(result.sessionToken).toContain("session_");
    expect(mockSessionRepository.save).toHaveBeenCalledTimes(1);
  });

  it("should throw NotFoundException when job profile not found", async () => {
    // Arrange
    const command = new StartInterviewCommand(
      "non-existent-id",
      "user-id",
      "mixed",
    );

    mockJobProfilesACL.getJobProfileInfo.mockResolvedValue(null);

    // Act & Assert
    await expect(handler.execute(command)).rejects.toThrow(NotFoundException);
    expect(mockSessionRepository.save).not.toHaveBeenCalled();
  });

  it("should throw ForbiddenException when job profile belongs to another user", async () => {
    // Arrange
    const command = new StartInterviewCommand(
      "job-profile-id",
      "user-a",
      "mixed",
    );

    mockJobProfilesACL.getJobProfileInfo.mockResolvedValue({
      competencies: [],
      id: "job-profile-id",
      interviewDifficultyLevel: 7,
      jobTitle: "Senior Software Engineer",
      userId: "user-b", // Different user
    });

    // Act & Assert
    await expect(handler.execute(command)).rejects.toThrow(ForbiddenException);
    expect(mockSessionRepository.save).not.toHaveBeenCalled();
  });

  it("should use default interview type when not provided", async () => {
    // Arrange
    const command = new StartInterviewCommand(
      "job-profile-id",
      "user-id",
      undefined, // No interview type
    );

    mockJobProfilesACL.getJobProfileInfo.mockResolvedValue({
      competencies: [{ depth: 3, name: "leadership", weight: 0.8 }],
      id: "job-profile-id",
      interviewDifficultyLevel: 7,
      jobTitle: "Senior Software Engineer",
      userId: "user-id",
    });

    mockQuestionSelector.selectQuestion.mockResolvedValue({
      category: "leadership",
      difficulty: 7,
      id: "question-id",
      text: "Question text",
    });

    // Act
    await handler.execute(command);

    // Assert
    expect(mockQuestionSelector.selectQuestion).toHaveBeenCalledWith(
      expect.anything(),
      7,
      "mixed", // Should default to 'mixed'
    );
  });
});
