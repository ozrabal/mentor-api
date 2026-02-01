/**
 * Job Profiles List E2E Tests
 *
 * End-to-end tests for the job profiles search/list endpoint.
 * Tests the complete request-response cycle with QueryBus mocked.
 */

import {
  ExecutionContext,
  INestApplication,
  ValidationPipe,
} from "@nestjs/common";
import { CqrsModule, QueryBus } from "@nestjs/cqrs";
import { Test } from "@nestjs/testing";

import { PaginatedResult } from "../src/common/dto/paginated-result.dto";
import { SupabaseJwtGuard } from "../src/modules/auth/guards/supabase-jwt.guard";
import { JobProfilesController } from "../src/modules/job-profiles/presentation/http/controllers/job-profiles.controller";
import { JobProfileListItemDto } from "../src/modules/job-profiles/presentation/http/dto/list-job-profiles-response.dto";

import { E2ETestAppFactory } from "./utils/e2e-app-factory";
import { ApiTestClient, ResponseValidator } from "./utils/e2e-test.utils";

describe("Job Profiles List (e2e)", () => {
  let app: INestApplication;
  let apiClient: ApiTestClient;
  let queryBusMock: { execute: jest.Mock };

  beforeAll(async () => {
    queryBusMock = {
      execute: jest.fn(),
    };

    // Mock the guard to bypass authentication in E2E tests
    const mockGuard = {
      canActivate: (context: ExecutionContext) => {
        const request = context.switchToHttp().getRequest();
        request.user = {
          id: "test-user-id",
          email: "test@example.com",
        };
        return true;
      },
    };

    const moduleFixture = await Test.createTestingModule({
      controllers: [JobProfilesController],
      imports: [CqrsModule],
      providers: [
        {
          provide: QueryBus,
          useValue: queryBusMock,
        },
      ],
    })
      .overrideGuard(SupabaseJwtGuard)
      .useValue(mockGuard)
      .compile();

    app = moduleFixture.createNestApplication();

    // Apply global validation pipe
    app.useGlobalPipes(
      new ValidationPipe({
        forbidNonWhitelisted: true,
        transform: true,
        whitelist: true,
      }),
    );

    await app.init();

    apiClient = new ApiTestClient(app);
  });

  afterAll(async () => {
    await E2ETestAppFactory.cleanup(app);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("GET /api/v1/job-profiles", () => {
    it("should return paginated list with default parameters", async () => {
      // Arrange
      const mockResult: PaginatedResult<JobProfileListItemDto> = {
        items: [
          {
            id: "profile-1",
            userId: "test-user-id",
            jobTitle: "Senior Software Engineer",
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

      queryBusMock.execute.mockResolvedValue(mockResult);

      // Act
      const response = await apiClient.get("/api/v1/job-profiles");

      // Assert
      const body = ResponseValidator.expectSuccess(response, 200);
      expect(body.success).toBe(true);
      expect(body.data.items).toHaveLength(1);
      expect(body.data.items[0].id).toBe("profile-1");
      expect(body.data.totalItems).toBe(1);
      expect(body.data.query.page).toBe(1);
      expect(body.data.query.limit).toBe(10);
      ResponseValidator.expectContentType(response, "json");
    });

    it("should respect page parameter", async () => {
      // Arrange
      const mockResult: PaginatedResult<JobProfileListItemDto> = {
        items: [],
        nextPage: 3,
        prevPage: 1,
        totalItems: 50,
        totalPages: 5,
        page: 2,
        limit: 10,
        filters: {},
        sort: { field: "createdAt", direction: "desc" },
      };

      queryBusMock.execute.mockResolvedValue(mockResult);

      // Act
      const response = await apiClient.get("/api/v1/job-profiles?page=2");

      // Assert
      const body = ResponseValidator.expectSuccess(response, 200);
      expect(body.data.query.page).toBe(2);
      expect(body.data.nextPage).toBe(3);
      expect(body.data.prevPage).toBe(1);
    });

    it("should respect limit parameter", async () => {
      // Arrange
      const mockResult: PaginatedResult<JobProfileListItemDto> = {
        items: [],
        nextPage: null,
        prevPage: null,
        totalItems: 5,
        totalPages: 1,
        page: 1,
        limit: 5,
        filters: {},
        sort: { field: "createdAt", direction: "desc" },
      };

      queryBusMock.execute.mockResolvedValue(mockResult);

      // Act
      const response = await apiClient.get("/api/v1/job-profiles?limit=5");

      // Assert
      const body = ResponseValidator.expectSuccess(response, 200);
      expect(body.data.query.limit).toBe(5);
    });

    it("should validate page parameter (minimum 1)", async () => {
      // Act
      const response = await apiClient.get("/api/v1/job-profiles?page=0");

      // Assert
      ResponseValidator.expectError(response, 400);
    });

    it("should validate limit parameter (maximum 100)", async () => {
      // Act
      const response = await apiClient.get("/api/v1/job-profiles?limit=101");

      // Assert
      ResponseValidator.expectError(response, 400);
    });

    it("should validate limit parameter (minimum 1)", async () => {
      // Act
      const response = await apiClient.get("/api/v1/job-profiles?limit=0");

      // Assert
      ResponseValidator.expectError(response, 400);
    });

    it("should filter by job title", async () => {
      // Arrange
      const mockResult: PaginatedResult<JobProfileListItemDto> = {
        items: [
          {
            id: "profile-senior",
            userId: "test-user-id",
            jobTitle: "Senior Backend Engineer",
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
        filters: { jobTitle: "Senior" },
        sort: { field: "createdAt", direction: "desc" },
      };

      queryBusMock.execute.mockResolvedValue(mockResult);

      // Act
      const response = await apiClient.get(
        "/api/v1/job-profiles?jobTitle=Senior",
      );

      // Assert
      const body = ResponseValidator.expectSuccess(response, 200);
      expect(body.data.query.filters.jobTitle).toBe("Senior");
      expect(body.data.items[0].jobTitle).toContain("Senior");
    });

    it("should sort by field and direction", async () => {
      // Arrange
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

      queryBusMock.execute.mockResolvedValue(mockResult);

      // Act
      const response = await apiClient.get(
        "/api/v1/job-profiles?sort=jobTitle:asc",
      );

      // Assert
      const body = ResponseValidator.expectSuccess(response, 200);
      expect(body.data.query.sort.field).toBe("jobTitle");
      expect(body.data.query.sort.direction).toBe("asc");
    });

    it("should handle combination of filters, sorting, and pagination", async () => {
      // Arrange
      const mockResult: PaginatedResult<JobProfileListItemDto> = {
        items: [],
        nextPage: null,
        prevPage: null,
        totalItems: 5,
        totalPages: 1,
        page: 1,
        limit: 5,
        filters: { jobTitle: "Engineer" },
        sort: { field: "createdAt", direction: "desc" },
      };

      queryBusMock.execute.mockResolvedValue(mockResult);

      // Act
      const response = await apiClient.get(
        "/api/v1/job-profiles?page=1&limit=5&jobTitle=Engineer&sort=createdAt:desc",
      );

      // Assert
      const body = ResponseValidator.expectSuccess(response, 200);
      expect(body.data.query.page).toBe(1);
      expect(body.data.query.limit).toBe(5);
      expect(body.data.query.filters.jobTitle).toBe("Engineer");
      expect(body.data.query.sort.field).toBe("createdAt");
      expect(body.data.query.sort.direction).toBe("desc");
    });

    it("should return empty list when no profiles match", async () => {
      // Arrange
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

      queryBusMock.execute.mockResolvedValue(mockResult);

      // Act
      const response = await apiClient.get("/api/v1/job-profiles");

      // Assert
      const body = ResponseValidator.expectSuccess(response, 200);
      expect(body.success).toBe(true);
      expect(body.data.items).toHaveLength(0);
      expect(body.data.totalItems).toBe(0);
    });

    it("should include all profile fields in list items", async () => {
      // Arrange
      const mockResult: PaginatedResult<JobProfileListItemDto> = {
        items: [
          {
            id: "profile-complete",
            userId: "test-user-id",
            jobTitle: "Full Stack Developer",
            companyName: "Startup Inc",
            seniorityLevel: 5,
            interviewDifficultyLevel: 6,
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

      queryBusMock.execute.mockResolvedValue(mockResult);

      // Act
      const response = await apiClient.get("/api/v1/job-profiles");

      // Assert
      const body = ResponseValidator.expectSuccess(response, 200);
      const item = body.data.items[0];
      expect(item.id).toBe("profile-complete");
      expect(item.userId).toBe("test-user-id");
      expect(item.jobTitle).toBe("Full Stack Developer");
      expect(item.companyName).toBe("Startup Inc");
      expect(item.seniorityLevel).toBe(5);
      expect(item.interviewDifficultyLevel).toBe(6);
      expect(item.createdAt).toBeDefined();
      expect(item.updatedAt).toBeDefined();
    });

    it("should handle query bus errors with 500", async () => {
      // Arrange
      queryBusMock.execute.mockRejectedValue(new Error("Database error"));

      // Act
      const response = await apiClient.get("/api/v1/job-profiles");

      // Assert
      ResponseValidator.expectError(response, 500);
    });

    it("should transform query parameters correctly", async () => {
      // Arrange
      const mockResult: PaginatedResult<JobProfileListItemDto> = {
        items: [],
        nextPage: null,
        prevPage: 1,
        totalItems: 0,
        totalPages: 0,
        page: 2,
        limit: 20,
        filters: {},
        sort: { field: "createdAt", direction: "desc" },
      };

      queryBusMock.execute.mockResolvedValue(mockResult);

      // Act - send page and limit as strings (query params)
      const response = await apiClient.get(
        "/api/v1/job-profiles?page=2&limit=20",
      );

      // Assert - should be transformed to numbers
      const body = ResponseValidator.expectSuccess(response, 200);
      expect(typeof body.data.query.page).toBe("number");
      expect(typeof body.data.query.limit).toBe("number");
      expect(body.data.query.page).toBe(2);
      expect(body.data.query.limit).toBe(20);
    });
  });
});
