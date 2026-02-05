import { CommandBus } from "@nestjs/cqrs";
import { Test, TestingModule } from "@nestjs/testing";

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
});
