import { Test, TestingModule } from "@nestjs/testing";
import { BadRequestException } from "@nestjs/common";
import { ParseJobDescriptionHandler } from "./parse-job-description.handler";
import { ParseJobDescriptionCommand } from "../impl/parse-job-description.command";
import {
  IJobProfileRepository,
  JOB_PROFILE_REPOSITORY,
} from "../../../domain/repositories/job-profile.repository.interface";
import { HtmlFetcherService } from "../../../infrastructure/services/html-fetcher.service";
import { JdExtractorService } from "../../../infrastructure/services/jd-extractor.service";
import { AiParserService } from "../../../infrastructure/services/ai-parser.service";
import { JobProfile } from "../../../domain/entities/job-profile.entity";

describe("ParseJobDescriptionHandler", () => {
  let handler: ParseJobDescriptionHandler;
  let mockRepository: jest.Mocked<IJobProfileRepository>;
  let mockHtmlFetcher: jest.Mocked<HtmlFetcherService>;
  let mockJdExtractor: jest.Mocked<JdExtractorService>;
  let mockAiParser: jest.Mocked<AiParserService>;

  beforeEach(async () => {
    // Mock repository
    mockRepository = {
      save: jest.fn(),
      findById: jest.fn(),
      findByUserId: jest.fn(),
      countByUserId: jest.fn(),
      softDelete: jest.fn(),
      restore: jest.fn(),
      search: jest.fn(),
      countWithFilters: jest.fn(),
    };

    // Mock HTML fetcher
    mockHtmlFetcher = {
      fetchHtml: jest.fn(),
    } as any;

    // Mock JD extractor
    mockJdExtractor = {
      extractTextFromHtml: jest.fn(),
      normalizeRawJD: jest.fn(),
    } as any;

    // Mock AI parser
    mockAiParser = {
      parseJobDescription: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ParseJobDescriptionHandler,
        {
          provide: JOB_PROFILE_REPOSITORY,
          useValue: mockRepository,
        },
        {
          provide: HtmlFetcherService,
          useValue: mockHtmlFetcher,
        },
        {
          provide: JdExtractorService,
          useValue: mockJdExtractor,
        },
        {
          provide: AiParserService,
          useValue: mockAiParser,
        },
      ],
    }).compile();

    handler = module.get<ParseJobDescriptionHandler>(
      ParseJobDescriptionHandler,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("execute", () => {
    it("should throw error when neither jobUrl nor rawJD is provided", async () => {
      const command = new ParseJobDescriptionCommand("user-123");

      await expect(handler.execute(command)).rejects.toThrow(
        BadRequestException,
      );
      await expect(handler.execute(command)).rejects.toThrow(
        "Either jobUrl or rawJD must be provided",
      );
    });

    describe("with rawJD", () => {
      it("should parse job description from raw JD", async () => {
        const command = new ParseJobDescriptionCommand(
          "user-123",
          undefined,
          "We are looking for a senior engineer with 5+ years of experience...",
          "Senior Engineer",
          7,
        );

        const normalizedText =
          "We are looking for a senior engineer with 5+ years of experience...";
        const parsedData = {
          job_title: "Senior Software Engineer",
          company_name: "Tech Corp",
          seniority_level: 7,
          competencies: [
            { name: "System Design", weight: 0.4, depth: 8 },
            { name: "Programming", weight: 0.6, depth: 7 },
          ],
          hard_skills: ["TypeScript", "Node.js", "NestJS"],
          soft_skills: ["Communication", "Leadership"],
          interview_difficulty_level: 8,
        };

        mockJdExtractor.normalizeRawJD.mockReturnValue(normalizedText);
        mockAiParser.parseJobDescription.mockResolvedValue(parsedData);
        mockRepository.save.mockResolvedValue(undefined);

        const result = await handler.execute(command);

        expect(mockJdExtractor.normalizeRawJD).toHaveBeenCalledWith(
          command.rawJD,
        );
        expect(mockAiParser.parseJobDescription).toHaveBeenCalledWith(
          normalizedText,
        );
        expect(mockRepository.save).toHaveBeenCalledWith(
          expect.any(JobProfile),
        );

        expect(result.jobTitle).toBe("Senior Software Engineer");
        expect(result.companyName).toBe("Tech Corp");
        expect(result.seniorityLevel).toBe(7);
        expect(result.competencies).toHaveLength(2);
        expect(result.hardSkills).toEqual(["TypeScript", "Node.js", "NestJS"]);
        expect(result.softSkills).toEqual(["Communication", "Leadership"]);
        expect(result.interviewDifficultyLevel).toBe(8);
      });

      it("should use normalized text for AI parsing", async () => {
        const command = new ParseJobDescriptionCommand(
          "user-123",
          undefined,
          "   Job    description   with   spaces   ",
        );

        const normalizedText = "Job description with spaces";
        mockJdExtractor.normalizeRawJD.mockReturnValue(normalizedText);
        mockAiParser.parseJobDescription.mockResolvedValue({
          job_title: "Engineer",
          seniority_level: 5,
          competencies: [{ name: "Test", weight: 1, depth: 5 }],
          hard_skills: [],
          soft_skills: [],
          interview_difficulty_level: 5,
        });

        await handler.execute(command);

        expect(mockAiParser.parseJobDescription).toHaveBeenCalledWith(
          normalizedText,
        );
      });
    });

    describe("with jobUrl", () => {
      it("should fetch and parse job description from URL", async () => {
        const command = new ParseJobDescriptionCommand(
          "user-123",
          "https://example.com/job",
        );

        const mockHtml = "<html><body>Job description here</body></html>";
        const extractedText = "Job description here";
        const parsedData = {
          job_title: "Backend Engineer",
          company_name: "Example Corp",
          seniority_level: 5,
          competencies: [{ name: "API Development", weight: 1, depth: 6 }],
          hard_skills: ["Node.js"],
          soft_skills: ["Teamwork"],
          interview_difficulty_level: 6,
        };

        mockHtmlFetcher.fetchHtml.mockResolvedValue(mockHtml);
        mockJdExtractor.extractTextFromHtml.mockReturnValue(extractedText);
        mockAiParser.parseJobDescription.mockResolvedValue(parsedData);
        mockRepository.save.mockResolvedValue(undefined);

        const result = await handler.execute(command);

        expect(mockHtmlFetcher.fetchHtml).toHaveBeenCalledWith(command.jobUrl);
        expect(mockJdExtractor.extractTextFromHtml).toHaveBeenCalledWith(
          mockHtml,
        );
        expect(mockAiParser.parseJobDescription).toHaveBeenCalledWith(
          extractedText,
        );

        expect(result.jobTitle).toBe("Backend Engineer");
        expect(result.companyName).toBe("Example Corp");
        expect(result.jobUrl).toBe("https://example.com/job");
      });

      it("should propagate error when HTML fetch fails", async () => {
        const command = new ParseJobDescriptionCommand(
          "user-123",
          "https://example.com/job",
        );

        mockHtmlFetcher.fetchHtml.mockRejectedValue(
          new Error("Failed to fetch URL"),
        );

        await expect(handler.execute(command)).rejects.toThrow(
          "Failed to fetch URL",
        );
      });
    });

    describe("AI parsing", () => {
      it("should propagate error when AI parsing fails", async () => {
        const command = new ParseJobDescriptionCommand(
          "user-123",
          undefined,
          "Raw job description",
        );

        mockJdExtractor.normalizeRawJD.mockReturnValue("Raw job description");
        mockAiParser.parseJobDescription.mockRejectedValue(
          new Error("AI parsing failed"),
        );

        await expect(handler.execute(command)).rejects.toThrow(
          "AI parsing failed",
        );
      });
    });

    describe("persistence", () => {
      it("should save job profile to repository", async () => {
        const command = new ParseJobDescriptionCommand(
          "user-123",
          undefined,
          "Job description",
        );

        mockJdExtractor.normalizeRawJD.mockReturnValue("Job description");
        mockAiParser.parseJobDescription.mockResolvedValue({
          job_title: "Engineer",
          seniority_level: 5,
          competencies: [{ name: "Coding", weight: 1, depth: 5 }],
          hard_skills: ["Python"],
          soft_skills: ["Communication"],
          interview_difficulty_level: 5,
        });
        mockRepository.save.mockResolvedValue(undefined);

        await handler.execute(command);

        expect(mockRepository.save).toHaveBeenCalledTimes(1);
        expect(mockRepository.save).toHaveBeenCalledWith(
          expect.objectContaining({
            getUserId: expect.any(Function),
            getJobTitle: expect.any(Function),
          }),
        );
      });

      it("should propagate error when save fails", async () => {
        const command = new ParseJobDescriptionCommand(
          "user-123",
          undefined,
          "Job description",
        );

        mockJdExtractor.normalizeRawJD.mockReturnValue("Job description");
        mockAiParser.parseJobDescription.mockResolvedValue({
          job_title: "Engineer",
          seniority_level: 5,
          competencies: [{ name: "Coding", weight: 1, depth: 5 }],
          hard_skills: [],
          soft_skills: [],
          interview_difficulty_level: 5,
        });
        mockRepository.save.mockRejectedValue(new Error("Database error"));

        await expect(handler.execute(command)).rejects.toThrow(
          "Database error",
        );
      });
    });

    describe("result mapping", () => {
      it("should return JobProfileDto with all fields", async () => {
        const command = new ParseJobDescriptionCommand(
          "user-123",
          undefined,
          "Job description",
          "Initial Title",
          6,
        );

        mockJdExtractor.normalizeRawJD.mockReturnValue("Job description");
        mockAiParser.parseJobDescription.mockResolvedValue({
          job_title: "Parsed Title",
          company_name: "Company Name",
          seniority_level: 7,
          competencies: [
            { name: "Skill A", weight: 0.5, depth: 8 },
            { name: "Skill B", weight: 0.5, depth: 6 },
          ],
          hard_skills: ["TypeScript", "PostgreSQL"],
          soft_skills: ["Leadership", "Mentoring"],
          interview_difficulty_level: 8,
        });
        mockRepository.save.mockResolvedValue(undefined);

        const result = await handler.execute(command);

        expect(result).toEqual({
          id: expect.any(String),
          userId: "user-123",
          jobTitle: "Parsed Title",
          companyName: "Company Name",
          jobUrl: undefined,
          rawJD: "Job description",
          competencies: [
            { name: "Skill A", weight: 0.5, depth: 8 },
            { name: "Skill B", weight: 0.5, depth: 6 },
          ],
          softSkills: ["Leadership", "Mentoring"],
          hardSkills: ["TypeScript", "PostgreSQL"],
          seniorityLevel: 7,
          interviewDifficultyLevel: 8,
          createdAt: expect.any(Date),
          updatedAt: expect.any(Date),
        });
      });
    });
  });
});
