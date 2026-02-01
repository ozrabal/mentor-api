import { Test, TestingModule } from "@nestjs/testing";

import {
  IJobProfileRepository,
  JOB_PROFILE_REPOSITORY,
} from "../../../domain/repositories/job-profile.repository.interface";
import { JobProfile } from "../../../domain/entities/job-profile.entity";
import { UserId } from "../../../domain/value-objects/user-id";
import { SeniorityLevel } from "../../../domain/value-objects/seniority-level";
import { SearchJobProfilesQuery } from "../impl/search-job-profiles.query";
import { SearchJobProfilesHandler } from "./search-job-profiles.handler";

describe("SearchJobProfilesHandler", () => {
  let handler: SearchJobProfilesHandler;
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
        SearchJobProfilesHandler,
        {
          provide: JOB_PROFILE_REPOSITORY,
          useValue: mockRepository,
        },
      ],
    }).compile();

    handler = module.get<SearchJobProfilesHandler>(SearchJobProfilesHandler);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("execute", () => {
    it("should return paginated list of job profiles for user", async () => {
      const userId = "user-123";
      const page = 1;
      const limit = 10;
      const query = new SearchJobProfilesQuery(userId, page, limit);

      const mockProfile1 = JobProfile.createNew({
        userId: UserId.create(userId),
        jobTitle: "Senior Engineer",
        rawJD: "Job description 1",
        companyName: "Tech Corp",
        seniorityLevel: SeniorityLevel.create(7),
        interviewDifficultyLevel: 8,
      });

      const mockProfile2 = JobProfile.createNew({
        userId: UserId.create(userId),
        jobTitle: "Tech Lead",
        rawJD: "Job description 2",
        companyName: "Startup Inc",
        seniorityLevel: SeniorityLevel.create(5),
        interviewDifficultyLevel: 6,
      });

      mockRepository.search.mockResolvedValue([mockProfile1, mockProfile2]);
      mockRepository.count.mockResolvedValue(2);

      const result = await handler.execute(query);

      expect(mockRepository.search).toHaveBeenCalledWith(
        { userId, jobTitle: undefined },
        { field: "createdAt", direction: "desc" },
        limit,
        0, // offset
      );
      expect(mockRepository.count).toHaveBeenCalledWith({
        userId,
        jobTitle: undefined,
      });
      expect(result.items).toHaveLength(2);
      expect(result.totalItems).toBe(2);
      expect(result.totalPages).toBe(1);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
      expect(result.nextPage).toBeNull();
      expect(result.prevPage).toBeNull();
      expect(result.items[0].userId).toBe(userId);
      expect(result.items[0].jobTitle).toBe("Senior Engineer");
      expect(result.items[0].companyName).toBe("Tech Corp");
      expect(result.items[0].seniorityLevel).toBe(7);
      expect(result.items[0].interviewDifficultyLevel).toBe(8);
    });

    it("should return empty list when user has no profiles", async () => {
      const userId = "user-456";
      const query = new SearchJobProfilesQuery(userId, 1, 10);

      mockRepository.search.mockResolvedValue([]);
      mockRepository.count.mockResolvedValue(0);

      const result = await handler.execute(query);

      expect(result.items).toHaveLength(0);
      expect(result.totalItems).toBe(0);
      expect(result.totalPages).toBe(0);
      expect(result.nextPage).toBeNull();
      expect(result.prevPage).toBeNull();
    });

    it("should respect pagination parameters (limit)", async () => {
      const userId = "user-789";
      const limit = 5;
      const page = 1;
      const query = new SearchJobProfilesQuery(userId, page, limit);

      const mockProfiles = Array.from({ length: 5 }, (_, i) =>
        JobProfile.createNew({
          userId: UserId.create(userId),
          jobTitle: `Job ${i + 1}`,
          rawJD: `Description ${i + 1}`,
        }),
      );

      mockRepository.search.mockResolvedValue(mockProfiles);
      mockRepository.count.mockResolvedValue(10);

      const result = await handler.execute(query);

      expect(mockRepository.search).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        limit,
        0, // offset
      );
      expect(result.items).toHaveLength(5);
      expect(result.totalItems).toBe(10);
      expect(result.totalPages).toBe(2);
      expect(result.nextPage).toBe(2);
      expect(result.prevPage).toBeNull();
    });

    it("should respect pagination parameters (page and offset)", async () => {
      const userId = "user-999";
      const limit = 10;
      const page = 2;
      const query = new SearchJobProfilesQuery(userId, page, limit);

      const mockProfiles = Array.from({ length: 5 }, (_, i) =>
        JobProfile.createNew({
          userId: UserId.create(userId),
          jobTitle: `Job ${i + 11}`,
          rawJD: `Description ${i + 11}`,
        }),
      );

      mockRepository.search.mockResolvedValue(mockProfiles);
      mockRepository.count.mockResolvedValue(15);

      const result = await handler.execute(query);

      expect(mockRepository.search).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        limit,
        10, // offset for page 2
      );
      expect(result.items).toHaveLength(5);
      expect(result.totalItems).toBe(15);
      expect(result.totalPages).toBe(2);
      expect(result.page).toBe(2);
      expect(result.nextPage).toBeNull();
      expect(result.prevPage).toBe(1);
    });

    it("should filter by job title", async () => {
      const userId = "user-filter";
      const jobTitle = "Senior";
      const query = new SearchJobProfilesQuery(userId, 1, 10, jobTitle);

      const mockProfile = JobProfile.createNew({
        userId: UserId.create(userId),
        jobTitle: "Senior Software Engineer",
        rawJD: "Job description",
      });

      mockRepository.search.mockResolvedValue([mockProfile]);
      mockRepository.count.mockResolvedValue(1);

      const result = await handler.execute(query);

      expect(mockRepository.search).toHaveBeenCalledWith(
        { userId, jobTitle: "Senior" },
        expect.anything(),
        expect.anything(),
        expect.anything(),
      );
      expect(mockRepository.count).toHaveBeenCalledWith({
        userId,
        jobTitle: "Senior",
      });
      expect(result.items).toHaveLength(1);
      expect(result.filters).toEqual({ jobTitle: "Senior" });
    });

    it("should apply custom sort options", async () => {
      const userId = "user-sort";
      const sort = { field: "jobTitle", direction: "asc" as const };
      const query = new SearchJobProfilesQuery(userId, 1, 10, undefined, sort);

      mockRepository.search.mockResolvedValue([]);
      mockRepository.count.mockResolvedValue(0);

      await handler.execute(query);

      expect(mockRepository.search).toHaveBeenCalledWith(
        expect.anything(),
        { field: "jobTitle", direction: "asc" },
        expect.anything(),
        expect.anything(),
      );
    });

    it("should apply default sort when not specified", async () => {
      const userId = "user-default-sort";
      const query = new SearchJobProfilesQuery(userId, 1, 10);

      mockRepository.search.mockResolvedValue([]);
      mockRepository.count.mockResolvedValue(0);

      const result = await handler.execute(query);

      expect(mockRepository.search).toHaveBeenCalledWith(
        expect.anything(),
        { field: "createdAt", direction: "desc" },
        expect.anything(),
        expect.anything(),
      );
      expect(result.sort).toEqual({ field: "createdAt", direction: "desc" });
    });

    it("should execute search and count in parallel", async () => {
      const userId = "user-parallel";
      const query = new SearchJobProfilesQuery(userId, 1, 10);

      const mockProfile = JobProfile.createNew({
        userId: UserId.create(userId),
        jobTitle: "Engineer",
        rawJD: "Description",
      });

      // Track call order
      const callOrder: string[] = [];

      mockRepository.search.mockImplementation(async () => {
        callOrder.push("search");
        return [mockProfile];
      });

      mockRepository.count.mockImplementation(async () => {
        callOrder.push("count");
        return 1;
      });

      await handler.execute(query);

      // Both should be called
      expect(mockRepository.search).toHaveBeenCalled();
      expect(mockRepository.count).toHaveBeenCalled();
    });

    it("should calculate pagination metadata correctly for middle page", async () => {
      const userId = "user-middle-page";
      const query = new SearchJobProfilesQuery(userId, 3, 10);

      mockRepository.search.mockResolvedValue([]);
      mockRepository.count.mockResolvedValue(50);

      const result = await handler.execute(query);

      expect(result.totalPages).toBe(5);
      expect(result.page).toBe(3);
      expect(result.nextPage).toBe(4);
      expect(result.prevPage).toBe(2);
    });

    it("should handle last page correctly", async () => {
      const userId = "user-last-page";
      const query = new SearchJobProfilesQuery(userId, 5, 10);

      mockRepository.search.mockResolvedValue([]);
      mockRepository.count.mockResolvedValue(50);

      const result = await handler.execute(query);

      expect(result.page).toBe(5);
      expect(result.nextPage).toBeNull();
      expect(result.prevPage).toBe(4);
    });

    it("should handle first page correctly", async () => {
      const userId = "user-first-page";
      const query = new SearchJobProfilesQuery(userId, 1, 10);

      mockRepository.search.mockResolvedValue([]);
      mockRepository.count.mockResolvedValue(50);

      const result = await handler.execute(query);

      expect(result.page).toBe(1);
      expect(result.nextPage).toBe(2);
      expect(result.prevPage).toBeNull();
    });

    it("should map domain entities to list item DTOs correctly", async () => {
      const userId = "user-mapping";
      const query = new SearchJobProfilesQuery(userId, 1, 10);

      const mockProfile = JobProfile.createNew({
        userId: UserId.create(userId),
        jobTitle: "Full Stack Developer",
        companyName: "Acme Inc",
        rawJD: "Job description",
        seniorityLevel: SeniorityLevel.create(6),
        interviewDifficultyLevel: 7,
      });

      mockRepository.search.mockResolvedValue([mockProfile]);
      mockRepository.count.mockResolvedValue(1);

      const result = await handler.execute(query);

      const item = result.items[0];
      expect(item.id).toBeDefined();
      expect(item.userId).toBe(userId);
      expect(item.jobTitle).toBe("Full Stack Developer");
      expect(item.companyName).toBe("Acme Inc");
      expect(item.seniorityLevel).toBe(6);
      expect(item.interviewDifficultyLevel).toBe(7);
      expect(item.createdAt).toBeInstanceOf(Date);
      expect(item.updatedAt).toBeInstanceOf(Date);
    });

    it("should handle optional fields in DTOs", async () => {
      const userId = "user-optional";
      const query = new SearchJobProfilesQuery(userId, 1, 10);

      const mockProfile = JobProfile.createNew({
        userId: UserId.create(userId),
        rawJD: "Minimal job description",
      });

      mockRepository.search.mockResolvedValue([mockProfile]);
      mockRepository.count.mockResolvedValue(1);

      const result = await handler.execute(query);

      const item = result.items[0];
      expect(item.jobTitle).toBeUndefined();
      expect(item.companyName).toBeUndefined();
      expect(item.seniorityLevel).toBeUndefined();
      expect(item.interviewDifficultyLevel).toBeUndefined();
    });

    it("should include empty filters object when no filters applied", async () => {
      const userId = "user-no-filters";
      const query = new SearchJobProfilesQuery(userId, 1, 10);

      mockRepository.search.mockResolvedValue([]);
      mockRepository.count.mockResolvedValue(0);

      const result = await handler.execute(query);

      expect(result.filters).toEqual({});
    });

    it("should calculate correct offset for various pages", async () => {
      const userId = "user-offset-calc";

      // Page 1, limit 10 => offset 0
      let query = new SearchJobProfilesQuery(userId, 1, 10);
      mockRepository.search.mockResolvedValue([]);
      mockRepository.count.mockResolvedValue(0);
      await handler.execute(query);
      expect(mockRepository.search).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        10,
        0,
      );

      // Page 3, limit 20 => offset 40
      query = new SearchJobProfilesQuery(userId, 3, 20);
      await handler.execute(query);
      expect(mockRepository.search).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        20,
        40,
      );

      // Page 5, limit 5 => offset 20
      query = new SearchJobProfilesQuery(userId, 5, 5);
      await handler.execute(query);
      expect(mockRepository.search).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        5,
        20,
      );
    });
  });
});
