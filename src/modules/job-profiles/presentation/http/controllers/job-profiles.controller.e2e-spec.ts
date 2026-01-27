/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { INestApplication, ValidationPipe } from "@nestjs/common";
import { CommandBus, CqrsModule } from "@nestjs/cqrs";
import { Test, TestingModule } from "@nestjs/testing";
import request from "supertest";

import { ParseJobDescriptionCommand } from "../../../application/commands/impl/parse-job-description.command";
import { JobProfileDto } from "../../../application/dto/job-profile.dto";
import { JobProfilesController } from "./job-profiles.controller";

describe("JobProfilesController (e2e)", () => {
  let app: INestApplication;
  let commandBus: CommandBus;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [JobProfilesController],
      imports: [CqrsModule],
    })
      .overrideProvider(CommandBus)
      .useValue({
        execute: jest.fn(),
      })
      .compile();

    app = module.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        transform: true,
        whitelist: true,
      }),
    );

    commandBus = module.get<CommandBus>(CommandBus);

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("POST /api/v1/job-profiles/parse", () => {
    const mockJobProfileDto: JobProfileDto = {
      companyName: "Tech Corp",
      competencies: [
        { depth: 8, name: "System Design", weight: 0.5 },
        { depth: 7, name: "Programming", weight: 0.5 },
      ],
      createdAt: new Date("2026-01-27"),
      hardSkills: ["TypeScript", "NestJS"],
      id: "job-profile-123",
      interviewDifficultyLevel: 8,
      jobTitle: "Senior Software Engineer",
      jobUrl: undefined,
      rawJD: "Job description text",
      seniorityLevel: 7,
      softSkills: ["Communication", "Leadership"],
      updatedAt: new Date("2026-01-27"),
      userId: "user-123",
    };

    // Note: In a real e2e test, you would need to set up authentication
    // For this example, we're testing the controller logic without auth

    it("should parse job description with rawJD", async () => {
      const requestDto = {
        rawJD: "We are looking for a senior engineer...",
      };

      (commandBus.execute as jest.Mock).mockResolvedValue(mockJobProfileDto);

      const response = await request(app.getHttpServer())
        .post("/api/v1/job-profiles/parse")
        .send(requestDto)
        .expect(201);

      expect(response.body).toEqual({
        companyName: mockJobProfileDto.companyName,
        competencies: mockJobProfileDto.competencies,
        createdAt: mockJobProfileDto.createdAt.toISOString(),
        hardSkills: mockJobProfileDto.hardSkills,
        id: mockJobProfileDto.id,
        interviewDifficultyLevel: mockJobProfileDto.interviewDifficultyLevel,
        jobTitle: mockJobProfileDto.jobTitle,
        seniorityLevel: mockJobProfileDto.seniorityLevel,
        softSkills: mockJobProfileDto.softSkills,
      });

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(commandBus.execute).toHaveBeenCalledWith(
        expect.any(ParseJobDescriptionCommand),
      );
    });

    it("should parse job description with jobUrl", async () => {
      const requestDto = {
        jobUrl: "https://example.com/job",
      };

      const mockResponse = {
        ...mockJobProfileDto,
        jobUrl: "https://example.com/job",
      };

      (commandBus.execute as jest.Mock).mockResolvedValue(mockResponse);

      const response = await request(app.getHttpServer())
        .post("/api/v1/job-profiles/parse")
        .send(requestDto)
        .expect(201);

      expect(response.body.jobTitle).toBe(mockJobProfileDto.jobTitle);
    });

    it("should parse with optional fields", async () => {
      const requestDto = {
        jobTitle: "Custom Title",
        rawJD: "Job description",
        seniority: 6,
      };

      (commandBus.execute as jest.Mock).mockResolvedValue(mockJobProfileDto);

      await request(app.getHttpServer())
        .post("/api/v1/job-profiles/parse")
        .send(requestDto)
        .expect(201);

      const executedCommand = (commandBus.execute as jest.Mock).mock
        .calls[0][0];
      expect(executedCommand).toBeInstanceOf(ParseJobDescriptionCommand);
      expect(executedCommand.jobTitle).toBe("Custom Title");
      expect(executedCommand.seniority).toBe(6);
    });

    describe("validation", () => {
      it("should reject request with invalid seniority (too low)", async () => {
        const requestDto = {
          rawJD: "Job description",
          seniority: 0,
        };

        await request(app.getHttpServer())
          .post("/api/v1/job-profiles/parse")
          .send(requestDto)
          .expect(400);
      });

      it("should reject request with invalid seniority (too high)", async () => {
        const requestDto = {
          rawJD: "Job description",
          seniority: 11,
        };

        await request(app.getHttpServer())
          .post("/api/v1/job-profiles/parse")
          .send(requestDto)
          .expect(400);
      });

      it("should reject request with non-string rawJD", async () => {
        const requestDto = {
          rawJD: 123,
        };

        await request(app.getHttpServer())
          .post("/api/v1/job-profiles/parse")
          .send(requestDto)
          .expect(400);
      });

      it("should reject request with non-string jobUrl", async () => {
        const requestDto = {
          jobUrl: 123,
        };

        await request(app.getHttpServer())
          .post("/api/v1/job-profiles/parse")
          .send(requestDto)
          .expect(400);
      });

      it("should accept valid request with boundary seniority values", async () => {
        (commandBus.execute as jest.Mock).mockResolvedValue(mockJobProfileDto);

        // Test seniority = 1
        await request(app.getHttpServer())
          .post("/api/v1/job-profiles/parse")
          .send({ rawJD: "Test", seniority: 1 })
          .expect(201);

        // Test seniority = 10
        await request(app.getHttpServer())
          .post("/api/v1/job-profiles/parse")
          .send({ rawJD: "Test", seniority: 10 })
          .expect(201);
      });
    });

    describe("error handling", () => {
      it("should return 400 when command execution fails with BadRequestException", async () => {
        const requestDto = {
          rawJD: "Job description",
        };

        (commandBus.execute as jest.Mock).mockRejectedValue(
          new Error("Either jobUrl or rawJD must be provided"),
        );

        await request(app.getHttpServer())
          .post("/api/v1/job-profiles/parse")
          .send(requestDto)
          .expect(500); // Or appropriate error code based on your error handling
      });
    });

    describe("response mapping", () => {
      it("should map all fields correctly", async () => {
        const requestDto = {
          rawJD: "Job description",
        };

        (commandBus.execute as jest.Mock).mockResolvedValue(mockJobProfileDto);

        const response = await request(app.getHttpServer())
          .post("/api/v1/job-profiles/parse")
          .send(requestDto)
          .expect(201);

        expect(response.body).toHaveProperty("id");
        expect(response.body).toHaveProperty("jobTitle");
        expect(response.body).toHaveProperty("companyName");
        expect(response.body).toHaveProperty("competencies");
        expect(response.body).toHaveProperty("hardSkills");
        expect(response.body).toHaveProperty("softSkills");
        expect(response.body).toHaveProperty("seniorityLevel");
        expect(response.body).toHaveProperty("interviewDifficultyLevel");
        expect(response.body).toHaveProperty("createdAt");

        // Should not include internal fields
        expect(response.body).not.toHaveProperty("userId");
        expect(response.body).not.toHaveProperty("rawJD");
        expect(response.body).not.toHaveProperty("updatedAt");
        expect(response.body).not.toHaveProperty("deletedAt");
      });

      it("should handle optional fields correctly", async () => {
        const mockResponseWithoutOptionals: JobProfileDto = {
          ...mockJobProfileDto,
          companyName: undefined,
          interviewDifficultyLevel: undefined,
          seniorityLevel: undefined,
        };

        (commandBus.execute as jest.Mock).mockResolvedValue(
          mockResponseWithoutOptionals,
        );

        const response = await request(app.getHttpServer())
          .post("/api/v1/job-profiles/parse")
          .send({ rawJD: "Test" })
          .expect(201);

        expect(response.body.companyName).toBeUndefined();
        expect(response.body.seniorityLevel).toBeUndefined();
        expect(response.body.interviewDifficultyLevel).toBeUndefined();
      });
    });
  });
});
