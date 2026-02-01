/**
 * JobProfiles Controller Unit Tests
 *
 * Tests the JobProfilesController presentation layer component.
 * Tests HTTP endpoint orchestration and mapping.
 */

import { ExecutionContext } from "@nestjs/common";
import { CommandBus, QueryBus } from "@nestjs/cqrs";
import { Test, TestingModule } from "@nestjs/testing";

import { PaginatedResult } from "@/common/dto/paginated-result.dto";
import { SupabaseJwtGuard } from "@/modules/auth/guards/supabase-jwt.guard";

import { JobProfileDto } from "../../../application/dto/job-profile.dto";
import { GetJobProfileQuery } from "../../../application/queries/impl/get-job-profile.query";
import { SearchJobProfilesQuery } from "../../../application/queries/impl/search-job-profiles.query";
import { JobProfileSearchDto } from "../dto/job-profile-search.dto";
import { JobProfileListItemDto } from "../dto/list-job-profiles-response.dto";
import { JobProfilesController } from "./job-profiles.controller";

describe("JobProfilesController", () => {
  let controller: JobProfilesController;
  let queryBus: jest.Mocked<QueryBus>;
  let commandBus: jest.Mocked<CommandBus>;

  beforeEach(async () => {
    const mockQueryBus = {
      execute: jest.fn(),
    };

    const mockCommandBus = {
      execute: jest.fn(),
    };

    // Mock the guard to bypass authentication in unit tests
    const mockGuard = {
      canActivate: jest.fn((context: ExecutionContext) => {
        const request = context.switchToHttp().getRequest();
        request.user = {
          id: "test-user-id",
          email: "test@example.com",
        };
        return true;
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [JobProfilesController],
      providers: [
        {
          provide: QueryBus,
          useValue: mockQueryBus,
        },
        {
          provide: CommandBus,
          useValue: mockCommandBus,
        },
      ],
    })
      .overrideGuard(SupabaseJwtGuard)
      .useValue(mockGuard)
      .compile();

    controller = module.get<JobProfilesController>(JobProfilesController);
    queryBus = module.get(QueryBus);
    commandBus = module.get(CommandBus);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("search", () => {
    it("should return paginated list of job profiles with default parameters", async () => {
      // Arrange
      const user = { id: "user-123" };
      const searchDto: JobProfileSearchDto = {
        page: 1,
        limit: 10,
      };

      const mockResult: PaginatedResult<JobProfileListItemDto> = {
        items: [
          {
            id: "profile-1",
            userId: "user-123",
            jobTitle: "Senior Engineer",
            companyName: "Tech Corp",
            seniorityLevel: 7,
            interviewDifficultyLevel: 8,
            createdAt: new Date("2026-01-27T10:00:00Z"),
            updatedAt: new Date("2026-01-27T10:00:00Z"),
          },
        ],
        nextPage: null,
        prevPage: null,
        totalItems: 1,
        totalPages: 1,
        page: 1,
        limit: 10,
        filters: {},
        sort: { field: "createdAt", direction: "desc" },
      };

      queryBus.execute.mockResolvedValue(mockResult);

      // Act
      const result = await controller.search(searchDto, user);

      // Assert
      expect(queryBus.execute).toHaveBeenCalledWith(
        expect.any(SearchJobProfilesQuery),
      );
      expect(result.success).toBe(true);
      expect(result.data.items).toHaveLength(1);
      expect(result.data.totalItems).toBe(1);
      expect(result.data.query.page).toBe(1);
      expect(result.data.query.limit).toBe(10);
    });

    it("should pass pagination parameters to query", async () => {
      // Arrange
      const user = { id: "user-456" };
      const searchDto: JobProfileSearchDto = {
        page: 2,
        limit: 5,
      };

      const mockResult: PaginatedResult<JobProfileListItemDto> = {
        items: [],
        nextPage: null,
        prevPage: 1,
        totalItems: 0,
        totalPages: 0,
        page: 2,
        limit: 5,
        filters: {},
        sort: { field: "createdAt", direction: "desc" },
      };

      queryBus.execute.mockResolvedValue(mockResult);

      // Act
      await controller.search(searchDto, user);

      // Assert
      const executedQuery = queryBus.execute.mock
        .calls[0][0] as SearchJobProfilesQuery;
      expect(executedQuery.userId).toBe("user-456");
      expect(executedQuery.page).toBe(2);
      expect(executedQuery.limit).toBe(5);
    });

    it("should pass job title filter to query", async () => {
      // Arrange
      const user = { id: "user-789" };
      const searchDto: JobProfileSearchDto = {
        page: 1,
        limit: 10,
        jobTitle: "Senior",
      };

      const mockResult: PaginatedResult<JobProfileListItemDto> = {
        items: [],
        nextPage: null,
        prevPage: null,
        totalItems: 0,
        totalPages: 0,
        page: 1,
        limit: 10,
        filters: { jobTitle: "Senior" },
        sort: { field: "createdAt", direction: "desc" },
      };

      queryBus.execute.mockResolvedValue(mockResult);

      // Act
      await controller.search(searchDto, user);

      // Assert
      const executedQuery = queryBus.execute.mock
        .calls[0][0] as SearchJobProfilesQuery;
      expect(executedQuery.jobTitle).toBe("Senior");
    });

    it("should parse and pass sort parameter to query", async () => {
      // Arrange
      const user = { id: "user-sort" };
      const searchDto: JobProfileSearchDto = {
        page: 1,
        limit: 10,
        sort: "jobTitle:asc",
      };

      const mockResult: PaginatedResult<JobProfileListItemDto> = {
        items: [],
        nextPage: null,
        prevPage: null,
        totalItems: 0,
        totalPages: 0,
        page: 1,
        limit: 10,
        filters: {},
        sort: { field: "jobTitle", direction: "asc" },
      };

      queryBus.execute.mockResolvedValue(mockResult);

      // Act
      await controller.search(searchDto, user);

      // Assert
      const executedQuery = queryBus.execute.mock
        .calls[0][0] as SearchJobProfilesQuery;
      expect(executedQuery.sort).toEqual({
        field: "jobTitle",
        direction: "asc",
      });
    });

    it("should handle sort parameter without direction (default to asc)", async () => {
      // Arrange
      const user = { id: "user-sort-default" };
      const searchDto: JobProfileSearchDto = {
        page: 1,
        limit: 10,
        sort: "companyName",
      };

      const mockResult: PaginatedResult<JobProfileListItemDto> = {
        items: [],
        nextPage: null,
        prevPage: null,
        totalItems: 0,
        totalPages: 0,
        page: 1,
        limit: 10,
        filters: {},
        sort: { field: "companyName", direction: "asc" },
      };

      queryBus.execute.mockResolvedValue(mockResult);

      // Act
      await controller.search(searchDto, user);

      // Assert
      const executedQuery = queryBus.execute.mock
        .calls[0][0] as SearchJobProfilesQuery;
      expect(executedQuery.sort?.direction).toBe("asc");
    });

    it("should return empty list when user has no profiles", async () => {
      // Arrange
      const user = { id: "user-empty" };
      const searchDto: JobProfileSearchDto = {
        page: 1,
        limit: 10,
      };

      const mockResult: PaginatedResult<JobProfileListItemDto> = {
        items: [],
        nextPage: null,
        prevPage: null,
        totalItems: 0,
        totalPages: 0,
        page: 1,
        limit: 10,
        filters: {},
        sort: { field: "createdAt", direction: "desc" },
      };

      queryBus.execute.mockResolvedValue(mockResult);

      // Act
      const result = await controller.search(searchDto, user);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data.items).toHaveLength(0);
      expect(result.data.totalItems).toBe(0);
    });

    it("should include pagination metadata in response", async () => {
      // Arrange
      const user = { id: "user-pagination" };
      const searchDto: JobProfileSearchDto = {
        page: 2,
        limit: 10,
      };

      const mockResult: PaginatedResult<JobProfileListItemDto> = {
        items: [],
        nextPage: 3,
        prevPage: 1,
        totalItems: 47,
        totalPages: 5,
        page: 2,
        limit: 10,
        filters: {},
        sort: { field: "createdAt", direction: "desc" },
      };

      queryBus.execute.mockResolvedValue(mockResult);

      // Act
      const result = await controller.search(searchDto, user);

      // Assert
      expect(result.data.nextPage).toBe(3);
      expect(result.data.prevPage).toBe(1);
      expect(result.data.totalItems).toBe(47);
      expect(result.data.totalPages).toBe(5);
    });

    it("should include query echo in response", async () => {
      // Arrange
      const user = { id: "user-echo" };
      const searchDto: JobProfileSearchDto = {
        page: 1,
        limit: 10,
        jobTitle: "Senior",
        sort: "createdAt:desc",
      };

      const mockResult: PaginatedResult<JobProfileListItemDto> = {
        items: [],
        nextPage: null,
        prevPage: null,
        totalItems: 0,
        totalPages: 0,
        page: 1,
        limit: 10,
        filters: { jobTitle: "Senior" },
        sort: { field: "createdAt", direction: "desc" },
      };

      queryBus.execute.mockResolvedValue(mockResult);

      // Act
      const result = await controller.search(searchDto, user);

      // Assert
      expect(result.data.query.page).toBe(1);
      expect(result.data.query.limit).toBe(10);
      expect(result.data.query.filters).toEqual({ jobTitle: "Senior" });
      expect(result.data.query.sort).toEqual({
        field: "createdAt",
        direction: "desc",
      });
    });

    it("should handle query bus errors", async () => {
      // Arrange
      const user = { id: "user-error" };
      const searchDto: JobProfileSearchDto = {
        page: 1,
        limit: 10,
      };
      const error = new Error("Database error");
      queryBus.execute.mockRejectedValue(error);

      // Act & Assert
      await expect(controller.search(searchDto, user)).rejects.toThrow(
        "Database error",
      );
    });

    it("should map all profile fields correctly", async () => {
      // Arrange
      const user = { id: "user-mapping" };
      const searchDto: JobProfileSearchDto = {
        page: 1,
        limit: 10,
      };

      const mockResult: PaginatedResult<JobProfileListItemDto> = {
        items: [
          {
            id: "profile-full",
            userId: "user-mapping",
            jobTitle: "Full Stack Developer",
            companyName: "Acme Inc",
            seniorityLevel: 6,
            interviewDifficultyLevel: 7,
            createdAt: new Date("2026-01-27T10:00:00Z"),
            updatedAt: new Date("2026-01-28T15:30:00Z"),
          },
        ],
        nextPage: null,
        prevPage: null,
        totalItems: 1,
        totalPages: 1,
        page: 1,
        limit: 10,
        filters: {},
        sort: { field: "createdAt", direction: "desc" },
      };

      queryBus.execute.mockResolvedValue(mockResult);

      // Act
      const result = await controller.search(searchDto, user);

      // Assert
      const item = result.data.items[0];
      expect(item.id).toBe("profile-full");
      expect(item.userId).toBe("user-mapping");
      expect(item.jobTitle).toBe("Full Stack Developer");
      expect(item.companyName).toBe("Acme Inc");
      expect(item.seniorityLevel).toBe(6);
      expect(item.interviewDifficultyLevel).toBe(7);
      expect(item.createdAt).toEqual(new Date("2026-01-27T10:00:00Z"));
      expect(item.updatedAt).toEqual(new Date("2026-01-28T15:30:00Z"));
    });
  });

  describe("getById", () => {
    it("should return job profile by id", async () => {
      // Arrange
      const user = { id: "user-123", email: "test@example.com" };
      const jobProfileId = "profile-456";

      const mockJobProfileDto: JobProfileDto = {
        id: jobProfileId,
        userId: "user-123",
        jobTitle: "Senior Engineer",
        companyName: "Tech Corp",
        jobUrl: undefined,
        rawJD: "Job description",
        competencies: [{ name: "Programming", weight: 1, depth: 5 }],
        hardSkills: ["TypeScript"],
        softSkills: ["Communication"],
        seniorityLevel: 7,
        interviewDifficultyLevel: 8,
        createdAt: new Date("2026-01-27T10:00:00Z"),
        updatedAt: new Date("2026-01-27T10:00:00Z"),
      };

      queryBus.execute.mockResolvedValue(mockJobProfileDto);

      // Act
      const result = await controller.getById(jobProfileId, user);

      // Assert
      expect(queryBus.execute).toHaveBeenCalledWith(
        expect.any(GetJobProfileQuery),
      );
      expect(result.id).toBe(jobProfileId);
      expect(result.userId).toBe("user-123");
    });
  });

  describe("parse", () => {
    it("should parse job description", async () => {
      // This test is minimal as parse endpoint is not the focus of Step 4
      const user = {
        id: "user-123",
        email: "test@example.com",
        identityId: "identity-123",
      };
      const parseDto = {
        rawJD: "Job description",
      };

      const mockJobProfileDto: JobProfileDto = {
        id: "new-profile",
        userId: "user-123",
        jobTitle: undefined,
        companyName: undefined,
        jobUrl: undefined,
        rawJD: "Job description",
        competencies: [],
        hardSkills: [],
        softSkills: [],
        seniorityLevel: undefined,
        interviewDifficultyLevel: undefined,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      commandBus.execute.mockResolvedValue(mockJobProfileDto);

      const result = await controller.parse(parseDto, user);

      expect(result.id).toBe("new-profile");
    });
  });
});
