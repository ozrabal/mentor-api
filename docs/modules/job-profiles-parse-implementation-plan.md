# FR-JP-001: Parse Job Description - Implementation Plan

**Module:** `job-profiles`
**Feature:** Parse Job Description
**Version:** 1.0
**Date:** 2026-01-17
**Status:** Ready for Implementation

---

## Overview

This document provides a step-by-step implementation plan for the Parse Job Description feature (FR-JP-001). The implementation follows the modular monolith architecture with CQRS pattern and ensures the application functions correctly after each step.

### Key Implementation Notes

- **Soft Delete Pattern:** All entities support soft deletion via `deleted_at` timestamp
  - Domain entities include `isDeleted()`, `softDelete()`, and `restore()` methods
  - Repository queries exclude soft-deleted records by default
  - `includeDeleted` parameter available for special cases
- **CQRS Pattern:** Commands/Queries handled via `@nestjs/cqrs` CommandBus/QueryBus
- **Clean Architecture:** Clear layer separation with explicit mapping at boundaries
- **Type Safety:** Drizzle ORM for type-safe database operations

---

## Architecture Context

### Module Structure

```txt
src/modules/job-profiles/
├── application/
│   ├── commands/
│   │   ├── handlers/
│   │   │   └── parse-job-description.handler.ts
│   │   └── impl/
│   │       └── parse-job-description.command.ts
│   ├── dto/
│   │   ├── job-profile.dto.ts
│   │   └── competency.dto.ts
│   └── mappers/
│       └── job-profile.mapper.ts
├── domain/
│   ├── entities/
│   │   ├── job-profile.entity.ts
│   │   └── competency.entity.ts
│   ├── value-objects/
│   │   ├── job-profile-id.ts
│   │   ├── user-id.ts
│   │   └── seniority-level.ts
│   ├── repositories/
│   │   └── job-profile.repository.interface.ts
│   └── errors/
│       └── job-profile.errors.ts
├── infrastructure/
│   ├── persistence/
│   │   ├── orm-entities/
│   │   │   └── job-profile.orm-entity.ts
│   │   ├── repositories/
│   │   │   └── job-profile.repository.ts
│   │   └── mappers/
│   │       └── job-profile-persistence.mapper.ts
│   ├── services/
│   │   ├── html-fetcher.service.ts
│   │   ├── jd-extractor.service.ts
│   │   └── claude-parser.service.ts
│   └── acl/
├── presentation/
│   └── http/
│       ├── controllers/
│       │   └── job-profiles.controller.ts
│       ├── dto/
│       │   ├── parse-job-description-request.dto.ts
│       │   └── parse-job-description-response.dto.ts
│       └── mappers/
│           └── job-profile-http.mapper.ts
├── public/
│   └── index.ts
└── job-profiles.module.ts
```

### Technology Stack

- **NestJS CQRS**: `@nestjs/cqrs` for CommandBus
- **Drizzle ORM**: Database operations
- **Supabase Auth**: JWT validation
- **Claude API**: Anthropic SDK for LLM calls
- **Cheerio**: HTML parsing (lightweight)
- **Axios**: HTTP client for fetching job URLs

---

## Implementation Steps

### Step 1: Database Schema & ORM Setup

**Goal:** Define the database schema and ORM entities for job profiles.

**Status After:** Database ready, no endpoints yet, application starts successfully.

#### 1.1 Update Drizzle Schema

**File:** `src/database/schema.ts`

```typescript
import { pgTable, uuid, varchar, text, jsonb, integer, real, timestamp } from 'drizzle-orm/pg-core';
import { users } from './schema'; // Assuming users table exists

export const jobProfiles = pgTable('job_profiles', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id),
  jobTitle: varchar('job_title', { length: 255 }),
  companyName: varchar('company_name', { length: 255 }),
  jobUrl: text('job_url'),
  rawJD: text('raw_jd'),
  competencies: jsonb('competencies').$type<Array<{ name: string; weight: number; depth: number }>>(),
  softSkills: jsonb('soft_skills').$type<string[]>(),
  hardSkills: jsonb('hard_skills').$type<string[]>(),
  seniorityLevel: integer('seniority_level'),
  interviewDifficultyLevel: real('interview_difficulty_level'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at'), // Soft delete pattern
});

export type JobProfile = typeof jobProfiles.$inferSelect;
export type NewJobProfile = typeof jobProfiles.$inferInsert;
```

#### 1.2 Generate and Push Schema

```bash
npm run db:generate
npm run db:push
```

#### 1.3 Verification

```bash
# Start app - should run without errors
npm run dev

# Verify schema in Drizzle Studio
npm run db:studio
# Navigate to localhost:4983, verify job_profiles table exists
```

**Expected State:**

- ✅ Database schema created
- ✅ Application starts successfully
- ✅ No endpoints yet (returns 404 for `/api/v1/job-profiles/parse`)

---

### Step 2: Domain Layer - Entities, Value Objects, Repository Interface

**Goal:** Create pure domain models with business logic.

**Status After:** Domain models ready, no framework dependencies, unit testable.

#### 2.1 Value Objects

**File:** `src/modules/job-profiles/domain/value-objects/job-profile-id.ts`

```typescript
export class JobProfileId {
  private constructor(private readonly value: string) {
    if (!value || value.trim().length === 0) {
      throw new Error('JobProfileId cannot be empty');
    }
  }

  static create(value: string): JobProfileId {
    return new JobProfileId(value);
  }

  static generate(): JobProfileId {
    // UUID will be generated by DB, this is for domain consistency
    return new JobProfileId(crypto.randomUUID());
  }

  getValue(): string {
    return this.value;
  }

  equals(other: JobProfileId): boolean {
    return this.value === other.value;
  }
}
```

**File:** `src/modules/job-profiles/domain/value-objects/user-id.ts`

```typescript
export class UserId {
  private constructor(private readonly value: string) {
    if (!value || value.trim().length === 0) {
      throw new Error('UserId cannot be empty');
    }
  }

  static create(value: string): UserId {
    return new UserId(value);
  }

  getValue(): string {
    return this.value;
  }
}
```

**File:** `src/modules/job-profiles/domain/value-objects/seniority-level.ts`

```typescript
export class SeniorityLevel {
  private constructor(private readonly value: number) {
    if (value < 1 || value > 10) {
      throw new Error('SeniorityLevel must be between 1 and 10');
    }
  }

  static create(value: number): SeniorityLevel {
    return new SeniorityLevel(value);
  }

  getValue(): number {
    return this.value;
  }
}
```

#### 2.2 Domain Entities

**File:** `src/modules/job-profiles/domain/entities/competency.entity.ts`

```typescript
export interface CompetencyProps {
  name: string;
  weight: number;
  depth: number;
}

export class Competency {
  private constructor(
    private readonly name: string,
    private readonly weight: number,
    private readonly depth: number,
  ) {
    this.validate();
  }

  static create(props: CompetencyProps): Competency {
    return new Competency(props.name, props.weight, props.depth);
  }

  private validate(): void {
    if (!this.name || this.name.trim().length === 0) {
      throw new Error('Competency name cannot be empty');
    }
    if (this.weight < 0 || this.weight > 1) {
      throw new Error('Competency weight must be between 0 and 1');
    }
    if (this.depth < 1 || this.depth > 10) {
      throw new Error('Competency depth must be between 1 and 10');
    }
  }

  getName(): string {
    return this.name;
  }

  getWeight(): number {
    return this.weight;
  }

  getDepth(): number {
    return this.depth;
  }

  toPlainObject(): CompetencyProps {
    return {
      name: this.name,
      weight: this.weight,
      depth: this.depth,
    };
  }
}
```

**File:** `src/modules/job-profiles/domain/entities/job-profile.entity.ts`

```typescript
import { JobProfileId } from '../value-objects/job-profile-id';
import { UserId } from '../value-objects/user-id';
import { SeniorityLevel } from '../value-objects/seniority-level';
import { Competency } from './competency.entity';

export interface JobProfileProps {
  id?: JobProfileId;
  userId: UserId;
  jobTitle?: string;
  companyName?: string;
  jobUrl?: string;
  rawJD?: string;
  competencies?: Competency[];
  softSkills?: string[];
  hardSkills?: string[];
  seniorityLevel?: SeniorityLevel;
  interviewDifficultyLevel?: number;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date;
}

export class JobProfile {
  private constructor(
    private readonly id: JobProfileId,
    private readonly userId: UserId,
    private jobTitle?: string,
    private companyName?: string,
    private jobUrl?: string,
    private rawJD?: string,
    private competencies: Competency[] = [],
    private softSkills: string[] = [],
    private hardSkills: string[] = [],
    private seniorityLevel?: SeniorityLevel,
    private interviewDifficultyLevel?: number,
    private readonly createdAt: Date = new Date(),
    private updatedAt: Date = new Date(),
    private deletedAt?: Date,
  ) {}

  static createNew(props: Omit<JobProfileProps, 'id' | 'deletedAt'>): JobProfile {
    return new JobProfile(
      JobProfileId.generate(),
      props.userId,
      props.jobTitle,
      props.companyName,
      props.jobUrl,
      props.rawJD,
      props.competencies || [],
      props.softSkills || [],
      props.hardSkills || [],
      props.seniorityLevel,
      props.interviewDifficultyLevel,
    );
  }

  static rehydrate(props: Required<JobProfileProps>): JobProfile {
    return new JobProfile(
      props.id,
      props.userId,
      props.jobTitle,
      props.companyName,
      props.jobUrl,
      props.rawJD,
      props.competencies,
      props.softSkills,
      props.hardSkills,
      props.seniorityLevel,
      props.interviewDifficultyLevel,
      props.createdAt,
      props.updatedAt,
      props.deletedAt,
    );
  }

  // Getters
  getId(): JobProfileId {
    return this.id;
  }

  getUserId(): UserId {
    return this.userId;
  }

  getJobTitle(): string | undefined {
    return this.jobTitle;
  }

  getCompanyName(): string | undefined {
    return this.companyName;
  }

  getJobUrl(): string | undefined {
    return this.jobUrl;
  }

  getRawJD(): string | undefined {
    return this.rawJD;
  }

  getCompetencies(): Competency[] {
    return [...this.competencies];
  }

  getSoftSkills(): string[] {
    return [...this.softSkills];
  }

  getHardSkills(): string[] {
    return [...this.hardSkills];
  }

  getSeniorityLevel(): SeniorityLevel | undefined {
    return this.seniorityLevel;
  }

  getInterviewDifficultyLevel(): number | undefined {
    return this.interviewDifficultyLevel;
  }

  getCreatedAt(): Date {
    return this.createdAt;
  }

  getUpdatedAt(): Date {
    return this.updatedAt;
  }

  getDeletedAt(): Date | undefined {
    return this.deletedAt;
  }

  isDeleted(): boolean {
    return this.deletedAt !== undefined;
  }

  // Business methods
  updateParsedData(data: {
    jobTitle?: string;
    companyName?: string;
    competencies?: Competency[];
    softSkills?: string[];
    hardSkills?: string[];
    seniorityLevel?: SeniorityLevel;
    interviewDifficultyLevel?: number;
  }): void {
    if (this.isDeleted()) {
      throw new Error('Cannot update deleted job profile');
    }

    if (data.jobTitle) this.jobTitle = data.jobTitle;
    if (data.companyName) this.companyName = data.companyName;
    if (data.competencies) this.competencies = data.competencies;
    if (data.softSkills) this.softSkills = data.softSkills;
    if (data.hardSkills) this.hardSkills = data.hardSkills;
    if (data.seniorityLevel) this.seniorityLevel = data.seniorityLevel;
    if (data.interviewDifficultyLevel !== undefined) {
      this.interviewDifficultyLevel = data.interviewDifficultyLevel;
    }
    this.updatedAt = new Date();
  }

  softDelete(): void {
    if (this.isDeleted()) {
      throw new Error('Job profile is already deleted');
    }
    this.deletedAt = new Date();
    this.updatedAt = new Date();
  }

  restore(): void {
    if (!this.isDeleted()) {
      throw new Error('Job profile is not deleted');
    }
    this.deletedAt = undefined;
    this.updatedAt = new Date();
  }
}
```

#### 2.3 Repository Interface (Port)

**File:** `src/modules/job-profiles/domain/repositories/job-profile.repository.interface.ts`

```typescript
import { JobProfile } from '../entities/job-profile.entity';
import { JobProfileId } from '../value-objects/job-profile-id';
import { UserId } from '../value-objects/user-id';

export interface IJobProfileRepository {
  save(jobProfile: JobProfile): Promise<void>;
  findById(id: JobProfileId, includeDeleted?: boolean): Promise<JobProfile | null>;
  findByUserId(userId: UserId, limit?: number, offset?: number, includeDeleted?: boolean): Promise<JobProfile[]>;
  countByUserId(userId: UserId, includeDeleted?: boolean): Promise<number>;
  softDelete(id: JobProfileId): Promise<void>;
  restore(id: JobProfileId): Promise<void>;
}

export const JOB_PROFILE_REPOSITORY = Symbol('JOB_PROFILE_REPOSITORY');
```

#### 2.4 Domain Errors

**File:** `src/modules/job-profiles/domain/errors/job-profile.errors.ts`

```typescript
export class JobProfileNotFoundError extends Error {
  constructor(id: string) {
    super(`Job profile with id ${id} not found`);
    this.name = 'JobProfileNotFoundError';
  }
}

export class InvalidJobDescriptionError extends Error {
  constructor(message: string) {
    super(`Invalid job description: ${message}`);
    this.name = 'InvalidJobDescriptionError';
  }
}

export class JobDescriptionParsingError extends Error {
  constructor(message: string) {
    super(`Failed to parse job description: ${message}`);
    this.name = 'JobDescriptionParsingError';
  }
}
```

#### 2.5 Unit Tests for Domain

**File:** `src/modules/job-profiles/domain/entities/job-profile.entity.spec.ts`

```typescript
import { JobProfile } from './job-profile.entity';
import { UserId } from '../value-objects/user-id';
import { SeniorityLevel } from '../value-objects/seniority-level';

describe('JobProfile Entity', () => {
  it('should create a new job profile', () => {
    const profile = JobProfile.createNew({
      userId: UserId.create('user-123'),
      jobTitle: 'Senior Software Engineer',
      rawJD: 'We are looking for...',
    });

    expect(profile).toBeDefined();
    expect(profile.getJobTitle()).toBe('Senior Software Engineer');
  });

  it('should update parsed data', () => {
    const profile = JobProfile.createNew({
      userId: UserId.create('user-123'),
      rawJD: 'Original JD',
    });

    profile.updateParsedData({
      jobTitle: 'Updated Title',
      seniorityLevel: SeniorityLevel.create(5),
    });

    expect(profile.getJobTitle()).toBe('Updated Title');
    expect(profile.getSeniorityLevel()?.getValue()).toBe(5);
  });
});
```

#### 2.6 Verification

```bash
# Run unit tests
npm test -- job-profile.entity.spec.ts

# Application should still start
npm run dev
```

**Expected State:**

- ✅ Domain models created (pure TypeScript, no framework dependencies)
- ✅ Value objects enforce business rules
- ✅ Repository interface defined (no implementation yet)
- ✅ Unit tests passing
- ✅ Application starts successfully

---

### Step 3: Infrastructure Layer - HTML Fetcher Service

**Goal:** Implement service to fetch HTML content from job URLs.

**Status After:** HTML fetcher ready, can be tested independently, no endpoint yet.

#### 3.1 Install Dependencies

```bash
npm install axios cheerio
npm install -D @types/cheerio
```

#### 3.2 HTML Fetcher Service

**File:** `src/modules/job-profiles/infrastructure/services/html-fetcher.service.ts`

```typescript
import { Injectable, Logger } from '@nestjs/common';
import axios, { AxiosError } from 'axios';

@Injectable()
export class HtmlFetcherService {
  private readonly logger = new Logger(HtmlFetcherService.name);

  async fetchHtml(url: string): Promise<string> {
    try {
      this.logger.log(`Fetching HTML from URL: ${url}`);

      const response = await axios.get(url, {
        timeout: 10000, // 10 seconds
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
      });

      return response.data;
    } catch (error) {
      if (error instanceof AxiosError) {
        this.logger.error(`Failed to fetch HTML: ${error.message}`);
        throw new Error(`Failed to fetch job URL: ${error.message}`);
      }
      throw error;
    }
  }
}
```

#### 3.3 Unit Tests for HTML Fetcher

**File:** `src/modules/job-profiles/infrastructure/services/html-fetcher.service.spec.ts`

```typescript
import { Test } from '@nestjs/testing';
import { HtmlFetcherService } from './html-fetcher.service';
import axios from 'axios';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('HtmlFetcherService', () => {
  let service: HtmlFetcherService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [HtmlFetcherService],
    }).compile();

    service = module.get(HtmlFetcherService);
  });

  it('should fetch HTML successfully', async () => {
    const mockHtml = '<html><body>Job Description</body></html>';
    mockedAxios.get.mockResolvedValue({ data: mockHtml });

    const result = await service.fetchHtml('https://example.com/job');

    expect(result).toBe(mockHtml);
    expect(mockedAxios.get).toHaveBeenCalledWith(
      'https://example.com/job',
      expect.objectContaining({ timeout: 10000 }),
    );
  });

  it('should throw error on fetch failure', async () => {
    mockedAxios.get.mockRejectedValue(new Error('Network error'));

    await expect(service.fetchHtml('https://example.com/job')).rejects.toThrow();
  });
});
```

#### 3.4 Verification

```bash
npm test -- html-fetcher.service.spec.ts
npm run dev
```

**Expected State:**

- ✅ HTML fetcher service implemented
- ✅ Unit tests passing
- ✅ Service testable independently
- ✅ Application starts successfully

---

### Step 4: Infrastructure Layer - JD Extractor Service

**Goal:** Extract clean text from HTML or use raw JD.

**Status After:** Text extraction ready, no Claude API yet.

#### 4.1 JD Extractor Service

**File:** `src/modules/job-profiles/infrastructure/services/jd-extractor.service.ts`

```typescript
import { Injectable, Logger } from '@nestjs/common';
import * as cheerio from 'cheerio';

@Injectable()
export class JdExtractorService {
  private readonly logger = new Logger(JdExtractorService.name);

  extractTextFromHtml(html: string): string {
    try {
      this.logger.log('Extracting text from HTML');

      const $ = cheerio.load(html);

      // Remove script and style tags
      $('script, style, noscript').remove();

      // Get text content
      const text = $('body').text();

      // Clean up whitespace
      const cleaned = text
        .replace(/\s+/g, ' ')
        .replace(/\n+/g, '\n')
        .trim();

      this.logger.log(`Extracted ${cleaned.length} characters from HTML`);
      return cleaned;
    } catch (error) {
      this.logger.error(`Failed to extract text from HTML: ${error.message}`);
      throw new Error('Failed to extract text from HTML');
    }
  }

  normalizeRawJD(rawJD: string): string {
    // Clean up whitespace and normalize line breaks
    return rawJD
      .replace(/\s+/g, ' ')
      .replace(/\n+/g, '\n')
      .trim();
  }
}
```

#### 4.2 Unit Tests

**File:** `src/modules/job-profiles/infrastructure/services/jd-extractor.service.spec.ts`

```typescript
import { Test } from '@nestjs/testing';
import { JdExtractorService } from './jd-extractor.service';

describe('JdExtractorService', () => {
  let service: JdExtractorService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [JdExtractorService],
    }).compile();

    service = module.get(JdExtractorService);
  });

  it('should extract text from HTML', () => {
    const html = `
      <html>
        <body>
          <h1>Job Title</h1>
          <p>We are looking for a senior engineer</p>
          <script>console.log('ignore me')</script>
        </body>
      </html>
    `;

    const result = service.extractTextFromHtml(html);

    expect(result).toContain('Job Title');
    expect(result).toContain('senior engineer');
    expect(result).not.toContain('ignore me');
  });

  it('should normalize raw JD', () => {
    const rawJD = `Job   Title\n\n\nDescription     with    spaces`;
    const result = service.normalizeRawJD(rawJD);

    expect(result).toBe('Job Title\nDescription with spaces');
  });
});
```

#### 4.3 Verification

```bash
npm test -- jd-extractor.service.spec.ts
npm run dev
```

**Expected State:**

- ✅ Text extraction from HTML working
- ✅ Raw JD normalization working
- ✅ Unit tests passing
- ✅ Application starts successfully

---

### Step 5: Infrastructure Layer - Claude Parser Service

**Goal:** Call Claude API with structured prompt and parse JSON response.

**Status After:** Claude integration ready, can parse JD to structured data.

#### 5.1 Install Anthropic SDK

```bash
npm install @anthropic-ai/sdk
```

#### 5.2 Claude Parser Service

**File:** `src/modules/job-profiles/infrastructure/services/claude-parser.service.ts`

```typescript
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Anthropic from '@anthropic-ai/sdk';
import { JobDescriptionParsingError } from '../../domain/errors/job-profile.errors';

export interface ParsedJobDescription {
  job_title: string;
  seniority_level: number;
  competencies: Array<{ name: string; weight: number; depth: number }>;
  hard_skills: string[];
  soft_skills: string[];
  interview_difficulty_level: number;
  company_name?: string;
}

@Injectable()
export class ClaudeParserService {
  private readonly logger = new Logger(ClaudeParserService.name);
  private readonly anthropic: Anthropic;

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('CLAUDE_API_KEY');
    if (!apiKey) {
      throw new Error('CLAUDE_API_KEY is not configured');
    }
    this.anthropic = new Anthropic({ apiKey });
  }

  async parseJobDescription(jdText: string): Promise<ParsedJobDescription> {
    try {
      this.logger.log('Calling Claude API to parse job description');

      const prompt = this.buildPrompt(jdText);

      const response = await this.anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 1024,
        messages: [{ role: 'user', content: prompt }],
      });

      const content = response.content[0];
      if (content.type !== 'text') {
        throw new JobDescriptionParsingError('Unexpected response type from Claude');
      }

      const parsed = this.parseClaudeResponse(content.text);
      this.logger.log('Successfully parsed job description');

      return parsed;
    } catch (error) {
      this.logger.error(`Failed to parse job description: ${error.message}`);
      if (error instanceof JobDescriptionParsingError) {
        throw error;
      }
      throw new JobDescriptionParsingError(error.message);
    }
  }

  private buildPrompt(jdText: string): string {
    return `Extract structured information from the following job description and return ONLY a valid JSON object (no markdown, no explanation).

Required format:
{
  "job_title": "string",
  "company_name": "string or null",
  "seniority_level": number (1-10, where 1=junior, 5=mid, 10=senior/principal),
  "competencies": [
    {
      "name": "string (e.g., 'System Design', 'API Development')",
      "weight": number (0-1, importance in job),
      "depth": number (1-10, expertise level required)
    }
  ],
  "hard_skills": ["string array of technical skills"],
  "soft_skills": ["string array of soft skills like 'communication', 'leadership'"],
  "interview_difficulty_level": number (1-10 estimate)
}

Rules:
- Extract 3-7 key competencies
- Competency weights should sum to approximately 1.0
- Be specific with competency names
- Include only explicitly mentioned skills
- Estimate interview difficulty based on seniority and requirements

Job Description:
${jdText}

Return JSON:`;
  }

  private parseClaudeResponse(text: string): ParsedJobDescription {
    try {
      // Remove markdown code blocks if present
      const cleanText = text
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();

      const parsed = JSON.parse(cleanText);

      // Validate required fields
      if (!parsed.job_title || !parsed.seniority_level || !parsed.competencies) {
        throw new Error('Missing required fields in parsed response');
      }

      // Normalize competency weights
      const totalWeight = parsed.competencies.reduce(
        (sum: number, c: { weight: number }) => sum + c.weight,
        0,
      );

      if (totalWeight > 0) {
        parsed.competencies = parsed.competencies.map(
          (c: { name: string; weight: number; depth: number }) => ({
            ...c,
            weight: c.weight / totalWeight, // Normalize to sum to 1
          }),
        );
      }

      return parsed as ParsedJobDescription;
    } catch (error) {
      throw new JobDescriptionParsingError(
        `Failed to parse Claude response: ${error.message}`,
      );
    }
  }
}
```

#### 5.3 Unit Tests (with Mocked Claude)

**File:** `src/modules/job-profiles/infrastructure/services/claude-parser.service.spec.ts`

```typescript
import { Test } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { ClaudeParserService } from './claude-parser.service';

describe('ClaudeParserService', () => {
  let service: ClaudeParserService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        ClaudeParserService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              if (key === 'CLAUDE_API_KEY') return 'test-key';
              return null;
            }),
          },
        },
      ],
    }).compile();

    service = module.get(ClaudeParserService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // Note: Full integration tests require Claude API key
  // These would be added in integration test suite
});
```

#### 5.4 Verification

```bash
npm test -- claude-parser.service.spec.ts
npm run dev
```

**Expected State:**

- ✅ Claude API integration implemented
- ✅ Prompt engineering complete
- ✅ JSON parsing and validation working
- ✅ Error handling in place
- ✅ Application starts successfully

---

### Step 6: Infrastructure Layer - Repository Implementation & Persistence Mappers

**Goal:** Implement repository to store/retrieve job profiles from PostgreSQL.

**Status After:** Database persistence working, repository ready for use in handlers.

#### 6.1 Persistence Mapper

**File:** `src/modules/job-profiles/infrastructure/persistence/mappers/job-profile-persistence.mapper.ts`

```typescript
import { JobProfile } from '../../../domain/entities/job-profile.entity';
import { JobProfileId } from '../../../domain/value-objects/job-profile-id';
import { UserId } from '../../../domain/value-objects/user-id';
import { SeniorityLevel } from '../../../domain/value-objects/seniority-level';
import { Competency } from '../../../domain/entities/competency.entity';
import { JobProfile as JobProfileORM } from '@/database/schema';

export class JobProfilePersistenceMapper {
  static toDomain(orm: JobProfileORM): JobProfile {
    return JobProfile.rehydrate({
      id: JobProfileId.create(orm.id),
      userId: UserId.create(orm.userId),
      jobTitle: orm.jobTitle ?? undefined,
      companyName: orm.companyName ?? undefined,
      jobUrl: orm.jobUrl ?? undefined,
      rawJD: orm.rawJD ?? undefined,
      competencies: orm.competencies
        ? (orm.competencies as Array<{ name: string; weight: number; depth: number }>).map(c =>
            Competency.create(c),
          )
        : [],
      softSkills: (orm.softSkills as string[]) ?? [],
      hardSkills: (orm.hardSkills as string[]) ?? [],
      seniorityLevel: orm.seniorityLevel
        ? SeniorityLevel.create(orm.seniorityLevel)
        : undefined,
      interviewDifficultyLevel: orm.interviewDifficultyLevel ?? undefined,
      createdAt: orm.createdAt,
      updatedAt: orm.updatedAt,
      deletedAt: orm.deletedAt ?? undefined,
    });
  }

  static toOrmInsert(domain: JobProfile): {
    userId: string;
    jobTitle?: string;
    companyName?: string;
    jobUrl?: string;
    rawJD?: string;
    competencies?: unknown;
    softSkills?: unknown;
    hardSkills?: unknown;
    seniorityLevel?: number;
    interviewDifficultyLevel?: number;
    deletedAt?: Date;
  } {
    return {
      userId: domain.getUserId().getValue(),
      jobTitle: domain.getJobTitle(),
      companyName: domain.getCompanyName(),
      jobUrl: domain.getJobUrl(),
      rawJD: domain.getRawJD(),
      competencies: domain.getCompetencies().map(c => c.toPlainObject()),
      softSkills: domain.getSoftSkills(),
      hardSkills: domain.getHardSkills(),
      seniorityLevel: domain.getSeniorityLevel()?.getValue(),
      interviewDifficultyLevel: domain.getInterviewDifficultyLevel(),
      deletedAt: domain.getDeletedAt(),
    };
  }
}
```

#### 6.2 Repository Implementation

**File:** `src/modules/job-profiles/infrastructure/persistence/repositories/job-profile.repository.ts`

```typescript
import { Injectable, Inject } from '@nestjs/common';
import { eq, and } from 'drizzle-orm';
import { IJobProfileRepository } from '../../../domain/repositories/job-profile.repository.interface';
import { JobProfile } from '../../../domain/entities/job-profile.entity';
import { JobProfileId } from '../../../domain/value-objects/job-profile-id';
import { UserId } from '../../../domain/value-objects/user-id';
import { JobProfilePersistenceMapper } from '../mappers/job-profile-persistence.mapper';
import { jobProfiles } from '@/database/schema';
import { DrizzleDb, DRIZZLE_DB } from '@/database/database.module';

@Injectable()
export class JobProfileRepository implements IJobProfileRepository {
  constructor(@Inject(DRIZZLE_DB) private readonly db: DrizzleDb) {}

  async save(jobProfile: JobProfile): Promise<void> {
    const ormEntity = JobProfilePersistenceMapper.toOrmInsert(jobProfile);

    await this.db.insert(jobProfiles).values({
      id: jobProfile.getId().getValue(),
      ...ormEntity,
    });
  }

  async findById(id: JobProfileId, includeDeleted = false): Promise<JobProfile | null> {
    const conditions = [eq(jobProfiles.id, id.getValue())];

    if (!includeDeleted) {
      conditions.push(eq(jobProfiles.deletedAt, null));
    }

    const result = await this.db
      .select()
      .from(jobProfiles)
      .where(and(...conditions))
      .limit(1);

    if (!result[0]) return null;
    return JobProfilePersistenceMapper.toDomain(result[0]);
  }

  async findByUserId(
    userId: UserId,
    limit = 10,
    offset = 0,
    includeDeleted = false,
  ): Promise<JobProfile[]> {
    const conditions = [eq(jobProfiles.userId, userId.getValue())];

    if (!includeDeleted) {
      conditions.push(eq(jobProfiles.deletedAt, null));
    }

    const result = await this.db
      .select()
      .from(jobProfiles)
      .where(and(...conditions))
      .limit(limit)
      .offset(offset)
      .orderBy(jobProfiles.createdAt);

    return result.map(JobProfilePersistenceMapper.toDomain);
  }

  async countByUserId(userId: UserId, includeDeleted = false): Promise<number> {
    const conditions = [eq(jobProfiles.userId, userId.getValue())];

    if (!includeDeleted) {
      conditions.push(eq(jobProfiles.deletedAt, null));
    }

    const result = await this.db
      .select({ count: jobProfiles.id })
      .from(jobProfiles)
      .where(and(...conditions));

    return result.length;
  }

  async softDelete(id: JobProfileId): Promise<void> {
    await this.db
      .update(jobProfiles)
      .set({
        deletedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(jobProfiles.id, id.getValue()));
  }

  async restore(id: JobProfileId): Promise<void> {
    await this.db
      .update(jobProfiles)
      .set({
        deletedAt: null,
        updatedAt: new Date(),
      })
      .where(eq(jobProfiles.id, id.getValue()));
  }
}
```

#### 6.3 Verification

```bash
npm run dev
# No endpoint yet, but repository is ready
```

**Expected State:**

- ✅ Repository implementation complete
- ✅ Persistence mappers handle Domain ↔ ORM conversion
- ✅ Database queries ready
- ✅ Application starts successfully

---

### Step 7: Application Layer - Command & Handler (CQRS)

**Goal:** Create Command and Handler for parsing job descriptions using CQRS pattern.

**Status After:** Business logic implemented, uses CommandBus, no HTTP endpoint yet.

#### 7.1 Application DTOs

**File:** `src/modules/job-profiles/application/dto/competency.dto.ts`

```typescript
export class CompetencyDto {
  name: string;
  weight: number;
  depth: number;
}
```

**File:** `src/modules/job-profiles/application/dto/job-profile.dto.ts`

```typescript
import { CompetencyDto } from './competency.dto';

export class JobProfileDto {
  id: string;
  userId: string;
  jobTitle?: string;
  companyName?: string;
  jobUrl?: string;
  rawJD?: string;
  competencies: CompetencyDto[];
  softSkills: string[];
  hardSkills: string[];
  seniorityLevel?: number;
  interviewDifficultyLevel?: number;
  createdAt: Date;
  updatedAt: Date;
}
```

#### 7.2 Application Mapper

**File:** `src/modules/job-profiles/application/mappers/job-profile.mapper.ts`

```typescript
import { JobProfile } from '../../domain/entities/job-profile.entity';
import { JobProfileDto } from '../dto/job-profile.dto';

export class JobProfileMapper {
  static toDto(domain: JobProfile): JobProfileDto {
    return {
      id: domain.getId().getValue(),
      userId: domain.getUserId().getValue(),
      jobTitle: domain.getJobTitle(),
      companyName: domain.getCompanyName(),
      jobUrl: domain.getJobUrl(),
      rawJD: domain.getRawJD(),
      competencies: domain.getCompetencies().map(c => ({
        name: c.getName(),
        weight: c.getWeight(),
        depth: c.getDepth(),
      })),
      softSkills: domain.getSoftSkills(),
      hardSkills: domain.getHardSkills(),
      seniorityLevel: domain.getSeniorityLevel()?.getValue(),
      interviewDifficultyLevel: domain.getInterviewDifficultyLevel(),
      createdAt: domain.getCreatedAt(),
      updatedAt: domain.getUpdatedAt(),
    };
  }
}
```

#### 7.3 Command Definition

**File:** `src/modules/job-profiles/application/commands/impl/parse-job-description.command.ts`

```typescript
export class ParseJobDescriptionCommand {
  constructor(
    public readonly userId: string,
    public readonly jobUrl?: string,
    public readonly rawJD?: string,
    public readonly jobTitle?: string,
    public readonly seniority?: number,
  ) {}
}
```

#### 7.4 Command Handler

**File:** `src/modules/job-profiles/application/commands/handlers/parse-job-description.handler.ts`

```typescript
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject, Logger, BadRequestException } from '@nestjs/common';
import { ParseJobDescriptionCommand } from '../impl/parse-job-description.command';
import { JobProfileDto } from '../../dto/job-profile.dto';
import { JobProfileMapper } from '../../mappers/job-profile.mapper';
import { IJobProfileRepository, JOB_PROFILE_REPOSITORY } from '../../../domain/repositories/job-profile.repository.interface';
import { JobProfile } from '../../../domain/entities/job-profile.entity';
import { UserId } from '../../../domain/value-objects/user-id';
import { SeniorityLevel } from '../../../domain/value-objects/seniority-level';
import { Competency } from '../../../domain/entities/competency.entity';
import { HtmlFetcherService } from '../../../infrastructure/services/html-fetcher.service';
import { JdExtractorService } from '../../../infrastructure/services/jd-extractor.service';
import { ClaudeParserService } from '../../../infrastructure/services/claude-parser.service';
import { InvalidJobDescriptionError } from '../../../domain/errors/job-profile.errors';

@CommandHandler(ParseJobDescriptionCommand)
export class ParseJobDescriptionHandler
  implements ICommandHandler<ParseJobDescriptionCommand>
{
  private readonly logger = new Logger(ParseJobDescriptionHandler.name);

  constructor(
    @Inject(JOB_PROFILE_REPOSITORY)
    private readonly repository: IJobProfileRepository,
    private readonly htmlFetcher: HtmlFetcherService,
    private readonly jdExtractor: JdExtractorService,
    private readonly claudeParser: ClaudeParserService,
  ) {}

  async execute(command: ParseJobDescriptionCommand): Promise<JobProfileDto> {
    this.logger.log(`Parsing job description for user ${command.userId}`);

    // Step 1: Get job description text
    let jdText: string;
    let jobUrl: string | undefined;

    if (command.jobUrl) {
      // Step 1a: Fetch HTML from URL
      const html = await this.htmlFetcher.fetchHtml(command.jobUrl);

      // Step 2: Extract text from HTML
      jdText = this.jdExtractor.extractTextFromHtml(html);
      jobUrl = command.jobUrl;
    } else if (command.rawJD) {
      // Step 2 (alternative): Use raw JD directly
      jdText = this.jdExtractor.normalizeRawJD(command.rawJD);
    } else {
      throw new InvalidJobDescriptionError(
        'Either jobUrl or rawJD must be provided',
      );
    }

    // Step 3: Call Claude API with structured prompt
    const parsedData = await this.claudeParser.parseJobDescription(jdText);

    // Step 4: Create domain entity
    const jobProfile = JobProfile.createNew({
      userId: UserId.create(command.userId),
      jobTitle: parsedData.job_title,
      companyName: parsedData.company_name,
      jobUrl,
      rawJD: command.rawJD,
    });

    // Update with parsed data
    jobProfile.updateParsedData({
      jobTitle: parsedData.job_title,
      companyName: parsedData.company_name,
      competencies: parsedData.competencies.map(c => Competency.create(c)),
      softSkills: parsedData.soft_skills,
      hardSkills: parsedData.hard_skills,
      seniorityLevel: SeniorityLevel.create(parsedData.seniority_level),
      interviewDifficultyLevel: parsedData.interview_difficulty_level,
    });

    // Step 5: Store in PostgreSQL via Drizzle
    await this.repository.save(jobProfile);

    this.logger.log(`Job profile created with id ${jobProfile.getId().getValue()}`);

    // Return DTO
    return JobProfileMapper.toDto(jobProfile);
  }
}
```

#### 7.5 Unit Tests for Handler

**File:** `src/modules/job-profiles/application/commands/handlers/parse-job-description.handler.spec.ts`

```typescript
import { Test } from '@nestjs/testing';
import { ParseJobDescriptionHandler } from './parse-job-description.handler';
import { ParseJobDescriptionCommand } from '../impl/parse-job-description.command';
import { JOB_PROFILE_REPOSITORY } from '../../../domain/repositories/job-profile.repository.interface';
import { HtmlFetcherService } from '../../../infrastructure/services/html-fetcher.service';
import { JdExtractorService } from '../../../infrastructure/services/jd-extractor.service';
import { ClaudeParserService } from '../../../infrastructure/services/claude-parser.service';

describe('ParseJobDescriptionHandler', () => {
  let handler: ParseJobDescriptionHandler;
  let mockRepository: any;
  let mockHtmlFetcher: any;
  let mockJdExtractor: any;
  let mockClaudeParser: any;

  beforeEach(async () => {
    mockRepository = { save: jest.fn() };
    mockHtmlFetcher = { fetchHtml: jest.fn() };
    mockJdExtractor = { extractTextFromHtml: jest.fn(), normalizeRawJD: jest.fn() };
    mockClaudeParser = {
      parseJobDescription: jest.fn().mockResolvedValue({
        job_title: 'Senior Engineer',
        seniority_level: 7,
        competencies: [{ name: 'System Design', weight: 0.5, depth: 8 }],
        hard_skills: ['TypeScript', 'NestJS'],
        soft_skills: ['Communication'],
        interview_difficulty_level: 7,
      }),
    };

    const module = await Test.createTestingModule({
      providers: [
        ParseJobDescriptionHandler,
        { provide: JOB_PROFILE_REPOSITORY, useValue: mockRepository },
        { provide: HtmlFetcherService, useValue: mockHtmlFetcher },
        { provide: JdExtractorService, useValue: mockJdExtractor },
        { provide: ClaudeParserService, useValue: mockClaudeParser },
      ],
    }).compile();

    handler = module.get(ParseJobDescriptionHandler);
  });

  it('should parse job description from raw JD', async () => {
    const command = new ParseJobDescriptionCommand(
      'user-123',
      undefined,
      'We are looking for a senior engineer...',
    );

    mockJdExtractor.normalizeRawJD.mockReturnValue('Normalized JD text');

    const result = await handler.execute(command);

    expect(result.jobTitle).toBe('Senior Engineer');
    expect(mockClaudeParser.parseJobDescription).toHaveBeenCalledWith('Normalized JD text');
    expect(mockRepository.save).toHaveBeenCalled();
  });

  it('should parse job description from URL', async () => {
    const command = new ParseJobDescriptionCommand(
      'user-123',
      'https://example.com/job',
    );

    mockHtmlFetcher.fetchHtml.mockResolvedValue('<html>Job content</html>');
    mockJdExtractor.extractTextFromHtml.mockReturnValue('Extracted text');

    const result = await handler.execute(command);

    expect(mockHtmlFetcher.fetchHtml).toHaveBeenCalledWith('https://example.com/job');
    expect(mockJdExtractor.extractTextFromHtml).toHaveBeenCalled();
    expect(result.jobTitle).toBe('Senior Engineer');
  });
});
```

#### 7.6 Verification

```bash
npm test -- parse-job-description.handler.spec.ts
npm run dev
```

**Expected State:**

- ✅ CQRS Command and Handler implemented
- ✅ Full parsing pipeline working (fetch → extract → parse → store)
- ✅ Business logic in handler, orchestrates services
- ✅ Unit tests passing with mocks
- ✅ Application starts successfully

---

### Step 8: Presentation Layer - HTTP Controller & DTOs

**Goal:** Create REST API endpoint to expose the parsing functionality.

**Status After:** Full feature working end-to-end, API endpoint accessible.

#### 8.1 HTTP DTOs

**File:** `src/modules/job-profiles/presentation/http/dto/parse-job-description-request.dto.ts`

```typescript
import { IsString, IsOptional, IsNumber, Min, Max, ValidateIf } from 'class-validator';

export class ParseJobDescriptionRequestDto {
  @IsString()
  @IsOptional()
  jobUrl?: string;

  @IsString()
  @IsOptional()
  rawJD?: string;

  @IsString()
  @IsOptional()
  jobTitle?: string;

  @IsNumber()
  @IsOptional()
  @Min(1)
  @Max(10)
  seniority?: number;

  @ValidateIf(o => !o.jobUrl && !o.rawJD)
  validate() {
    throw new Error('Either jobUrl or rawJD must be provided');
  }
}
```

**File:** `src/modules/job-profiles/presentation/http/dto/parse-job-description-response.dto.ts`

```typescript
export class CompetencyResponseDto {
  name: string;
  weight: number;
  depth: number;
}

export class ParseJobDescriptionResponseDto {
  id: string;
  jobTitle?: string;
  companyName?: string;
  competencies: CompetencyResponseDto[];
  hardSkills: string[];
  softSkills: string[];
  seniorityLevel?: number;
  interviewDifficultyLevel?: number;
  createdAt: Date;
}
```

#### 8.2 HTTP Mapper

**File:** `src/modules/job-profiles/presentation/http/mappers/job-profile-http.mapper.ts`

```typescript
import { JobProfileDto } from '../../../application/dto/job-profile.dto';
import { ParseJobDescriptionResponseDto } from '../dto/parse-job-description-response.dto';

export class JobProfileHttpMapper {
  static toParseResponse(dto: JobProfileDto): ParseJobDescriptionResponseDto {
    return {
      id: dto.id,
      jobTitle: dto.jobTitle,
      companyName: dto.companyName,
      competencies: dto.competencies,
      hardSkills: dto.hardSkills,
      softSkills: dto.softSkills,
      seniorityLevel: dto.seniorityLevel,
      interviewDifficultyLevel: dto.interviewDifficultyLevel,
      createdAt: dto.createdAt,
    };
  }
}
```

#### 8.3 Controller

**File:** `src/modules/job-profiles/presentation/http/controllers/job-profiles.controller.ts`

```typescript
import { Controller, Post, Body, UseGuards, Logger } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { ParseJobDescriptionRequestDto } from '../dto/parse-job-description-request.dto';
import { ParseJobDescriptionResponseDto } from '../dto/parse-job-description-response.dto';
import { JobProfileHttpMapper } from '../mappers/job-profile-http.mapper';
import { ParseJobDescriptionCommand } from '../../../application/commands/impl/parse-job-description.command';
import { SupabaseGuard } from '@/modules/auth/guards/supabase.guard';
import { CurrentUser } from '@/common/decorators/current-user.decorator';

@Controller('api/v1/job-profiles')
@UseGuards(SupabaseGuard)
export class JobProfilesController {
  private readonly logger = new Logger(JobProfilesController.name);

  constructor(private readonly commandBus: CommandBus) {}

  @Post('parse')
  async parse(
    @Body() dto: ParseJobDescriptionRequestDto,
    @CurrentUser() user: { id: string },
  ): Promise<ParseJobDescriptionResponseDto> {
    this.logger.log(`Parsing job description for user ${user.id}`);

    const command = new ParseJobDescriptionCommand(
      user.id,
      dto.jobUrl,
      dto.rawJD,
      dto.jobTitle,
      dto.seniority,
    );

    const result = await this.commandBus.execute(command);

    return JobProfileHttpMapper.toParseResponse(result);
  }
}
```

#### 8.4 E2E Test

**File:** `src/modules/job-profiles/presentation/http/controllers/job-profiles.controller.e2e-spec.ts`

```typescript
import { Test } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { JobProfilesModule } from '../../../job-profiles.module';

describe('JobProfilesController (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [JobProfilesModule],
    }).compile();

    app = module.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('POST /api/v1/job-profiles/parse - should require auth', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/job-profiles/parse')
      .send({ rawJD: 'Test job description' })
      .expect(401);

    expect(response.body.message).toContain('Unauthorized');
  });

  // Additional tests with valid JWT would go here
});
```

#### 8.5 Verification

```bash
npm test -- job-profiles.controller.e2e-spec.ts
npm run dev

# Test with curl (requires valid JWT)
curl -X POST http://localhost:3000/api/v1/job-profiles/parse \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"rawJD": "We are looking for a Senior Software Engineer..."}'
```

**Expected State:**

- ✅ HTTP endpoint `/api/v1/job-profiles/parse` working
- ✅ Request validation with class-validator
- ✅ Authentication with SupabaseGuard
- ✅ Full pipeline: HTTP → Command → Services → Repository → Response
- ✅ E2E tests passing
- ✅ Application fully functional

---

### Step 9: Module Registration & Wiring

**Goal:** Wire all components together in NestJS module.

**Status After:** Complete feature ready for production use.

#### 9.1 Job Profiles Module

**File:** `src/modules/job-profiles/job-profiles.module.ts`

```typescript
import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { ConfigModule } from '@nestjs/config';

// Presentation
import { JobProfilesController } from './presentation/http/controllers/job-profiles.controller';

// Application
import { ParseJobDescriptionHandler } from './application/commands/handlers/parse-job-description.handler';

// Infrastructure
import { JobProfileRepository } from './infrastructure/persistence/repositories/job-profile.repository';
import { HtmlFetcherService } from './infrastructure/services/html-fetcher.service';
import { JdExtractorService } from './infrastructure/services/jd-extractor.service';
import { ClaudeParserService } from './infrastructure/services/claude-parser.service';
import { JOB_PROFILE_REPOSITORY } from './domain/repositories/job-profile.repository.interface';
import { DatabaseModule } from '@/database/database.module';

const CommandHandlers = [ParseJobDescriptionHandler];
const Services = [HtmlFetcherService, JdExtractorService, ClaudeParserService];
const Repositories = [
  {
    provide: JOB_PROFILE_REPOSITORY,
    useClass: JobProfileRepository,
  },
];

@Module({
  imports: [CqrsModule, ConfigModule, DatabaseModule],
  controllers: [JobProfilesController],
  providers: [...CommandHandlers, ...Services, ...Repositories],
  exports: [], // Will add ACL exports later
})
export class JobProfilesModule {}
```

#### 9.2 Register in AppModule

**File:** `src/app.module.ts`

```typescript
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JobProfilesModule } from './modules/job-profiles/job-profiles.module';
// ... other imports

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    // ... other modules
    JobProfilesModule,
  ],
})
export class AppModule {}
```

#### 9.3 Verification

```bash
# Run all tests
npm test

# Start application
npm run dev

# Test full flow with Postman or curl
# 1. Login to get JWT
# 2. POST to /api/v1/job-profiles/parse with JWT

# Check database
npm run db:studio
# Verify job_profiles table has data
```

**Expected State:**

- ✅ Module fully registered and wired
- ✅ All dependencies injected correctly
- ✅ Full feature working end-to-end
- ✅ Database persistence confirmed
- ✅ Tests passing
- ✅ Ready for production use

---

### Step 10: Documentation & Public Contract

**Goal:** Document the module and expose public contracts for inter-module communication.

**Status After:** Module complete, documented, and ready for other modules to consume.

#### 10.1 Public ACL Interface (Future)

**File:** `src/modules/job-profiles/public/index.ts`

```typescript
// This will be populated when other modules need to access job profiles
// For now, export placeholder for future ACL

export * from './acl/job-profiles.acl.interface';
export * from './acl/job-profiles.acl.tokens';
```

**File:** `src/modules/job-profiles/public/acl/job-profiles.acl.interface.ts`

```typescript
// Placeholder for future ACL
export interface IJobProfilesACL {
  getJobProfile(jobProfileId: string): Promise<{
    id: string;
    jobTitle: string;
    competencies: Array<{ name: string; weight: number; depth: number }>;
  }>;
}
```

**File:** `src/modules/job-profiles/public/acl/job-profiles.acl.tokens.ts`

```typescript
export const JOB_PROFILES_ACL = Symbol('JOB_PROFILES_ACL');
```

#### 10.2 Module README

**File:** `src/modules/job-profiles/README.md`

```markdown
# Job Profiles Module

## Overview

The Job Profiles module handles parsing and storing job descriptions with structured competency extraction using Claude AI.

## Features

- **FR-JP-001**: Parse Job Description
  - Fetch HTML from job URL or accept raw JD text
  - Extract clean text from HTML
  - Call Claude API for structured extraction
  - Store parsed data in PostgreSQL

## Architecture

- **Domain**: JobProfile entity, Competency entity, value objects
- **Application**: ParseJobDescriptionCommand + Handler (CQRS)
- **Infrastructure**:
  - HtmlFetcherService (axios)
  - JdExtractorService (cheerio)
  - ClaudeParserService (Anthropic SDK)
  - JobProfileRepository (Drizzle ORM)
- **Presentation**: JobProfilesController (REST API)

## API Endpoints

### POST /api/v1/job-profiles/parse
Parse a job description and extract structured data.

**Auth:** Required (JWT)

**Request:**
```json
{
  "jobUrl": "https://example.com/job",  // Optional
  "rawJD": "Job description text...",   // Optional (one of jobUrl/rawJD required)
  "jobTitle": "Senior Engineer",         // Optional
  "seniority": 7                         // Optional (1-10)
}
```

**Response:**

```json
{
  "id": "uuid",
  "jobTitle": "Senior Software Engineer",
  "companyName": "Example Corp",
  "competencies": [
    { "name": "System Design", "weight": 0.3, "depth": 8 }
  ],
  "hardSkills": ["TypeScript", "NestJS"],
  "softSkills": ["Communication"],
  "seniorityLevel": 7,
  "interviewDifficultyLevel": 7.5,
  "createdAt": "2026-01-17T00:00:00Z"
}
```

## Testing

```bash
# Unit tests
npm test -- job-profiles

# E2E tests
npm run test:e2e -- job-profiles

# Manual test
curl -X POST http://localhost:3000/api/v1/job-profiles/parse \
  -H "Authorization: Bearer YOUR_JWT" \
  -H "Content-Type: application/json" \
  -d '{"rawJD": "Looking for a senior engineer..."}'
```

## Dependencies

- `@anthropic-ai/sdk` - Claude API client
- `axios` - HTTP client for fetching job URLs
- `cheerio` - HTML parsing

```

#### 10.3 Final Verification Checklist

```bash
# All tests passing
npm test

# Linting clean
npm run lint

# Application starts
npm run dev

# Database schema correct
npm run db:studio

# E2E flow works
# 1. POST /api/v1/auth/login → get JWT
# 2. POST /api/v1/job-profiles/parse with JWT → verify response
# 3. Check database has new record
```

**Expected State:**

- ✅ Module fully implemented and tested
- ✅ Documentation complete
- ✅ Public contracts defined
- ✅ Ready for integration with other modules
- ✅ Production-ready code quality

---

## Summary of Implementation Steps

| Step | Description | Status After | Verification |
|------|-------------|--------------|--------------|
| 1 | Database Schema & ORM | Schema ready, no endpoints | `npm run db:push` |
| 2 | Domain Layer | Pure domain models | Unit tests passing |
| 3 | HTML Fetcher Service | Can fetch job URLs | Service tests passing |
| 4 | JD Extractor Service | Can extract text | Service tests passing |
| 5 | Claude Parser Service | Can parse with AI | Service tests passing |
| 6 | Repository Implementation | Database persistence | App starts, no errors |
| 7 | Command & Handler (CQRS) | Business logic ready | Handler tests passing |
| 8 | HTTP Controller & DTOs | REST API working | E2E tests passing |
| 9 | Module Wiring | Full feature integrated | Full flow working |
| 10 | Documentation & Public API | Production ready | All tests passing |

---

## Key Architectural Decisions

1. **CQRS Pattern**: All operations go through CommandBus for consistency
2. **Rich Domain Models**: Business logic in entities, not anemic DTOs
3. **Layer Separation**: Clear boundaries with explicit mapping at each layer
4. **Repository Pattern**: Abstract persistence, domain doesn't know about ORM
5. **Service Composition**: Handler orchestrates services, services do one thing
6. **Type Safety**: Drizzle ORM for type-safe queries, strict TypeScript
7. **Error Handling**: Domain errors, HTTP exception filter handles conversion
8. **Testing Strategy**: Unit → Integration → E2E at each step

---

## Next Features (Post FR-JP-001)

- **FR-JP-002**: Get Job Profile (Query + Handler)
- **FR-JP-003**: List Job Profiles (Query + Handler with pagination)
- **ACL Implementation**: For inter-module communication with interviews module

---

**Document Status:** ✅ Implementation Ready
**Last Updated:** 2026-01-17
**Module:** job-profiles
**Feature:** FR-JP-001 Parse Job Description
