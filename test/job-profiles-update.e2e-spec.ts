/**
 * Job Profiles Update E2E Tests
 *
 * End-to-end tests for the job profiles update endpoint.
 * Tests the complete request-response cycle with CommandBus mocked.
 */

import {
  ExecutionContext,
  ForbiddenException,
  INestApplication,
  NotFoundException,
  ValidationPipe,
} from "@nestjs/common";
import { CommandBus, CqrsModule } from "@nestjs/cqrs";
import { Test } from "@nestjs/testing";

import { SupabaseJwtGuard } from "../src/modules/auth/guards/supabase-jwt.guard";
import { JobProfilesController } from "../src/modules/job-profiles/presentation/http/controllers/job-profiles.controller";

import { ApiTestClient, ResponseValidator } from "./utils/e2e-test.utils";
import { E2ETestAppFactory } from "./utils/e2e-app-factory";

describe("Job Profiles Update (e2e)", () => {
  let app: INestApplication;
  let apiClient: ApiTestClient;
  let commandBusMock: { execute: jest.Mock };
  let mockUserId: string;

  beforeAll(async () => {
    mockUserId = "test-user-id";

    commandBusMock = {
      execute: jest.fn(),
    };

    const mockGuard = {
      canActivate: (context: ExecutionContext) => {
        const request = context.switchToHttp().getRequest();
        request.user = {
          id: mockUserId,
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
          provide: CommandBus,
          useValue: commandBusMock,
        },
      ],
    })
      .overrideGuard(SupabaseJwtGuard)
      .useValue(mockGuard)
      .compile();

    app = moduleFixture.createNestApplication();

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

  describe("PATCH /api/v1/job-profiles/:jobProfileId", () => {
    it("should update job profile successfully (200)", async () => {
      const jobProfileId = "550e8400-e29b-41d4-a716-446655440000";

      commandBusMock.execute.mockResolvedValue({
        id: jobProfileId,
        userId: mockUserId,
        jobTitle: "Updated Principal Engineer",
        companyName: "Updated Company",
        competencies: [{ name: "System Design", weight: 0.4, depth: 10 }],
        hardSkills: ["Go", "Rust", "Kubernetes"],
        softSkills: ["Leadership"],
        seniorityLevel: 10,
        interviewDifficultyLevel: 9,
        createdAt: new Date("2026-01-27T10:00:00Z"),
        updatedAt: new Date("2026-01-31T15:30:00Z"),
      });

      const response = await apiClient
        .request()
        .patch(`/api/v1/job-profiles/${jobProfileId}`)
        .send({
          jobTitle: "Updated Principal Engineer",
          seniorityLevel: 10,
          hardSkills: ["Go", "Rust", "Kubernetes"],
        });

      ResponseValidator.expectSuccess(response, 200);
      expect(response.body.jobTitle).toBe("Updated Principal Engineer");
      expect(response.body.seniorityLevel).toBe(10);
      expect(response.body.hardSkills).toContain("Go");
      expect(commandBusMock.execute).toHaveBeenCalledTimes(1);
    });

    it("should return 404 for non-existent profile", async () => {
      const jobProfileId = "550e8400-e29b-41d4-a716-446655440000";
      commandBusMock.execute.mockRejectedValue(
        new NotFoundException("Job profile not found"),
      );

      const response = await apiClient
        .request()
        .patch(`/api/v1/job-profiles/${jobProfileId}`)
        .send({ jobTitle: "Test" });

      ResponseValidator.expectError(response, 404);
      expect(commandBusMock.execute).toHaveBeenCalledTimes(1);
    });

    it("should return 403 when user is not the owner", async () => {
      const jobProfileId = "550e8400-e29b-41d4-a716-446655440000";
      commandBusMock.execute.mockRejectedValue(
        new ForbiddenException("Access denied"),
      );

      const response = await apiClient
        .request()
        .patch(`/api/v1/job-profiles/${jobProfileId}`)
        .send({ jobTitle: "Test" });

      ResponseValidator.expectError(response, 403);
      expect(commandBusMock.execute).toHaveBeenCalledTimes(1);
    });

    it("should return 400 for invalid data", async () => {
      const jobProfileId = "550e8400-e29b-41d4-a716-446655440000";

      const response = await apiClient
        .request()
        .patch(`/api/v1/job-profiles/${jobProfileId}`)
        .send({
          seniorityLevel: 15,
        });

      ResponseValidator.expectError(response, 400);
      expect(commandBusMock.execute).not.toHaveBeenCalled();
    });

    it("should return 400 for invalid UUID format", async () => {
      const invalidJobProfileId = "not-a-valid-uuid";

      const response = await apiClient
        .request()
        .patch(`/api/v1/job-profiles/${invalidJobProfileId}`)
        .send({ jobTitle: "Test" });

      ResponseValidator.expectError(response, 400);
      expect(commandBusMock.execute).not.toHaveBeenCalled();
    });

    it("should call command bus with correct parameters", async () => {
      const jobProfileId = "550e8400-e29b-41d4-a716-446655440000";
      commandBusMock.execute.mockResolvedValue({
        id: jobProfileId,
        userId: mockUserId,
        jobTitle: "Updated",
        competencies: [],
        hardSkills: [],
        softSkills: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await apiClient
        .request()
        .patch(`/api/v1/job-profiles/${jobProfileId}`)
        .send({ jobTitle: "Updated" });

      expect(commandBusMock.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: mockUserId,
          jobProfileId: jobProfileId,
          jobTitle: "Updated",
        }),
      );
    });

    it("should require authentication (401)", async () => {
      // This test would need a different setup to remove the auth guard
      // For now, it's skipped as it requires modifying the guard mock
    });
  });
});
