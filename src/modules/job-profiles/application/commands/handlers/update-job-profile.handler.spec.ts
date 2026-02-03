import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";

import { Competency } from "../../../domain/entities/competency.entity";
import { JobProfile } from "../../../domain/entities/job-profile.entity";
import {
  IJobProfileRepository,
  JOB_PROFILE_REPOSITORY,
} from "../../../domain/repositories/job-profile.repository.interface";
import { JobProfileId } from "../../../domain/value-objects/job-profile-id";
import { SeniorityLevel } from "../../../domain/value-objects/seniority-level";
import { UserId } from "../../../domain/value-objects/user-id";
import { UpdateJobProfileCommand } from "../impl/update-job-profile.command";
import { UpdateJobProfileHandler } from "./update-job-profile.handler";

describe("UpdateJobProfileHandler", () => {
  let handler: UpdateJobProfileHandler;
  let mockRepository: jest.Mocked<IJobProfileRepository>;

  beforeEach(async () => {
    mockRepository = {
      findById: jest.fn(),
      findByUserId: jest.fn(),
      save: jest.fn(),
      countByUserId: jest.fn(),
      softDelete: jest.fn(),
      restore: jest.fn(),
      search: jest.fn(),
      count: jest.fn(),
    } as jest.Mocked<IJobProfileRepository>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UpdateJobProfileHandler,
        {
          provide: JOB_PROFILE_REPOSITORY,
          useValue: mockRepository,
        },
      ],
    }).compile();

    handler = module.get<UpdateJobProfileHandler>(UpdateJobProfileHandler);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("execute", () => {
    it("should update job profile when found and user is owner", async () => {
      const userId = "user-123";
      const jobProfileId = "profile-456";
      const command = new UpdateJobProfileCommand(
        userId,
        jobProfileId,
        "Updated Senior Engineer",
        "Updated Company",
        [{ name: "Updated Competency", weight: 0.8, depth: 9 }],
        ["Go", "Rust"],
        ["Leadership"],
        9,
        9,
      );

      const mockJobProfile = JobProfile.createNew({
        userId: UserId.create(userId),
        jobTitle: "Senior Engineer",
        companyName: "Old Company",
        rawJD: "Job description",
        seniorityLevel: SeniorityLevel.create(7),
      });

      mockRepository.findById.mockResolvedValue(mockJobProfile);
      mockRepository.save.mockResolvedValue();

      const result = await handler.execute(command);

      expect(mockRepository.findById).toHaveBeenCalledWith(
        expect.any(JobProfileId),
        true,
      );
      expect(mockRepository.save).toHaveBeenCalledWith(mockJobProfile);
      expect(result.jobTitle).toBe("Updated Senior Engineer");
      expect(result.companyName).toBe("Updated Company");
      expect(result.seniorityLevel).toBe(9);
      expect(result.hardSkills).toEqual(["Go", "Rust"]);
      expect(result.softSkills).toEqual(["Leadership"]);
      expect(result.competencies).toEqual([
        { name: "Updated Competency", weight: 0.8, depth: 9 },
      ]);
    });

    it("should throw NotFoundException when job profile not found", async () => {
      const command = new UpdateJobProfileCommand(
        "user-123",
        "non-existent-id",
        "Updated Title",
      );

      mockRepository.findById.mockResolvedValue(null);

      await expect(handler.execute(command)).rejects.toThrow(NotFoundException);
      await expect(handler.execute(command)).rejects.toThrow(
        "Job profile not found",
      );
    });

    it("should throw ForbiddenException when user is not owner", async () => {
      const ownerId = "owner-123";
      const requesterId = "requester-456";
      const jobProfileId = "profile-789";

      const command = new UpdateJobProfileCommand(
        requesterId,
        jobProfileId,
        "Updated Title",
      );

      const mockJobProfile = JobProfile.createNew({
        userId: UserId.create(ownerId),
        jobTitle: "Senior Engineer",
        rawJD: "Job description",
      });

      mockRepository.findById.mockResolvedValue(mockJobProfile);

      await expect(handler.execute(command)).rejects.toThrow(
        ForbiddenException,
      );
      await expect(handler.execute(command)).rejects.toThrow("Access denied");
    });

    it("should throw ConflictException for soft-deleted profiles", async () => {
      const userId = "user-123";
      const jobProfileId = "deleted-profile-id";
      const command = new UpdateJobProfileCommand(
        userId,
        jobProfileId,
        "Updated Title",
      );

      const mockJobProfile = JobProfile.createNew({
        userId: UserId.create(userId),
        jobTitle: "Senior Engineer",
        rawJD: "Job description",
      });
      mockJobProfile.softDelete();

      mockRepository.findById.mockResolvedValue(mockJobProfile);

      await expect(handler.execute(command)).rejects.toThrow(ConflictException);
      await expect(handler.execute(command)).rejects.toThrow(
        "Cannot update deleted job profile. Restore it first.",
      );
    });

    it("should only update provided fields (partial update)", async () => {
      const userId = "user-123";
      const jobProfileId = "profile-456";
      const command = new UpdateJobProfileCommand(
        userId,
        jobProfileId,
        "Updated Title Only",
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
      );

      const mockJobProfile = JobProfile.createNew({
        userId: UserId.create(userId),
        jobTitle: "Old Title",
        companyName: "Old Company",
        rawJD: "Job description",
        hardSkills: ["TypeScript"],
        seniorityLevel: SeniorityLevel.create(7),
      });

      mockRepository.findById.mockResolvedValue(mockJobProfile);
      mockRepository.save.mockResolvedValue();

      const result = await handler.execute(command);

      expect(result.jobTitle).toBe("Updated Title Only");
      expect(result.companyName).toBe("Old Company");
      expect(result.hardSkills).toEqual(["TypeScript"]);
      expect(result.seniorityLevel).toBe(7);
    });

    it("should update updatedAt timestamp", async () => {
      const userId = "user-123";
      const jobProfileId = "profile-456";
      const command = new UpdateJobProfileCommand(
        userId,
        jobProfileId,
        "Updated Title",
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        6,
      );

      const oldDate = new Date("2026-01-01T00:00:00Z");
      const mockJobProfile = JobProfile.rehydrate({
        id: JobProfileId.create(jobProfileId),
        userId: UserId.create(userId),
        jobTitle: "Old Title",
        rawJD: "Job description",
        createdAt: oldDate,
        updatedAt: oldDate,
      });

      mockRepository.findById.mockResolvedValue(mockJobProfile);
      mockRepository.save.mockResolvedValue();

      const result = await handler.execute(command);

      expect(result.updatedAt.getTime()).toBeGreaterThan(oldDate.getTime());
    });

    it("should map competencies via Competency.create", async () => {
      const userId = "user-123";
      const jobProfileId = "profile-456";
      const command = new UpdateJobProfileCommand(
        userId,
        jobProfileId,
        undefined,
        undefined,
        [{ name: "Architecture", weight: 0.5, depth: 8 }],
      );

      const mockJobProfile = JobProfile.createNew({
        userId: UserId.create(userId),
        jobTitle: "Old Title",
        rawJD: "Job description",
      });

      mockRepository.findById.mockResolvedValue(mockJobProfile);
      mockRepository.save.mockResolvedValue();

      const competencySpy = jest.spyOn(Competency, "create");

      await handler.execute(command);

      expect(competencySpy).toHaveBeenCalledWith({
        name: "Architecture",
        weight: 0.5,
        depth: 8,
      });
    });
  });
});
