import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";

import { JobProfile } from "../../../domain/entities/job-profile.entity";
import {
  IJobProfileRepository,
  JOB_PROFILE_REPOSITORY,
} from "../../../domain/repositories/job-profile.repository.interface";
import { UserId } from "../../../domain/value-objects/user-id";
import { RestoreJobProfileCommand } from "../impl/restore-job-profile.command";
import { RestoreJobProfileHandler } from "./restore-job-profile.handler";

describe("RestoreJobProfileHandler", () => {
  let handler: RestoreJobProfileHandler;
  let mockRepository: jest.Mocked<IJobProfileRepository>;

  beforeEach(async () => {
    mockRepository = {
      findById: jest.fn(),
      findByUserId: jest.fn(),
      save: jest.fn(),
      softDelete: jest.fn(),
      restore: jest.fn(),
      countByUserId: jest.fn(),
      count: jest.fn(),
      search: jest.fn(),
    } as jest.Mocked<IJobProfileRepository>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RestoreJobProfileHandler,
        {
          provide: JOB_PROFILE_REPOSITORY,
          useValue: mockRepository,
        },
      ],
    }).compile();

    handler = module.get<RestoreJobProfileHandler>(RestoreJobProfileHandler);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("execute", () => {
    it("should restore a soft-deleted job profile", async () => {
      const userId = "user-123";
      const jobProfileId = "550e8400-e29b-41d4-a716-446655440000";
      const command = new RestoreJobProfileCommand(userId, jobProfileId);

      const mockJobProfile = JobProfile.createNew({
        userId: UserId.create(userId),
        jobTitle: "Senior Engineer",
        rawJD: "Job description",
      });
      mockJobProfile.softDelete();

      mockRepository.findById.mockResolvedValue(mockJobProfile);
      mockRepository.restore.mockResolvedValue();

      await handler.execute(command);

      expect(mockRepository.findById).toHaveBeenCalledWith(
        expect.objectContaining({
          getValue: expect.any(Function),
        }),
        true,
      );
      expect(mockRepository.restore).toHaveBeenCalledWith(
        expect.objectContaining({
          getValue: expect.any(Function),
        }),
      );
    });

    it("should throw NotFoundException when job profile not found", async () => {
      const command = new RestoreJobProfileCommand(
        "user-123",
        "550e8400-e29b-41d4-a716-446655440000",
      );

      mockRepository.findById.mockResolvedValue(null);

      await expect(handler.execute(command)).rejects.toThrow(NotFoundException);
      await expect(handler.execute(command)).rejects.toThrow(
        "Job profile not found",
      );
      expect(mockRepository.restore).not.toHaveBeenCalled();
    });

    it("should throw BadRequestException when job profile is not deleted", async () => {
      const userId = "user-123";
      const jobProfileId = "550e8400-e29b-41d4-a716-446655440000";
      const command = new RestoreJobProfileCommand(userId, jobProfileId);

      const mockJobProfile = JobProfile.createNew({
        userId: UserId.create(userId),
        jobTitle: "Senior Engineer",
        rawJD: "Job description",
      });

      mockRepository.findById.mockResolvedValue(mockJobProfile);

      await expect(handler.execute(command)).rejects.toThrow(
        BadRequestException,
      );
      await expect(handler.execute(command)).rejects.toThrow(
        "Job profile is not deleted",
      );
      expect(mockRepository.restore).not.toHaveBeenCalled();
    });

    it("should throw ForbiddenException when user is not owner", async () => {
      const ownerId = "owner-123";
      const requesterId = "requester-456";
      const jobProfileId = "550e8400-e29b-41d4-a716-446655440000";

      const command = new RestoreJobProfileCommand(requesterId, jobProfileId);

      const mockJobProfile = JobProfile.createNew({
        userId: UserId.create(ownerId),
        jobTitle: "Senior Engineer",
        rawJD: "Job description",
      });
      mockJobProfile.softDelete();

      mockRepository.findById.mockResolvedValue(mockJobProfile);

      await expect(handler.execute(command)).rejects.toThrow(
        ForbiddenException,
      );
      await expect(handler.execute(command)).rejects.toThrow("Access denied");
      expect(mockRepository.restore).not.toHaveBeenCalled();
    });
  });
});
