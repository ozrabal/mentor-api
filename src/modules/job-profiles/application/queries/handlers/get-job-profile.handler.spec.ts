import { ForbiddenException, NotFoundException } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";

import {
  IJobProfileRepository,
  JOB_PROFILE_REPOSITORY,
} from "../../../domain/repositories/job-profile.repository.interface";
import { JobProfile } from "../../../domain/entities/job-profile.entity";
import { Competency } from "../../../domain/entities/competency.entity";
import { UserId } from "../../../domain/value-objects/user-id";
import { JobProfileId } from "../../../domain/value-objects/job-profile-id";
import { SeniorityLevel } from "../../../domain/value-objects/seniority-level";
import { GetJobProfileQuery } from "../impl/get-job-profile.query";
import { GetJobProfileHandler } from "./get-job-profile.handler";

describe("GetJobProfileHandler", () => {
  let handler: GetJobProfileHandler;
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
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetJobProfileHandler,
        {
          provide: JOB_PROFILE_REPOSITORY,
          useValue: mockRepository,
        },
      ],
    }).compile();

    handler = module.get<GetJobProfileHandler>(GetJobProfileHandler);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("execute", () => {
    it("should return job profile when found and user is owner", async () => {
      const userId = "user-123";
      const jobProfileId = "profile-456";
      const query = new GetJobProfileQuery(userId, jobProfileId);

      const mockJobProfile = JobProfile.createNew({
        userId: UserId.create(userId),
        jobTitle: "Senior Engineer",
        rawJD: "Job description",
      });

      mockRepository.findById.mockResolvedValue(mockJobProfile);

      const result = await handler.execute(query);

      expect(mockRepository.findById).toHaveBeenCalledWith(
        expect.objectContaining({
          getValue: expect.any(Function),
        }),
      );
      expect(result.userId).toBe(userId);
      expect(result.jobTitle).toBe("Senior Engineer");
    });

    it("should throw NotFoundException when job profile not found", async () => {
      const query = new GetJobProfileQuery("user-123", "non-existent-id");

      mockRepository.findById.mockResolvedValue(null);

      await expect(handler.execute(query)).rejects.toThrow(NotFoundException);
      await expect(handler.execute(query)).rejects.toThrow(
        "Job profile not found",
      );
    });

    it("should throw ForbiddenException when user is not owner", async () => {
      const ownerId = "owner-123";
      const requesterId = "requester-456";
      const jobProfileId = "profile-789";

      const query = new GetJobProfileQuery(requesterId, jobProfileId);

      const mockJobProfile = JobProfile.createNew({
        userId: UserId.create(ownerId),
        jobTitle: "Senior Engineer",
        rawJD: "Job description",
      });

      mockRepository.findById.mockResolvedValue(mockJobProfile);

      await expect(handler.execute(query)).rejects.toThrow(ForbiddenException);
      await expect(handler.execute(query)).rejects.toThrow("Access denied");
    });

    it("should return 404 for soft-deleted profiles", async () => {
      const query = new GetJobProfileQuery("user-123", "deleted-profile-id");

      // Repository should return null for soft-deleted profiles
      mockRepository.findById.mockResolvedValue(null);

      await expect(handler.execute(query)).rejects.toThrow(NotFoundException);
    });

    it("should return full job profile data with all fields", async () => {
      const userId = "user-123";
      const jobProfileId = "profile-456";
      const query = new GetJobProfileQuery(userId, jobProfileId);

      const mockJobProfile = JobProfile.createNew({
        userId: UserId.create(userId),
        jobTitle: "Senior Software Engineer",
        companyName: "Tech Corp",
        jobUrl: "https://example.com/job",
        rawJD: "We are looking for a senior engineer...",
        competencies: [
          Competency.create({ name: "System Design", weight: 0.3, depth: 8 }),
          Competency.create({
            name: "API Development",
            weight: 0.4,
            depth: 7,
          }),
          Competency.create({
            name: "Database Design",
            weight: 0.3,
            depth: 6,
          }),
        ],
        hardSkills: ["TypeScript", "NestJS", "PostgreSQL"],
        softSkills: ["Communication", "Leadership"],
        seniorityLevel: SeniorityLevel.create(7),
        interviewDifficultyLevel: 8,
      });

      mockRepository.findById.mockResolvedValue(mockJobProfile);

      const result = await handler.execute(query);

      expect(result).toEqual({
        id: expect.any(String),
        userId: userId,
        jobTitle: "Senior Software Engineer",
        companyName: "Tech Corp",
        jobUrl: "https://example.com/job",
        rawJD: "We are looking for a senior engineer...",
        competencies: [
          { name: "System Design", weight: 0.3, depth: 8 },
          { name: "API Development", weight: 0.4, depth: 7 },
          { name: "Database Design", weight: 0.3, depth: 6 },
        ],
        hardSkills: ["TypeScript", "NestJS", "PostgreSQL"],
        softSkills: ["Communication", "Leadership"],
        seniorityLevel: 7,
        interviewDifficultyLevel: 8,
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
      });
    });

    it("should handle optional fields correctly", async () => {
      const userId = "user-123";
      const jobProfileId = "profile-456";
      const query = new GetJobProfileQuery(userId, jobProfileId);

      const mockJobProfile = JobProfile.createNew({
        userId: UserId.create(userId),
        rawJD: "Job description",
      });

      mockRepository.findById.mockResolvedValue(mockJobProfile);

      const result = await handler.execute(query);

      expect(result.jobTitle).toBeUndefined();
      expect(result.companyName).toBeUndefined();
      expect(result.jobUrl).toBeUndefined();
      expect(result.seniorityLevel).toBeUndefined();
      expect(result.interviewDifficultyLevel).toBeUndefined();
    });

    it("should call repository with correct JobProfileId value object", async () => {
      const userId = "user-123";
      const jobProfileId = "profile-456";
      const query = new GetJobProfileQuery(userId, jobProfileId);

      const mockJobProfile = JobProfile.createNew({
        userId: UserId.create(userId),
        rawJD: "Job description",
      });

      mockRepository.findById.mockResolvedValue(mockJobProfile);

      await handler.execute(query);

      expect(mockRepository.findById).toHaveBeenCalledTimes(1);
      const calledWithArg = mockRepository.findById.mock.calls[0][0];
      expect(calledWithArg).toBeInstanceOf(JobProfileId);
      expect(calledWithArg.getValue()).toBe(jobProfileId);
    });
  });
});
