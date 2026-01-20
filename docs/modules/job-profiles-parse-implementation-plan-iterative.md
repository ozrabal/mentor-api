# FR-JP-001: Parse Job Description - Iterative Implementation Plan

**Module:** `job-profiles`
**Feature:** Parse Job Description
**Version:** 2.0 (Iterative)
**Date:** 2026-01-19
**Status:** Ready for Implementation

---

## Quick Start Guide

### Dependencies to Install

```bash
npm install axios cheerio ai @ai-sdk/openai zod
npm install -D @types/cheerio
```

### Environment Variables Required

```bash
OPENAI_API_KEY=sk-your-openai-api-key
AI_MODEL=gpt-4o  # Optional, defaults to gpt-4o
```

### Key Files to Create

1. **Domain**: `src/modules/job-profiles/domain/entities/job-profile.entity.ts`
2. **Application**: `src/modules/job-profiles/application/commands/handlers/parse-job-description.handler.ts`
3. **Infrastructure**: `src/modules/job-profiles/infrastructure/services/ai-parser.service.ts`
4. **Presentation**: `src/modules/job-profiles/presentation/http/controllers/job-profiles.controller.ts`
5. **Module**: `src/modules/job-profiles/job-profiles.module.ts`

### Implementation Strategy

Follow steps 1-8 sequentially. After each step, the endpoint should work and return a response (even if placeholder initially).

---

## Overview

This document provides an **iterative and incremental** implementation plan for the Parse Job Description feature (FR-JP-001). Unlike the original plan, this approach prioritizes having a **working endpoint from the start** that returns responses after each step, even if they're placeholder responses initially.

### Key Principles

1. **Endpoint First**: Create the HTTP endpoint in Step 1 so it can be invoked immediately
2. **Incremental Enhancement**: Each step adds real functionality while maintaining a working endpoint
3. **Continuous Testing**: The endpoint can be tested after every step
4. **Minimal Viable Slices**: Each step delivers a complete vertical slice through all layers

### Technology Decisions

**AI Integration: Vercel AI SDK**

We use the Vercel AI SDK instead of direct provider SDKs for several key benefits:

- **Model Agnostic**: Switch between OpenAI, Anthropic, Google, Mistral, and others with minimal code changes
- **Structured Output**: Built-in `generateObject()` with Zod schema validation ensures type-safe responses
- **Provider Flexibility**: Start with OpenAI (gpt-4o), easily migrate to Claude or Gemini later
- **Consistent API**: Unified interface across all providers reduces vendor lock-in
- **Future-Proof**: Add new providers as they emerge without refactoring core logic

**Initial Configuration**: OpenAI with GPT-4o for production-ready structured extraction.

---

## Implementation Steps Overview

| Step | What Gets Added | Endpoint Returns |
|------|-----------------|------------------|
| 1 | Basic endpoint structure + minimal module wiring | Simple "accepted" response with mock data |
| 2 | Domain layer (entities, value objects) | Endpoint returns domain entity as JSON |
| 3 | Application layer DTOs + mappers + CQRS | Proper response DTOs with mapping |
| 4 | Text normalization (raw JD input) | Can accept rawJD, returns normalized placeholder data |
| 5 | Repository + persistence | Saves to DB, returns persisted job profile |
| 6 | HTML fetcher service | Can accept jobUrl, fetches and extracts text |
| 7 | AI integration (Vercel AI SDK + OpenAI) | Real AI parsing with structured extraction |
| 8 | Tests + documentation | Production ready |

---

## Step 1: Basic Endpoint Structure

**Goal:** Create working endpoint that accepts requests and returns placeholder response.

**Status After:**
- ✅ Endpoint `/api/v1/job-profiles/parse` responds with 200
- ✅ Accepts POST with `rawJD` or `jobUrl`
- ✅ Returns mock parsed job profile
- ✅ Authentication required
- ✅ Validation works

### 1.1 Install Dependencies

```bash
npm install axios cheerio ai @ai-sdk/openai
npm install -D @types/cheerio
```

### 1.2 Presentation Layer - Request/Response DTOs

**File:** `src/modules/job-profiles/presentation/http/dto/parse-job-description-request.dto.ts`

```typescript
import { IsString, IsOptional, IsNumber, Min, Max } from 'class-validator';

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

### 1.3 Controller with Placeholder Logic

**File:** `src/modules/job-profiles/presentation/http/controllers/job-profiles.controller.ts`

```typescript
import { Controller, Post, Body, UseGuards, Logger, BadRequestException } from '@nestjs/common';
import { ParseJobDescriptionRequestDto } from '../dto/parse-job-description-request.dto';
import { ParseJobDescriptionResponseDto } from '../dto/parse-job-description-response.dto';
import { SupabaseGuard } from '@/modules/auth/guards/supabase.guard';
import { CurrentUser } from '@/common/decorators/current-user.decorator';

@Controller('api/v1/job-profiles')
@UseGuards(SupabaseGuard)
export class JobProfilesController {
  private readonly logger = new Logger(JobProfilesController.name);

  @Post('parse')
  async parse(
    @Body() dto: ParseJobDescriptionRequestDto,
    @CurrentUser() user: { id: string },
  ): Promise<ParseJobDescriptionResponseDto> {
    this.logger.log(`Parsing job description for user ${user.id}`);

    // Validate that at least one input is provided
    if (!dto.jobUrl && !dto.rawJD) {
      throw new BadRequestException('Either jobUrl or rawJD must be provided');
    }

    // TODO: This is placeholder data - will be replaced in subsequent steps
    const mockResponse: ParseJobDescriptionResponseDto = {
      id: crypto.randomUUID(),
      jobTitle: dto.jobTitle || 'Software Engineer (placeholder)',
      companyName: 'Example Corp (placeholder)',
      competencies: [
        { name: 'Programming', weight: 0.5, depth: 5 },
        { name: 'Communication', weight: 0.5, depth: 5 },
      ],
      hardSkills: ['JavaScript', 'TypeScript'],
      softSkills: ['Communication', 'Teamwork'],
      seniorityLevel: dto.seniority || 5,
      interviewDifficultyLevel: 5,
      createdAt: new Date(),
    };

    this.logger.log(`Returning placeholder job profile with id ${mockResponse.id}`);
    return mockResponse;
  }
}
```

### 1.4 Module Registration

**File:** `src/modules/job-profiles/job-profiles.module.ts`

```typescript
import { Module } from '@nestjs/common';
import { JobProfilesController } from './presentation/http/controllers/job-profiles.controller';

@Module({
  controllers: [JobProfilesController],
})
export class JobProfilesModule {}
```

### 1.5 Register in AppModule

**File:** `src/app.module.ts` (update imports section)

```typescript
import { JobProfilesModule } from './modules/job-profiles/job-profiles.module';

@Module({
  imports: [
    // ... existing imports
    JobProfilesModule,
  ],
})
export class AppModule {}
```

### 1.6 Verification

```bash
# Start the application
npm run dev

# Test the endpoint (get JWT token first from auth endpoint)
curl -X POST http://localhost:3000/api/v1/job-profiles/parse \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"rawJD": "Looking for a senior software engineer..."}'

# Expected: 200 OK with placeholder response
```

**Expected State:**
- ✅ Endpoint accessible and returns 200
- ✅ Validation rejects invalid requests
- ✅ Authentication guard works
- ✅ Returns consistent JSON structure
- ✅ Application runs without errors

---

## Step 2: Domain Layer - Entities & Value Objects

**Goal:** Replace mock data with proper domain entities.

**Status After:**
- ✅ Domain entities created
- ✅ Value objects enforce business rules
- ✅ Controller uses domain entities to build response
- ✅ Endpoint still returns placeholder data but properly structured

### 2.1 Value Objects

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

### 2.2 Domain Entities

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

### 2.3 Update Controller to Use Domain Entities

**File:** `src/modules/job-profiles/presentation/http/controllers/job-profiles.controller.ts`

```typescript
import { Controller, Post, Body, UseGuards, Logger, BadRequestException } from '@nestjs/common';
import { ParseJobDescriptionRequestDto } from '../dto/parse-job-description-request.dto';
import { ParseJobDescriptionResponseDto } from '../dto/parse-job-description-response.dto';
import { SupabaseGuard } from '@/modules/auth/guards/supabase.guard';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { JobProfile } from '../../../domain/entities/job-profile.entity';
import { UserId } from '../../../domain/value-objects/user-id';
import { SeniorityLevel } from '../../../domain/value-objects/seniority-level';
import { Competency } from '../../../domain/entities/competency.entity';

@Controller('api/v1/job-profiles')
@UseGuards(SupabaseGuard)
export class JobProfilesController {
  private readonly logger = new Logger(JobProfilesController.name);

  @Post('parse')
  async parse(
    @Body() dto: ParseJobDescriptionRequestDto,
    @CurrentUser() user: { id: string },
  ): Promise<ParseJobDescriptionResponseDto> {
    this.logger.log(`Parsing job description for user ${user.id}`);

    if (!dto.jobUrl && !dto.rawJD) {
      throw new BadRequestException('Either jobUrl or rawJD must be provided');
    }

    // Create domain entity with placeholder data
    const jobProfile = JobProfile.createNew({
      userId: UserId.create(user.id),
      jobTitle: dto.jobTitle || 'Software Engineer (placeholder)',
      companyName: 'Example Corp (placeholder)',
      rawJD: dto.rawJD,
      jobUrl: dto.jobUrl,
      competencies: [
        Competency.create({ name: 'Programming', weight: 0.5, depth: 5 }),
        Competency.create({ name: 'Communication', weight: 0.5, depth: 5 }),
      ],
      hardSkills: ['JavaScript', 'TypeScript'],
      softSkills: ['Communication', 'Teamwork'],
      seniorityLevel: dto.seniority ? SeniorityLevel.create(dto.seniority) : SeniorityLevel.create(5),
      interviewDifficultyLevel: 5,
    });

    // Map domain entity to response DTO
    const response: ParseJobDescriptionResponseDto = {
      id: jobProfile.getId().getValue(),
      jobTitle: jobProfile.getJobTitle(),
      companyName: jobProfile.getCompanyName(),
      competencies: jobProfile.getCompetencies().map(c => ({
        name: c.getName(),
        weight: c.getWeight(),
        depth: c.getDepth(),
      })),
      hardSkills: jobProfile.getHardSkills(),
      softSkills: jobProfile.getSoftSkills(),
      seniorityLevel: jobProfile.getSeniorityLevel()?.getValue(),
      interviewDifficultyLevel: jobProfile.getInterviewDifficultyLevel(),
      createdAt: jobProfile.getCreatedAt(),
    };

    this.logger.log(`Returning job profile with id ${response.id}`);
    return response;
  }
}
```

### 2.4 Verification

```bash
npm run dev

# Test endpoint - should return same structure but using domain entities
curl -X POST http://localhost:3000/api/v1/job-profiles/parse \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"rawJD": "Looking for a senior software engineer..."}'
```

**Expected State:**
- ✅ Domain entities with business logic
- ✅ Value objects enforce validation
- ✅ Controller uses domain layer
- ✅ Response structure unchanged
- ✅ Unit tests can be written for domain layer

---

## Step 3: Application Layer - DTOs, Mappers & CQRS Command

**Goal:** Introduce proper application layer with CQRS pattern.

**Status After:**
- ✅ Command/Handler pattern implemented
- ✅ Application DTOs separate from HTTP DTOs
- ✅ Mappers handle transformations
- ✅ Controller delegates to CommandBus
- ✅ Still returns placeholder data

### 3.1 Install CQRS

```bash
npm install @nestjs/cqrs
```

### 3.2 Application DTOs

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

### 3.3 Application Mapper

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

### 3.4 Command & Handler

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

**File:** `src/modules/job-profiles/application/commands/handlers/parse-job-description.handler.ts`

```typescript
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Logger, BadRequestException } from '@nestjs/common';
import { ParseJobDescriptionCommand } from '../impl/parse-job-description.command';
import { JobProfileDto } from '../../dto/job-profile.dto';
import { JobProfileMapper } from '../../mappers/job-profile.mapper';
import { JobProfile } from '../../../domain/entities/job-profile.entity';
import { UserId } from '../../../domain/value-objects/user-id';
import { SeniorityLevel } from '../../../domain/value-objects/seniority-level';
import { Competency } from '../../../domain/entities/competency.entity';

@CommandHandler(ParseJobDescriptionCommand)
export class ParseJobDescriptionHandler implements ICommandHandler<ParseJobDescriptionCommand> {
  private readonly logger = new Logger(ParseJobDescriptionHandler.name);

  async execute(command: ParseJobDescriptionCommand): Promise<JobProfileDto> {
    this.logger.log(`Parsing job description for user ${command.userId}`);

    if (!command.jobUrl && !command.rawJD) {
      throw new BadRequestException('Either jobUrl or rawJD must be provided');
    }

    // TODO: This is still placeholder data - will be replaced with real parsing
    const jobProfile = JobProfile.createNew({
      userId: UserId.create(command.userId),
      jobTitle: command.jobTitle || 'Software Engineer (placeholder)',
      companyName: 'Example Corp (placeholder)',
      rawJD: command.rawJD,
      jobUrl: command.jobUrl,
      competencies: [
        Competency.create({ name: 'Programming', weight: 0.5, depth: 5 }),
        Competency.create({ name: 'Communication', weight: 0.5, depth: 5 }),
      ],
      hardSkills: ['JavaScript', 'TypeScript'],
      softSkills: ['Communication', 'Teamwork'],
      seniorityLevel: command.seniority
        ? SeniorityLevel.create(command.seniority)
        : SeniorityLevel.create(5),
      interviewDifficultyLevel: 5,
    });

    this.logger.log(`Created job profile with id ${jobProfile.getId().getValue()}`);
    return JobProfileMapper.toDto(jobProfile);
  }
}
```

### 3.5 HTTP Mapper

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

### 3.6 Update Controller

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

### 3.7 Update Module

**File:** `src/modules/job-profiles/job-profiles.module.ts`

```typescript
import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { JobProfilesController } from './presentation/http/controllers/job-profiles.controller';
import { ParseJobDescriptionHandler } from './application/commands/handlers/parse-job-description.handler';

const CommandHandlers = [ParseJobDescriptionHandler];

@Module({
  imports: [CqrsModule],
  controllers: [JobProfilesController],
  providers: [...CommandHandlers],
})
export class JobProfilesModule {}
```

### 3.8 Verification

```bash
npm run dev

# Test - response should be identical but now going through CQRS pipeline
curl -X POST http://localhost:3000/api/v1/job-profiles/parse \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"rawJD": "Looking for a senior software engineer..."}'
```

**Expected State:**
- ✅ CQRS pattern implemented
- ✅ Clear separation: HTTP → Command → Handler → Domain
- ✅ Mappers at layer boundaries
- ✅ Endpoint returns same structure
- ✅ Ready to add real services

---

## Step 4: Text Normalization Service

**Goal:** Add real text normalization for raw JD input.

**Status After:**
- ✅ JD Extractor service normalizes raw text
- ✅ Handler uses service for text processing
- ✅ Endpoint processes real raw JD input
- ✅ Still returns placeholder competencies/skills

### 4.1 JD Extractor Service

**File:** `src/modules/job-profiles/infrastructure/services/jd-extractor.service.ts`

```typescript
import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class JdExtractorService {
  private readonly logger = new Logger(JdExtractorService.name);

  normalizeRawJD(rawJD: string): string {
    this.logger.log('Normalizing raw JD text');

    // Clean up whitespace and normalize line breaks
    const normalized = rawJD
      .replace(/\s+/g, ' ')
      .replace(/\n+/g, '\n')
      .trim();

    this.logger.log(`Normalized JD: ${normalized.length} characters`);
    return normalized;
  }
}
```

### 4.2 Update Handler

**File:** `src/modules/job-profiles/application/commands/handlers/parse-job-description.handler.ts`

```typescript
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Logger, BadRequestException } from '@nestjs/common';
import { ParseJobDescriptionCommand } from '../impl/parse-job-description.command';
import { JobProfileDto } from '../../dto/job-profile.dto';
import { JobProfileMapper } from '../../mappers/job-profile.mapper';
import { JobProfile } from '../../../domain/entities/job-profile.entity';
import { UserId } from '../../../domain/value-objects/user-id';
import { SeniorityLevel } from '../../../domain/value-objects/seniority-level';
import { Competency } from '../../../domain/entities/competency.entity';
import { JdExtractorService } from '../../../infrastructure/services/jd-extractor.service';

@CommandHandler(ParseJobDescriptionCommand)
export class ParseJobDescriptionHandler implements ICommandHandler<ParseJobDescriptionCommand> {
  private readonly logger = new Logger(ParseJobDescriptionHandler.name);

  constructor(private readonly jdExtractor: JdExtractorService) {}

  async execute(command: ParseJobDescriptionCommand): Promise<JobProfileDto> {
    this.logger.log(`Parsing job description for user ${command.userId}`);

    if (!command.jobUrl && !command.rawJD) {
      throw new BadRequestException('Either jobUrl or rawJD must be provided');
    }

    // Normalize the raw JD if provided
    let normalizedText: string | undefined;
    if (command.rawJD) {
      normalizedText = this.jdExtractor.normalizeRawJD(command.rawJD);
      this.logger.log(`Normalized JD text: ${normalizedText.substring(0, 100)}...`);
    }

    // TODO: Actual parsing still placeholder - will add Claude in next step
    const jobProfile = JobProfile.createNew({
      userId: UserId.create(command.userId),
      jobTitle: command.jobTitle || 'Software Engineer (placeholder)',
      companyName: 'Example Corp (placeholder)',
      rawJD: normalizedText || command.rawJD,
      jobUrl: command.jobUrl,
      competencies: [
        Competency.create({ name: 'Programming', weight: 0.5, depth: 5 }),
        Competency.create({ name: 'Communication', weight: 0.5, depth: 5 }),
      ],
      hardSkills: ['JavaScript', 'TypeScript'],
      softSkills: ['Communication', 'Teamwork'],
      seniorityLevel: command.seniority
        ? SeniorityLevel.create(command.seniority)
        : SeniorityLevel.create(5),
      interviewDifficultyLevel: 5,
    });

    this.logger.log(`Created job profile with id ${jobProfile.getId().getValue()}`);
    return JobProfileMapper.toDto(jobProfile);
  }
}
```

### 4.3 Update Module

**File:** `src/modules/job-profiles/job-profiles.module.ts`

```typescript
import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { JobProfilesController } from './presentation/http/controllers/job-profiles.controller';
import { ParseJobDescriptionHandler } from './application/commands/handlers/parse-job-description.handler';
import { JdExtractorService } from './infrastructure/services/jd-extractor.service';

const CommandHandlers = [ParseJobDescriptionHandler];
const Services = [JdExtractorService];

@Module({
  imports: [CqrsModule],
  controllers: [JobProfilesController],
  providers: [...CommandHandlers, ...Services],
})
export class JobProfilesModule {}
```

### 4.4 Verification

```bash
npm run dev

# Test with raw JD - text should be normalized
curl -X POST http://localhost:3000/api/v1/job-profiles/parse \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"rawJD": "We are    looking\n\n\nfor   a senior    software engineer..."}'
```

**Expected State:**
- ✅ Raw JD text gets normalized
- ✅ Service layer added
- ✅ Still returns placeholder skills/competencies
- ✅ Ready to add database persistence

---

## Step 5: Database Persistence

**Goal:** Save job profiles to database and return real persisted data.

**Status After:**
- ✅ Repository implemented
- ✅ Persistence mappers working
- ✅ Job profiles saved to PostgreSQL
- ✅ Endpoint returns data with real DB-generated ID
- ✅ Still uses placeholder competencies

### 5.1 Domain Repository Interface & Errors

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

### 5.2 Persistence Mapper

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

### 5.3 Repository Implementation

**File:** `src/modules/job-profiles/infrastructure/persistence/repositories/job-profile.repository.ts`

```typescript
import { Injectable, Inject } from '@nestjs/common';
import { eq, and, isNull } from 'drizzle-orm';
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
      conditions.push(isNull(jobProfiles.deletedAt));
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
      conditions.push(isNull(jobProfiles.deletedAt));
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
      conditions.push(isNull(jobProfiles.deletedAt));
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

### 5.4 Update Handler to Use Repository

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
import { JdExtractorService } from '../../../infrastructure/services/jd-extractor.service';

@CommandHandler(ParseJobDescriptionCommand)
export class ParseJobDescriptionHandler implements ICommandHandler<ParseJobDescriptionCommand> {
  private readonly logger = new Logger(ParseJobDescriptionHandler.name);

  constructor(
    @Inject(JOB_PROFILE_REPOSITORY)
    private readonly repository: IJobProfileRepository,
    private readonly jdExtractor: JdExtractorService,
  ) {}

  async execute(command: ParseJobDescriptionCommand): Promise<JobProfileDto> {
    this.logger.log(`Parsing job description for user ${command.userId}`);

    if (!command.jobUrl && !command.rawJD) {
      throw new BadRequestException('Either jobUrl or rawJD must be provided');
    }

    // Normalize the raw JD if provided
    let normalizedText: string | undefined;
    if (command.rawJD) {
      normalizedText = this.jdExtractor.normalizeRawJD(command.rawJD);
    }

    // TODO: Actual parsing still placeholder - will add Claude in next step
    const jobProfile = JobProfile.createNew({
      userId: UserId.create(command.userId),
      jobTitle: command.jobTitle || 'Software Engineer (placeholder)',
      companyName: 'Example Corp (placeholder)',
      rawJD: normalizedText || command.rawJD,
      jobUrl: command.jobUrl,
      competencies: [
        Competency.create({ name: 'Programming', weight: 0.5, depth: 5 }),
        Competency.create({ name: 'Communication', weight: 0.5, depth: 5 }),
      ],
      hardSkills: ['JavaScript', 'TypeScript'],
      softSkills: ['Communication', 'Teamwork'],
      seniorityLevel: command.seniority
        ? SeniorityLevel.create(command.seniority)
        : SeniorityLevel.create(5),
      interviewDifficultyLevel: 5,
    });

    // Save to database
    await this.repository.save(jobProfile);
    this.logger.log(`Saved job profile to database with id ${jobProfile.getId().getValue()}`);

    return JobProfileMapper.toDto(jobProfile);
  }
}
```

### 5.5 Update Module

**File:** `src/modules/job-profiles/job-profiles.module.ts`

```typescript
import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { ConfigModule } from '@nestjs/config';
import { JobProfilesController } from './presentation/http/controllers/job-profiles.controller';
import { ParseJobDescriptionHandler } from './application/commands/handlers/parse-job-description.handler';
import { JdExtractorService } from './infrastructure/services/jd-extractor.service';
import { JobProfileRepository } from './infrastructure/persistence/repositories/job-profile.repository';
import { JOB_PROFILE_REPOSITORY } from './domain/repositories/job-profile.repository.interface';
import { DatabaseModule } from '@/database/database.module';

const CommandHandlers = [ParseJobDescriptionHandler];
const Services = [JdExtractorService];
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
})
export class JobProfilesModule {}
```

### 5.6 Verification

```bash
npm run dev

# Test - data should be saved to database
curl -X POST http://localhost:3000/api/v1/job-profiles/parse \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"rawJD": "Looking for a senior software engineer..."}'

# Check database
npm run db:studio
# Navigate to job_profiles table - should see new record
```

**Expected State:**
- ✅ Job profiles persisted to PostgreSQL
- ✅ Returns real DB-generated data
- ✅ Repository pattern working
- ✅ Still uses placeholder competencies
- ✅ Ready to add HTML fetching

---

## Step 6: HTML Fetching & Text Extraction

**Goal:** Add ability to fetch and parse job URLs.

**Status After:**
- ✅ Can accept `jobUrl` parameter
- ✅ Fetches HTML from URL
- ✅ Extracts clean text from HTML
- ✅ Both rawJD and jobUrl inputs work
- ✅ Still uses placeholder competencies

### 6.1 HTML Fetcher Service

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

      this.logger.log(`Successfully fetched HTML: ${response.data.length} characters`);
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

### 6.2 Update JD Extractor Service

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
    this.logger.log('Normalizing raw JD text');

    // Clean up whitespace and normalize line breaks
    const normalized = rawJD
      .replace(/\s+/g, ' ')
      .replace(/\n+/g, '\n')
      .trim();

    this.logger.log(`Normalized JD: ${normalized.length} characters`);
    return normalized;
  }
}
```

### 6.3 Update Handler

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

@CommandHandler(ParseJobDescriptionCommand)
export class ParseJobDescriptionHandler implements ICommandHandler<ParseJobDescriptionCommand> {
  private readonly logger = new Logger(ParseJobDescriptionHandler.name);

  constructor(
    @Inject(JOB_PROFILE_REPOSITORY)
    private readonly repository: IJobProfileRepository,
    private readonly htmlFetcher: HtmlFetcherService,
    private readonly jdExtractor: JdExtractorService,
  ) {}

  async execute(command: ParseJobDescriptionCommand): Promise<JobProfileDto> {
    this.logger.log(`Parsing job description for user ${command.userId}`);

    if (!command.jobUrl && !command.rawJD) {
      throw new BadRequestException('Either jobUrl or rawJD must be provided');
    }

    // Step 1: Get job description text
    let jdText: string;
    let jobUrl: string | undefined;

    if (command.jobUrl) {
      // Fetch HTML from URL
      const html = await this.htmlFetcher.fetchHtml(command.jobUrl);

      // Extract text from HTML
      jdText = this.jdExtractor.extractTextFromHtml(html);
      jobUrl = command.jobUrl;

      this.logger.log(`Extracted text from URL: ${jdText.substring(0, 100)}...`);
    } else if (command.rawJD) {
      // Use raw JD directly
      jdText = this.jdExtractor.normalizeRawJD(command.rawJD);
    }

    // TODO: Actual parsing still placeholder - will add Claude in next step
    const jobProfile = JobProfile.createNew({
      userId: UserId.create(command.userId),
      jobTitle: command.jobTitle || 'Software Engineer (placeholder)',
      companyName: 'Example Corp (placeholder)',
      rawJD: command.rawJD,
      jobUrl: jobUrl,
      competencies: [
        Competency.create({ name: 'Programming', weight: 0.5, depth: 5 }),
        Competency.create({ name: 'Communication', weight: 0.5, depth: 5 }),
      ],
      hardSkills: ['JavaScript', 'TypeScript'],
      softSkills: ['Communication', 'Teamwork'],
      seniorityLevel: command.seniority
        ? SeniorityLevel.create(command.seniority)
        : SeniorityLevel.create(5),
      interviewDifficultyLevel: 5,
    });

    // Save to database
    await this.repository.save(jobProfile);
    this.logger.log(`Saved job profile to database with id ${jobProfile.getId().getValue()}`);

    return JobProfileMapper.toDto(jobProfile);
  }
}
```

### 6.4 Update Module

**File:** `src/modules/job-profiles/job-profiles.module.ts`

```typescript
import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { ConfigModule } from '@nestjs/config';
import { JobProfilesController } from './presentation/http/controllers/job-profiles.controller';
import { ParseJobDescriptionHandler } from './application/commands/handlers/parse-job-description.handler';
import { HtmlFetcherService } from './infrastructure/services/html-fetcher.service';
import { JdExtractorService } from './infrastructure/services/jd-extractor.service';
import { JobProfileRepository } from './infrastructure/persistence/repositories/job-profile.repository';
import { JOB_PROFILE_REPOSITORY } from './domain/repositories/job-profile.repository.interface';
import { DatabaseModule } from '@/database/database.module';

const CommandHandlers = [ParseJobDescriptionHandler];
const Services = [HtmlFetcherService, JdExtractorService];
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
})
export class JobProfilesModule {}
```

### 6.5 Verification

```bash
npm run dev

# Test with raw JD
curl -X POST http://localhost:3000/api/v1/job-profiles/parse \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"rawJD": "Looking for a senior software engineer..."}'

# Test with URL (use a real job posting URL)
curl -X POST http://localhost:3000/api/v1/job-profiles/parse \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"jobUrl": "https://example.com/jobs/senior-engineer"}'
```

**Expected State:**
- ✅ Both rawJD and jobUrl inputs work
- ✅ HTML fetching and extraction functional
- ✅ Text properly normalized
- ✅ Data saved to database
- ✅ Still uses placeholder competencies
- ✅ Ready for Claude integration

---

## Step 7: AI Integration with Vercel AI SDK

**Goal:** Replace placeholder competencies with real AI-powered parsing using Vercel AI SDK.

**Status After:**
- ✅ **FULLY FUNCTIONAL ENDPOINT**
- ✅ Real structured extraction from job descriptions
- ✅ Competencies, skills, seniority all parsed by AI
- ✅ Model-agnostic architecture (initially using OpenAI)
- ✅ Production-ready parsing logic

### 7.1 AI Parser Service (Model-Agnostic)

**File:** `src/modules/job-profiles/infrastructure/services/ai-parser.service.ts`

```typescript
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { generateObject } from 'ai';
import { openai } from '@ai-sdk/openai';
import { z } from 'zod';
import { JobDescriptionParsingError } from '../../domain/errors/job-profile.errors';

// Zod schema for structured output validation
const ParsedJobDescriptionSchema = z.object({
  job_title: z.string(),
  company_name: z.string().nullable().optional(),
  seniority_level: z.number().min(1).max(10),
  competencies: z.array(
    z.object({
      name: z.string(),
      weight: z.number().min(0).max(1),
      depth: z.number().min(1).max(10),
    }),
  ).min(3).max(7),
  hard_skills: z.array(z.string()),
  soft_skills: z.array(z.string()),
  interview_difficulty_level: z.number().min(1).max(10),
});

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
export class AiParserService {
  private readonly logger = new Logger(AiParserService.name);
  private readonly model: any;

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('OPENAI_API_KEY');
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY is not configured');
    }

    // Initialize model - can be easily switched to other providers
    // Examples:
    // - openai('gpt-4-turbo') for OpenAI
    // - anthropic('claude-3-5-sonnet-20241022') for Anthropic
    // - google('gemini-pro') for Google
    const modelName = this.configService.get<string>('AI_MODEL') || 'gpt-4o';
    this.model = openai(modelName);

    this.logger.log(`Initialized AI parser with model: ${modelName}`);
  }

  async parseJobDescription(jdText: string): Promise<ParsedJobDescription> {
    try {
      this.logger.log('Calling AI API to parse job description');

      const prompt = this.buildPrompt(jdText);

      // Use Vercel AI SDK's generateObject for structured output
      const { object } = await generateObject({
        model: this.model,
        schema: ParsedJobDescriptionSchema,
        prompt,
      });

      this.logger.log('Successfully parsed job description with AI');

      // Normalize competency weights to sum to 1.0
      const normalized = this.normalizeCompetencyWeights(object);

      return normalized as ParsedJobDescription;
    } catch (error) {
      this.logger.error(`Failed to parse job description: ${error.message}`);
      if (error instanceof JobDescriptionParsingError) {
        throw error;
      }
      throw new JobDescriptionParsingError(error.message);
    }
  }

  private buildPrompt(jdText: string): string {
    return `Extract structured information from the following job description.

Rules:
- Extract the job title and company name (if mentioned)
- Determine seniority level (1=junior, 5=mid, 10=senior/principal)
- Identify 3-7 key competencies with:
  * name: specific competency (e.g., 'System Design', 'API Development')
  * weight: importance in the job (0-1, higher = more important)
  * depth: expertise level required (1-10, higher = more expertise)
- List hard skills (technical skills explicitly mentioned)
- List soft skills (communication, leadership, etc.)
- Estimate interview difficulty level (1-10) based on seniority and requirements

Job Description:
${jdText}`;
  }

  private normalizeCompetencyWeights(data: any): any {
    const totalWeight = data.competencies.reduce(
      (sum: number, c: { weight: number }) => sum + c.weight,
      0,
    );

    if (totalWeight > 0) {
      return {
        ...data,
        competencies: data.competencies.map(
          (c: { name: string; weight: number; depth: number }) => ({
            ...c,
            weight: c.weight / totalWeight, // Normalize to sum to 1
          }),
        ),
      };
    }

    return data;
  }
}
```

### 7.2 Update Handler with AI Integration

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
import { AiParserService } from '../../../infrastructure/services/ai-parser.service';

@CommandHandler(ParseJobDescriptionCommand)
export class ParseJobDescriptionHandler implements ICommandHandler<ParseJobDescriptionCommand> {
  private readonly logger = new Logger(ParseJobDescriptionHandler.name);

  constructor(
    @Inject(JOB_PROFILE_REPOSITORY)
    private readonly repository: IJobProfileRepository,
    private readonly htmlFetcher: HtmlFetcherService,
    private readonly jdExtractor: JdExtractorService,
    private readonly aiParser: AiParserService,
  ) {}

  async execute(command: ParseJobDescriptionCommand): Promise<JobProfileDto> {
    this.logger.log(`Parsing job description for user ${command.userId}`);

    if (!command.jobUrl && !command.rawJD) {
      throw new BadRequestException('Either jobUrl or rawJD must be provided');
    }

    // Step 1: Get job description text
    let jdText: string;
    let jobUrl: string | undefined;

    if (command.jobUrl) {
      // Fetch HTML from URL
      const html = await this.htmlFetcher.fetchHtml(command.jobUrl);

      // Extract text from HTML
      jdText = this.jdExtractor.extractTextFromHtml(html);
      jobUrl = command.jobUrl;
    } else if (command.rawJD) {
      // Use raw JD directly
      jdText = this.jdExtractor.normalizeRawJD(command.rawJD);
    }

    // Step 2: Call AI API with structured output
    const parsedData = await this.aiParser.parseJobDescription(jdText);

    // Step 3: Create domain entity
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

    // Step 4: Store in PostgreSQL via Drizzle
    await this.repository.save(jobProfile);
    this.logger.log(`Job profile created with id ${jobProfile.getId().getValue()}`);

    // Return DTO
    return JobProfileMapper.toDto(jobProfile);
  }
}
```

### 7.3 Update Module

**File:** `src/modules/job-profiles/job-profiles.module.ts`

```typescript
import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { ConfigModule } from '@nestjs/config';
import { JobProfilesController } from './presentation/http/controllers/job-profiles.controller';
import { ParseJobDescriptionHandler } from './application/commands/handlers/parse-job-description.handler';
import { HtmlFetcherService } from './infrastructure/services/html-fetcher.service';
import { JdExtractorService } from './infrastructure/services/jd-extractor.service';
import { AiParserService } from './infrastructure/services/ai-parser.service';
import { JobProfileRepository } from './infrastructure/persistence/repositories/job-profile.repository';
import { JOB_PROFILE_REPOSITORY } from './domain/repositories/job-profile.repository.interface';
import { DatabaseModule } from '@/database/database.module';

const CommandHandlers = [ParseJobDescriptionHandler];
const Services = [HtmlFetcherService, JdExtractorService, AiParserService];
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
})
export class JobProfilesModule {}
```

### 7.4 Environment Variables

Add to `.env`:

```bash
# AI Configuration
OPENAI_API_KEY=sk-your-openai-api-key-here
AI_MODEL=gpt-4o  # or gpt-4-turbo, gpt-3.5-turbo, etc.

# Alternative providers (for future use):
# ANTHROPIC_API_KEY=your-anthropic-key  # for Claude
# GOOGLE_API_KEY=your-google-key        # for Gemini
```

### 7.5 Model Provider Configuration Examples

The service can be easily switched between providers by changing the model initialization:

```typescript
// OpenAI (current default)
import { openai } from '@ai-sdk/openai';
this.model = openai('gpt-4o');

// Anthropic Claude
import { anthropic } from '@ai-sdk/anthropic';
this.model = anthropic('claude-3-5-sonnet-20241022');

// Google Gemini
import { google } from '@ai-sdk/google';
this.model = google('gemini-pro');

// Mistral
import { mistral } from '@ai-sdk/mistral';
this.model = mistral('mistral-large');
```

### 7.6 Verification

```bash
npm run dev

# Test with real job description
curl -X POST http://localhost:3000/api/v1/job-profiles/parse \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "rawJD": "We are looking for a Senior Software Engineer with 5+ years of experience in TypeScript, Node.js, and React. Strong system design skills required. Must have excellent communication and leadership abilities."
  }'

# Expected: Real parsed data with accurate competencies, skills, and seniority
```

**Expected State:**
- ✅ **PRODUCTION-READY ENDPOINT**
- ✅ Real AI-powered parsing
- ✅ Accurate competency extraction
- ✅ Skills and seniority properly identified
- ✅ Data persisted to database
- ✅ Full feature working end-to-end

---

## Step 8: Tests & Documentation

**Goal:** Add comprehensive tests and documentation.

**Status After:**
- ✅ Unit tests for domain entities
- ✅ Unit tests for services
- ✅ Unit tests for handler
- ✅ E2E tests for controller
- ✅ Module documentation
- ✅ Production ready

### 8.1 Domain Entity Tests

**File:** `src/modules/job-profiles/domain/entities/job-profile.entity.spec.ts`

```typescript
import { JobProfile } from './job-profile.entity';
import { UserId } from '../value-objects/user-id';
import { SeniorityLevel } from '../value-objects/seniority-level';
import { Competency } from './competency.entity';

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
      competencies: [Competency.create({ name: 'Programming', weight: 1, depth: 5 })],
    });

    expect(profile.getJobTitle()).toBe('Updated Title');
    expect(profile.getSeniorityLevel()?.getValue()).toBe(5);
    expect(profile.getCompetencies()).toHaveLength(1);
  });

  it('should support soft delete', () => {
    const profile = JobProfile.createNew({
      userId: UserId.create('user-123'),
      rawJD: 'Test',
    });

    expect(profile.isDeleted()).toBe(false);

    profile.softDelete();

    expect(profile.isDeleted()).toBe(true);
    expect(profile.getDeletedAt()).toBeDefined();
  });
});
```

### 8.2 Service Tests

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

### 8.3 Handler Tests

**File:** `src/modules/job-profiles/application/commands/handlers/parse-job-description.handler.spec.ts`

```typescript
import { Test } from '@nestjs/testing';
import { ParseJobDescriptionHandler } from './parse-job-description.handler';
import { ParseJobDescriptionCommand } from '../impl/parse-job-description.command';
import { JOB_PROFILE_REPOSITORY } from '../../../domain/repositories/job-profile.repository.interface';
import { HtmlFetcherService } from '../../../infrastructure/services/html-fetcher.service';
import { JdExtractorService } from '../../../infrastructure/services/jd-extractor.service';
import { AiParserService } from '../../../infrastructure/services/ai-parser.service';

describe('ParseJobDescriptionHandler', () => {
  let handler: ParseJobDescriptionHandler;
  let mockRepository: any;
  let mockAiParser: any;

  beforeEach(async () => {
    mockRepository = { save: jest.fn() };
    mockAiParser = {
      parseJobDescription: jest.fn().mockResolvedValue({
        job_title: 'Senior Engineer',
        seniority_level: 7,
        competencies: [{ name: 'System Design', weight: 0.5, depth: 8 }],
        hard_skills: ['TypeScript'],
        soft_skills: ['Communication'],
        interview_difficulty_level: 7,
      }),
    };

    const module = await Test.createTestingModule({
      providers: [
        ParseJobDescriptionHandler,
        { provide: JOB_PROFILE_REPOSITORY, useValue: mockRepository },
        { provide: HtmlFetcherService, useValue: {} },
        { provide: JdExtractorService, useValue: { normalizeRawJD: (t) => t } },
        { provide: AiParserService, useValue: mockAiParser },
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

    const result = await handler.execute(command);

    expect(result.jobTitle).toBe('Senior Engineer');
    expect(mockRepository.save).toHaveBeenCalled();
  });
});
```

### 8.4 E2E Controller Tests

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
});
```

### 8.5 Module README

**File:** `src/modules/job-profiles/README.md`

```markdown
# Job Profiles Module

## Overview

Parses job descriptions using AI (via Vercel AI SDK) to extract structured competency data. Model-agnostic design supports OpenAI, Anthropic, Google, and other providers.

## Features

- **Parse Job Description** (FR-JP-001)
  - Accept raw text or job URL
  - Extract competencies with weights and depth
  - Identify hard/soft skills
  - Estimate seniority and interview difficulty
  - Model-agnostic AI parsing (initially using OpenAI)

## API

### POST /api/v1/job-profiles/parse

**Auth:** Required (JWT)

**Request:**
```json
{
  "jobUrl": "https://example.com/job",     // Optional
  "rawJD": "Job description text...",      // Optional
  "jobTitle": "Senior Engineer",           // Optional
  "seniority": 7                           // Optional (1-10)
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
  "createdAt": "2026-01-19T00:00:00Z"
}
```

## Architecture

- **CQRS**: Commands via CommandBus
- **Domain-Driven**: Rich entities with business logic
- **Clean Architecture**: Clear layer separation
- **Type-Safe**: Drizzle ORM with TypeScript
- **AI-Agnostic**: Vercel AI SDK for flexible model selection

## AI Configuration

Configure AI provider in `.env`:

```bash
# OpenAI (default)
OPENAI_API_KEY=sk-...
AI_MODEL=gpt-4o

# Or use other providers:
# ANTHROPIC_API_KEY=sk-ant-...
# GOOGLE_API_KEY=...
```

Switching providers requires only a code change in `ai-parser.service.ts`:

```typescript
// OpenAI
this.model = openai('gpt-4o');

// Anthropic
this.model = anthropic('claude-3-5-sonnet-20241022');

// Google
this.model = google('gemini-pro');
```

## Dependencies

- `ai` - Vercel AI SDK
- `@ai-sdk/openai` - OpenAI provider
- `zod` - Schema validation
- `axios` - HTTP client
- `cheerio` - HTML parsing
```

### 8.6 Verification

```bash
# Run all tests
npm test

# Run with coverage
npm run test:cov

# Lint
npm run lint

# Start app
npm run dev

# Full E2E test
curl -X POST http://localhost:3000/api/v1/job-profiles/parse \
  -H "Authorization: Bearer YOUR_JWT" \
  -H "Content-Type: application/json" \
  -d '{"rawJD": "Senior engineer role..."}'
```

**Expected State:**
- ✅ All tests passing
- ✅ Code coverage > 80%
- ✅ Documentation complete
- ✅ **PRODUCTION READY**

---

## Summary

This iterative approach ensures:

1. **Working endpoint from Step 1** - can be tested immediately
2. **Incremental value** - each step adds real functionality
3. **Continuous integration** - app never breaks
4. **Easier debugging** - issues isolated to recent changes
5. **Better understanding** - see how layers connect progressively

| Step | Endpoint Status | What's Real |
|------|----------------|-------------|
| 1 | ✅ Returns 200 | Validation, auth, structure |
| 2 | ✅ Returns 200 | Domain entities |
| 3 | ✅ Returns 200 | CQRS pattern, mappers |
| 4 | ✅ Returns 200 | Text normalization |
| 5 | ✅ Returns 200 | Database persistence |
| 6 | ✅ Returns 200 | HTML fetching |
| 7 | ✅ **PRODUCTION** | **AI parsing with Vercel AI SDK - FULL FEATURE** |
| 8 | ✅ **PRODUCTION** | **Tests & docs** |

---

## Key Differences from Original Plan

### Architecture Changes

1. **AI Integration**:
   - ❌ Direct Anthropic SDK (`@anthropic-ai/sdk`)
   - ✅ Vercel AI SDK (`ai`) with OpenAI provider initially
   - Benefits: Model-agnostic, structured output with Zod validation, easy provider switching

2. **Service Naming**:
   - ❌ `ClaudeParserService`
   - ✅ `AiParserService`
   - Reflects provider-agnostic design

3. **Dependencies**:
   ```bash
   # Removed
   - @anthropic-ai/sdk

   # Added
   + ai (Vercel AI SDK)
   + @ai-sdk/openai (OpenAI provider)
   + zod (already in project for validation)
   ```

4. **Environment Variables**:
   ```bash
   # Removed
   - CLAUDE_API_KEY

   # Added
   + OPENAI_API_KEY
   + AI_MODEL (optional, defaults to gpt-4o)
   ```

### Provider Flexibility Examples

Switching from OpenAI to Anthropic Claude:

```typescript
// 1. Install provider package
npm install @ai-sdk/anthropic

// 2. Update imports in ai-parser.service.ts
import { anthropic } from '@ai-sdk/anthropic';

// 3. Change model initialization
this.model = anthropic('claude-3-5-sonnet-20241022');

// 4. Update environment variables
ANTHROPIC_API_KEY=sk-ant-...
AI_MODEL=claude-3-5-sonnet-20241022
```

Switching to Google Gemini:

```typescript
// 1. Install provider
npm install @ai-sdk/google

// 2. Update service
import { google } from '@ai-sdk/google';
this.model = google('gemini-pro');

// 3. Environment
GOOGLE_API_KEY=...
AI_MODEL=gemini-pro
```

---

**Document Status:** ✅ Ready for Iterative Implementation with Vercel AI SDK
**Last Updated:** 2026-01-19
**Module:** job-profiles
**Feature:** FR-JP-001 Parse Job Description (Iterative)
**AI Provider:** OpenAI (gpt-4o) via Vercel AI SDK
