import { ForbiddenException, NotFoundException } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";

import { JobProfile } from "../../../domain/entities/job-profile.entity";
import {
  IJobProfileRepository,
  JOB_PROFILE_REPOSITORY,
} from "../../../domain/repositories/job-profile.repository.interface";
import { JobProfileId } from "../../../domain/value-objects/job-profile-id";
import { UserId } from "../../../domain/value-objects/user-id";
import { SoftDeleteJobProfileCommand } from "../impl/soft-delete-job-profile.command";
import { SoftDeleteJobProfileHandler } from "./soft-delete-job-profile.handler";

describe("SoftDeleteJobProfileHandler", () => {
  let handler: SoftDeleteJobProfileHandler;
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
        SoftDeleteJobProfileHandler,
        {
          provide: JOB_PROFILE_REPOSITORY,
          useValue: mockRepository,
        },
      ],
    }).compile();

    handler = module.get<SoftDeleteJobProfileHandler>(
      SoftDeleteJobProfileHandler,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("execute", () => {
    it("should soft delete job profile when found and user is owner", async () => {
      // Arrange
      const userId = "user-123";
      const jobProfileId = "550e8400-e29b-41d4-a716-446655440000";
      const command = new SoftDeleteJobProfileCommand(userId, jobProfileId);

      const mockJobProfile = JobProfile.createNew({
        userId: UserId.create(userId),
        jobTitle: "Senior Engineer",
        rawJD: "Job description",
      });

      mockRepository.findById.mockResolvedValue(mockJobProfile);
      mockRepository.softDelete.mockResolvedValue();

      // Act
      await handler.execute(command);

      // Assert
      expect(mockRepository.findById).toHaveBeenCalledWith(
        expect.objectContaining({
          getValue: expect.any(Function),
        }),
      );
      expect(mockRepository.softDelete).toHaveBeenCalledWith(
        expect.objectContaining({
          getValue: expect.any(Function),
        }),
      );

      // Verify the actual JobProfileId value
      const findByIdCall = mockRepository.findById.mock.calls[0][0];
      expect(findByIdCall.getValue()).toBe(jobProfileId);

      const softDeleteCall = mockRepository.softDelete.mock.calls[0][0];
      expect(softDeleteCall.getValue()).toBe(jobProfileId);
    });

    it("should throw NotFoundException when job profile not found", async () => {
      // Arrange
      const command = new SoftDeleteJobProfileCommand(
        "user-123",
        "550e8400-e29b-41d4-a716-446655440000",
      );

      mockRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(handler.execute(command)).rejects.toThrow(NotFoundException);
      await expect(handler.execute(command)).rejects.toThrow(
        "Job profile not found",
      );
      expect(mockRepository.softDelete).not.toHaveBeenCalled();
    });

    it("should throw ForbiddenException when user is not owner", async () => {
      // Arrange
      const ownerId = "owner-123";
      const requesterId = "requester-456";
      const jobProfileId = "550e8400-e29b-41d4-a716-446655440000";

      const command = new SoftDeleteJobProfileCommand(
        requesterId,
        jobProfileId,
      );

      const mockJobProfile = JobProfile.createNew({
        userId: UserId.create(ownerId),
        jobTitle: "Senior Engineer",
        rawJD: "Job description",
      });

      mockRepository.findById.mockResolvedValue(mockJobProfile);

      // Act & Assert
      await expect(handler.execute(command)).rejects.toThrow(
        ForbiddenException,
      );
      await expect(handler.execute(command)).rejects.toThrow("Access denied");
      expect(mockRepository.softDelete).not.toHaveBeenCalled();
    });

    it("should throw NotFoundException for already soft-deleted profile", async () => {
      // Arrange
      const command = new SoftDeleteJobProfileCommand(
        "user-123",
        "550e8400-e29b-41d4-a716-446655440000",
      );

      // Repository returns null for soft-deleted profiles
      mockRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(handler.execute(command)).rejects.toThrow(NotFoundException);
      expect(mockRepository.softDelete).not.toHaveBeenCalled();
    });

    it("should log success message after soft delete", async () => {
      // Arrange
      const userId = "user-123";
      const jobProfileId = "550e8400-e29b-41d4-a716-446655440000";
      const command = new SoftDeleteJobProfileCommand(userId, jobProfileId);

      const mockJobProfile = JobProfile.createNew({
        userId: UserId.create(userId),
        jobTitle: "Senior Engineer",
        rawJD: "Job description",
      });

      mockRepository.findById.mockResolvedValue(mockJobProfile);
      mockRepository.softDelete.mockResolvedValue();

      const logSpy = jest.spyOn(handler["logger"], "log");

      // Act
      await handler.execute(command);

      // Assert
      expect(logSpy).toHaveBeenCalledWith(
        expect.stringContaining("Successfully soft deleted"),
      );
    });

    it("should log warning when job profile not found", async () => {
      // Arrange
      const command = new SoftDeleteJobProfileCommand(
        "user-123",
        "550e8400-e29b-41d4-a716-446655440000",
      );

      mockRepository.findById.mockResolvedValue(null);

      const warnSpy = jest.spyOn(handler["logger"], "warn");

      // Act & Assert
      await expect(handler.execute(command)).rejects.toThrow(NotFoundException);
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining("not found"),
      );
    });

    it("should log warning when user attempts to delete another user's profile", async () => {
      // Arrange
      const ownerId = "owner-123";
      const requesterId = "requester-456";
      const jobProfileId = "550e8400-e29b-41d4-a716-446655440000";

      const command = new SoftDeleteJobProfileCommand(
        requesterId,
        jobProfileId,
      );

      const mockJobProfile = JobProfile.createNew({
        userId: UserId.create(ownerId),
        jobTitle: "Senior Engineer",
        rawJD: "Job description",
      });

      mockRepository.findById.mockResolvedValue(mockJobProfile);

      const warnSpy = jest.spyOn(handler["logger"], "warn");

      // Act & Assert
      await expect(handler.execute(command)).rejects.toThrow(
        ForbiddenException,
      );
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining("attempted to delete job profile"),
      );
    });

    it("should create JobProfileId from command jobProfileId", async () => {
      // Arrange
      const userId = "user-123";
      const jobProfileId = "550e8400-e29b-41d4-a716-446655440000";
      const command = new SoftDeleteJobProfileCommand(userId, jobProfileId);

      const mockJobProfile = JobProfile.createNew({
        userId: UserId.create(userId),
        jobTitle: "Senior Engineer",
        rawJD: "Job description",
      });

      mockRepository.findById.mockResolvedValue(mockJobProfile);
      mockRepository.softDelete.mockResolvedValue();

      // Act
      await handler.execute(command);

      // Assert - verify JobProfileId was created with correct value
      const findByIdArg = mockRepository.findById.mock.calls[0][0];
      expect(findByIdArg).toBeInstanceOf(JobProfileId);
      expect(findByIdArg.getValue()).toBe(jobProfileId);
    });
  });
});
