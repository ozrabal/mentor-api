# FR-JP-004: Update Job Profile - Iterative Implementation Plan

**Module:** `job-profiles`
**Feature:** Update Job Profile
**Version:** 1.0 (Iterative)
**Date:** 2026-01-31
**Status:** Ready for Implementation

---

## Quick Start Guide

### Key Files to Create/Modify

1. **Application**: `src/modules/job-profiles/application/commands/impl/update-job-profile.command.ts`
2. **Application**: `src/modules/job-profiles/application/commands/handlers/update-job-profile.handler.ts`
3. **Presentation**: `src/modules/job-profiles/presentation/http/dto/update-job-profile-request.dto.ts`
4. **Presentation**: `src/modules/job-profiles/presentation/http/dto/update-job-profile-response.dto.ts`
5. **Presentation**: Update `src/modules/job-profiles/presentation/http/controllers/job-profiles.controller.ts`
6. **Module**: Update `src/modules/job-profiles/job-profiles.module.ts`

### Implementation Strategy

Follow steps 1-4 sequentially. After each step, the endpoint should work and return a response (even if placeholder initially).

---

## Overview

This document provides an **iterative and incremental** implementation plan for the Update Job Profile feature (FR-JP-004). This approach prioritizes having a **working endpoint from the start** that returns responses after each step, even if they're placeholder responses initially.

### Key Principles

1. **Endpoint First**: Create the HTTP endpoint in Step 1 so it can be invoked immediately
2. **Incremental Enhancement**: Each step adds real functionality while maintaining a working endpoint
3. **Continuous Testing**: The endpoint can be tested after every step
4. **Minimal Viable Slices**: Each step delivers a complete vertical slice through all layers

### Architecture Context

The existing `job-profiles` module already includes:

- **Domain entity** (`JobProfile`) with `updateParsedData()` method
- **Repository interface** (`IJobProfileRepository`) with `save()`, `findById()` methods
- **Application DTOs** (`JobProfileDto`) and mappers
- **Presentation controllers** for Parse, Get, Search operations

We will add an Update Command and HTTP DTOs for updating a job profile.

### Update Scope

According to the PRD, users should be able to update:

- Job title
- Company name
- Competencies (parsed data)
- Hard skills
- Soft skills
- Seniority level
- Interview difficulty level

**Note:** `jobUrl` and `rawJD` are immutable after creation (they represent the source). To change these, users should create a new job profile.

---

## Implementation Steps Overview

| Step | What Gets Added | Endpoint Returns |
| ---- | --------------- | ---------------- |
| 1 | Basic endpoint structure + minimal command wiring | Placeholder response with updated timestamp |
| 2 | Real repository query + authorization + domain update | Returns actual updated job profile from DB |
| 3 | Full HTTP request/response DTOs + proper validation | Complete validated request/response with all fields |
| 4 | Tests + documentation | Production ready |

---

## Step 1: Basic Endpoint Structure

**Goal:** Create working endpoint that accepts requests and returns placeholder response.

**Status After:**

- ✅ Endpoint `PATCH /api/v1/job-profiles/:jobProfileId` responds with 200
- ✅ Accepts PATCH request with ID parameter and body
- ✅ Returns placeholder updated profile
- ✅ Authentication required
- ✅ Basic validation works

### 1.1 Presentation Layer - Request/Response DTOs

**File:** `src/modules/job-profiles/presentation/http/dto/update-job-profile-request.dto.ts`

```typescript
import { ApiProperty } from "@nestjs/swagger";
import { IsOptional, IsString, IsNumber, IsArray, Min, Max } from "class-validator";

export class UpdateJobProfileRequestDto {
  @ApiProperty({
    description: "Job title",
    example: "Senior Software Engineer",
    required: false,
  })
  @IsOptional()
  @IsString()
  jobTitle?: string;

  @ApiProperty({
    description: "Company name",
    example: "Tech Corp",
    required: false,
  })
  @IsOptional()
  @IsString()
  companyName?: string;

  @ApiProperty({
    description: "Competencies with name, weight (0-1), and depth (1-10)",
    example: [
      { name: "System Design", weight: 0.3, depth: 8 },
      { name: "Programming", weight: 0.4, depth: 9 },
    ],
    required: false,
    type: "array",
  })
  @IsOptional()
  @IsArray()
  competencies?: Array<{
    name: string;
    weight: number;
    depth: number;
  }>;

  @ApiProperty({
    description: "List of hard skills",
    example: ["TypeScript", "NestJS", "PostgreSQL", "Docker"],
    required: false,
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  hardSkills?: string[];

  @ApiProperty({
    description: "List of soft skills",
    example: ["Communication", "Leadership", "Problem Solving"],
    required: false,
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  softSkills?: string[];

  @ApiProperty({
    description: "Seniority level (1-10)",
    example: 7,
    maximum: 10,
    minimum: 1,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(10)
  seniorityLevel?: number;

  @ApiProperty({
    description: "Interview difficulty level (1-10)",
    example: 8,
    maximum: 10,
    minimum: 1,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(10)
  interviewDifficultyLevel?: number;
}
```

**File:** `src/modules/job-profiles/presentation/http/dto/update-job-profile-response.dto.ts`

```typescript
import { ApiProperty } from "@nestjs/swagger";

export class CompetencyDto {
  @ApiProperty({ example: "System Design" })
  name!: string;

  @ApiProperty({ example: 0.3, maximum: 1, minimum: 0 })
  weight!: number;

  @ApiProperty({ example: 8, maximum: 10, minimum: 1 })
  depth!: number;
}

export class UpdateJobProfileResponseDto {
  @ApiProperty({ example: "550e8400-e29b-41d4-a716-446655440000" })
  id!: string;

  @ApiProperty({ example: "user-123" })
  userId!: string;

  @ApiProperty({ example: "Senior Software Engineer", required: false })
  jobTitle?: string;

  @ApiProperty({ example: "Tech Corp", required: false })
  companyName?: string;

  @ApiProperty({
    example: "https://example.com/jobs/senior-engineer",
    required: false,
  })
  jobUrl?: string;

  @ApiProperty({
    example: "We are looking for a senior engineer...",
    required: false,
  })
  rawJD?: string;

  @ApiProperty({ type: [CompetencyDto] })
  competencies!: CompetencyDto[];

  @ApiProperty({
    example: ["TypeScript", "NestJS", "PostgreSQL"],
    type: [String],
  })
  hardSkills!: string[];

  @ApiProperty({
    example: ["Communication", "Leadership", "Mentoring"],
    type: [String],
  })
  softSkills!: string[];

  @ApiProperty({ example: 7, maximum: 10, minimum: 1, required: false })
  seniorityLevel?: number;

  @ApiProperty({ example: 8, maximum: 10, minimum: 1, required: false })
  interviewDifficultyLevel?: number;

  @ApiProperty({ example: "2026-01-27T10:00:00Z" })
  createdAt!: Date;

  @ApiProperty({ example: "2026-01-31T15:30:00Z" })
  updatedAt!: Date;
}
```

### 1.2 Application Layer - Command

**File:** `src/modules/job-profiles/application/commands/impl/update-job-profile.command.ts`

```typescript
export class UpdateJobProfileCommand {
  constructor(
    public readonly userId: string,
    public readonly jobProfileId: string,
    public readonly jobTitle?: string,
    public readonly companyName?: string,
    public readonly competencies?: Array<{
      name: string;
      weight: number;
      depth: number;
    }>,
    public readonly hardSkills?: string[],
    public readonly softSkills?: string[],
    public readonly seniorityLevel?: number,
    public readonly interviewDifficultyLevel?: number,
  ) {}
}
```

### 1.3 Application Layer - Command Handler (Placeholder)

**File:** `src/modules/job-profiles/application/commands/handlers/update-job-profile.handler.ts`

```typescript
import { CommandHandler, ICommandHandler } from "@nestjs/cqrs";
import { Logger } from "@nestjs/common";
import { UpdateJobProfileCommand } from "../impl/update-job-profile.command";
import { JobProfileDto } from "../../dto/job-profile.dto";

@CommandHandler(UpdateJobProfileCommand)
export class UpdateJobProfileHandler
  implements ICommandHandler<UpdateJobProfileCommand>
{
  private readonly logger = new Logger(UpdateJobProfileHandler.name);

  async execute(command: UpdateJobProfileCommand): Promise<JobProfileDto> {
    this.logger.log(
      `Updating job profile ${command.jobProfileId} for user ${command.userId}`,
    );

    // TODO: This is placeholder data - will be replaced in Step 2
    const mockResponse: JobProfileDto = {
      id: command.jobProfileId,
      userId: command.userId,
      jobTitle: command.jobTitle || "Updated Job Title (placeholder)",
      companyName: command.companyName || "Updated Company (placeholder)",
      jobUrl: undefined,
      rawJD: "Original job description (immutable)",
      competencies: command.competencies || [
        { name: "Updated Competency", weight: 0.5, depth: 7 },
      ],
      hardSkills: command.hardSkills || ["Updated Skill 1", "Updated Skill 2"],
      softSkills: command.softSkills || ["Updated Soft Skill"],
      seniorityLevel: command.seniorityLevel || 7,
      interviewDifficultyLevel: command.interviewDifficultyLevel || 8,
      createdAt: new Date("2026-01-27T10:00:00Z"),
      updatedAt: new Date(), // Now
    };

    this.logger.log(
      `Returning placeholder updated job profile with id ${mockResponse.id}`,
    );
    return mockResponse;
  }
}
```

### 1.4 Update HTTP Mapper

**File:** `src/modules/job-profiles/presentation/http/mappers/job-profile-http.mapper.ts`

Add a new method to the existing mapper:

```typescript
import { UpdateJobProfileResponseDto } from "../dto/update-job-profile-response.dto";

// ...existing code

export class JobProfileHttpMapper {
  // ...existing toParseResponse, toGetResponse methods

  static toUpdateResponse(dto: JobProfileDto): UpdateJobProfileResponseDto {
    return {
      id: dto.id,
      userId: dto.userId,
      jobTitle: dto.jobTitle,
      companyName: dto.companyName,
      jobUrl: dto.jobUrl,
      rawJD: dto.rawJD,
      competencies: dto.competencies,
      hardSkills: dto.hardSkills,
      softSkills: dto.softSkills,
      seniorityLevel: dto.seniorityLevel,
      interviewDifficultyLevel: dto.interviewDifficultyLevel,
      createdAt: dto.createdAt,
      updatedAt: dto.updatedAt,
    };
  }
}
```

### 1.5 Controller with Placeholder Logic

**File:** `src/modules/job-profiles/presentation/http/controllers/job-profiles.controller.ts`

Update the existing controller to add the PATCH endpoint:

```typescript
import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Logger,
  Param,
  Patch, // Add this import
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
// ...other imports

import { UpdateJobProfileCommand } from "../../../application/commands/impl/update-job-profile.command";
import { UpdateJobProfileRequestDto } from "../dto/update-job-profile-request.dto";
import { UpdateJobProfileResponseDto } from "../dto/update-job-profile-response.dto";

@ApiBearerAuth("JWT-auth")
@ApiTags("job-profiles")
@Controller("api/v1/job-profiles")
@UseGuards(SupabaseJwtGuard)
export class JobProfilesController {
  private readonly logger = new Logger(JobProfilesController.name);

  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  // ...existing parse, search, getById methods

  @Patch(":jobProfileId")
  async update(
    @Param("jobProfileId") jobProfileId: string,
    @Body() dto: UpdateJobProfileRequestDto,
    @CurrentUser() user: { id: string },
  ): Promise<UpdateJobProfileResponseDto> {
    this.logger.log(`Updating job profile ${jobProfileId} for user ${user.id}`);

    const command = new UpdateJobProfileCommand(
      user.id,
      jobProfileId,
      dto.jobTitle,
      dto.companyName,
      dto.competencies,
      dto.hardSkills,
      dto.softSkills,
      dto.seniorityLevel,
      dto.interviewDifficultyLevel,
    );

    const result = await this.commandBus.execute<
      UpdateJobProfileCommand,
      JobProfileDto
    >(command);

    return JobProfileHttpMapper.toUpdateResponse(result);
  }
}
```

### 1.6 Register Command Handler in Module

**File:** `src/modules/job-profiles/job-profiles.module.ts`

```typescript
import { Module } from "@nestjs/common";
import { CqrsModule } from "@nestjs/cqrs";
import { ConfigModule } from "@nestjs/config";
import { JobProfilesController } from "./presentation/http/controllers/job-profiles.controller";
import { ParseJobDescriptionHandler } from "./application/commands/handlers/parse-job-description.handler";
import { UpdateJobProfileHandler } from "./application/commands/handlers/update-job-profile.handler"; // Add this
import { GetJobProfileHandler } from "./application/queries/handlers/get-job-profile.handler";
import { SearchJobProfilesHandler } from "./application/queries/handlers/search-job-profiles.handler";
// ...other imports

const CommandHandlers = [
  ParseJobDescriptionHandler,
  UpdateJobProfileHandler, // Add this
];

const QueryHandlers = [GetJobProfileHandler, SearchJobProfilesHandler];

// ...rest of module configuration
```

### 1.7 Verification

```bash
# Start the application
npm run dev

# Test the endpoint (get JWT token first from auth endpoint)
curl -X PATCH http://localhost:3000/api/v1/job-profiles/test-id-123 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "jobTitle": "Updated Senior Engineer",
    "seniorityLevel": 8
  }'

# Expected: 200 OK with placeholder response showing updated fields
```

**Expected State:**

- ✅ Endpoint accessible and returns 200
- ✅ Authentication guard works
- ✅ Validation works (try invalid seniorityLevel)
- ✅ Returns consistent JSON structure
- ✅ Application runs without errors

---

## Step 2: Real Repository Update + Authorization

**Goal:** Replace mock data with actual database update and enforce ownership.

**Status After:**

- ✅ Command handler updates database
- ✅ Returns 404 if job profile not found
- ✅ Returns 403 if user doesn't own the profile
- ✅ Returns 409 if trying to update deleted profile
- ✅ Domain business rules enforced

### 2.1 Update Command Handler

**File:** `src/modules/job-profiles/application/commands/handlers/update-job-profile.handler.ts`

```typescript
import { CommandHandler, ICommandHandler } from "@nestjs/cqrs";
import {
  Inject,
  Logger,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from "@nestjs/common";
import { UpdateJobProfileCommand } from "../impl/update-job-profile.command";
import { JobProfileDto } from "../../dto/job-profile.dto";
import { JobProfileMapper } from "../../mappers/job-profile.mapper";
import {
  IJobProfileRepository,
  JOB_PROFILE_REPOSITORY,
} from "../../../domain/repositories/job-profile.repository.interface";
import { JobProfileId } from "../../../domain/value-objects/job-profile-id";
import { SeniorityLevel } from "../../../domain/value-objects/seniority-level";
import { Competency } from "../../../domain/entities/competency.entity";

@CommandHandler(UpdateJobProfileCommand)
export class UpdateJobProfileHandler
  implements ICommandHandler<UpdateJobProfileCommand>
{
  private readonly logger = new Logger(UpdateJobProfileHandler.name);

  constructor(
    @Inject(JOB_PROFILE_REPOSITORY)
    private readonly repository: IJobProfileRepository,
  ) {}

  async execute(command: UpdateJobProfileCommand): Promise<JobProfileDto> {
    this.logger.log(
      `Updating job profile ${command.jobProfileId} for user ${command.userId}`,
    );

    // 1. Fetch existing job profile
    const jobProfile = await this.repository.findById(
      JobProfileId.create(command.jobProfileId),
    );

    // 2. Check if exists (and not soft-deleted)
    if (!jobProfile) {
      throw new NotFoundException("Job profile not found");
    }

    // 3. Check ownership - avoid leaking existence across tenants
    if (jobProfile.getUserId().getValue() !== command.userId) {
      throw new ForbiddenException("Access denied");
    }

    // 4. Check if soft-deleted (domain will also enforce this)
    if (jobProfile.isDeleted()) {
      throw new ConflictException(
        "Cannot update deleted job profile. Restore it first.",
      );
    }

    // 5. Prepare update data
    const updateData: {
      jobTitle?: string;
      companyName?: string;
      competencies?: Competency[];
      hardSkills?: string[];
      softSkills?: string[];
      seniorityLevel?: SeniorityLevel;
      interviewDifficultyLevel?: number;
    } = {};

    if (command.jobTitle !== undefined) {
      updateData.jobTitle = command.jobTitle;
    }

    if (command.companyName !== undefined) {
      updateData.companyName = command.companyName;
    }

    if (command.competencies !== undefined) {
      updateData.competencies = command.competencies.map((c) =>
        Competency.create(c.name, c.weight, c.depth),
      );
    }

    if (command.hardSkills !== undefined) {
      updateData.hardSkills = command.hardSkills;
    }

    if (command.softSkills !== undefined) {
      updateData.softSkills = command.softSkills;
    }

    if (command.seniorityLevel !== undefined) {
      updateData.seniorityLevel = SeniorityLevel.create(command.seniorityLevel);
    }

    if (command.interviewDifficultyLevel !== undefined) {
      updateData.interviewDifficultyLevel = command.interviewDifficultyLevel;
    }

    // 6. Update domain entity (domain validates and enforces business rules)
    jobProfile.updateParsedData(updateData);

    // 7. Persist
    await this.repository.save(jobProfile);

    this.logger.log(
      `Successfully updated job profile ${command.jobProfileId}`,
    );

    // 8. Return DTO
    return JobProfileMapper.toDto(jobProfile);
  }
}
```

### 2.2 Verification

```bash
npm run dev

# Create a job profile first (or use existing one)
curl -X POST http://localhost:3000/api/v1/job-profiles/parse \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "rawJD": "We are looking for a Senior Software Engineer...",
    "jobTitle": "Senior Software Engineer"
  }'

# Note the returned ID, then test update
curl -X PATCH http://localhost:3000/api/v1/job-profiles/REAL_JOB_PROFILE_ID \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "jobTitle": "Principal Software Engineer",
    "seniorityLevel": 9,
    "hardSkills": ["TypeScript", "Go", "Kubernetes"]
  }'

# Verify update by fetching the profile
curl -X GET http://localhost:3000/api/v1/job-profiles/REAL_JOB_PROFILE_ID \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Test error cases:

# 1. Non-existent ID - should return 404
curl -X PATCH http://localhost:3000/api/v1/job-profiles/non-existent-id \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"jobTitle": "Test"}'

# 2. Another user's profile - should return 403
# (use a different JWT token)

# 3. Validation error - should return 400
curl -X PATCH http://localhost:3000/api/v1/job-profiles/REAL_ID \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"seniorityLevel": 15}'  # Invalid: max is 10
```

**Expected State:**

- ✅ Updates real data in database
- ✅ Returns 404 for non-existent profiles
- ✅ Returns 403 for profiles owned by other users
- ✅ Returns 409 for soft-deleted profiles
- ✅ Returns 400 for validation errors
- ✅ `updatedAt` timestamp reflects update time
- ✅ Business rules enforced by domain entity

---

## Step 3: Full Swagger Documentation

**Goal:** Add comprehensive API documentation with all examples and edge cases.

**Status After:**

- ✅ Full Swagger/OpenAPI documentation
- ✅ All request/response fields documented
- ✅ All HTTP status codes documented with examples
- ✅ Request body examples provided

### 3.1 Add Swagger Decorators to Controller

**File:** `src/modules/job-profiles/presentation/http/controllers/job-profiles.controller.ts`

```typescript
import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Logger,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";
// ...other imports

@ApiBearerAuth("JWT-auth")
@ApiTags("job-profiles")
@Controller("api/v1/job-profiles")
@UseGuards(SupabaseJwtGuard)
export class JobProfilesController {
  private readonly logger = new Logger(JobProfilesController.name);

  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  // ...existing methods

  @Patch(":jobProfileId")
  @ApiOperation({
    summary: "Update job profile",
    description:
      "Update an existing job profile. Users can only update their own profiles. " +
      "All fields are optional - only provided fields will be updated. " +
      "Note: jobUrl and rawJD are immutable and cannot be updated.",
  })
  @ApiParam({
    name: "jobProfileId",
    description: "UUID of the job profile to update",
    example: "550e8400-e29b-41d4-a716-446655440000",
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Job profile updated successfully",
    type: UpdateJobProfileResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: "Validation error (e.g., seniorityLevel > 10)",
    schema: {
      type: "object",
      properties: {
        statusCode: { type: "number", example: 400 },
        message: {
          type: "array",
          example: [
            "seniorityLevel must not be greater than 10",
            "seniorityLevel must not be less than 1",
          ],
        },
        error: { type: "string", example: "Bad Request" },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: "Authentication required (missing or invalid JWT token)",
    schema: {
      type: "object",
      properties: {
        statusCode: { type: "number", example: 401 },
        message: { type: "string", example: "Unauthorized" },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: "Access denied - profile belongs to another user",
    schema: {
      type: "object",
      properties: {
        statusCode: { type: "number", example: 403 },
        message: { type: "string", example: "Access denied" },
        error: { type: "string", example: "Forbidden" },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: "Job profile not found or soft-deleted",
    schema: {
      type: "object",
      properties: {
        statusCode: { type: "number", example: 404 },
        message: { type: "string", example: "Job profile not found" },
        error: { type: "string", example: "Not Found" },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: "Cannot update deleted job profile",
    schema: {
      type: "object",
      properties: {
        statusCode: { type: "number", example: 409 },
        message: {
          type: "string",
          example: "Cannot update deleted job profile. Restore it first.",
        },
        error: { type: "string", example: "Conflict" },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: "Internal server error",
    schema: {
      type: "object",
      properties: {
        statusCode: { type: "number", example: 500 },
        message: { type: "string", example: "Internal server error" },
        error: { type: "string", example: "Internal Server Error" },
      },
    },
  })
  async update(
    @Param("jobProfileId") jobProfileId: string,
    @Body() dto: UpdateJobProfileRequestDto,
    @CurrentUser() user: { id: string },
  ): Promise<UpdateJobProfileResponseDto> {
    this.logger.log(`Updating job profile ${jobProfileId} for user ${user.id}`);

    const command = new UpdateJobProfileCommand(
      user.id,
      jobProfileId,
      dto.jobTitle,
      dto.companyName,
      dto.competencies,
      dto.hardSkills,
      dto.softSkills,
      dto.seniorityLevel,
      dto.interviewDifficultyLevel,
    );

    const result = await this.commandBus.execute<
      UpdateJobProfileCommand,
      JobProfileDto
    >(command);

    return JobProfileHttpMapper.toUpdateResponse(result);
  }
}
```

### 3.2 Verification

```bash
npm run dev

# Access Swagger UI
open http://localhost:3000/api

# Verify the PATCH /api/v1/job-profiles/{jobProfileId} endpoint is documented
# - Check that all request fields have examples
# - Check that all response status codes are documented (200, 400, 401, 403, 404, 409, 500)
# - Test via Swagger UI "Try it out" feature
```

**Expected State:**

- ✅ Swagger documentation complete
- ✅ All fields properly documented with examples
- ✅ All HTTP status codes documented with example responses
- ✅ Request body schema visible in Swagger UI
- ✅ Can test directly from Swagger UI

---

## Step 4: Tests + Final Documentation

**Goal:** Add comprehensive tests and complete documentation.

**Status After:**

- ✅ Unit tests for command handler
- ✅ Controller tests
- ✅ E2E tests (optional but recommended)
- ✅ Documentation updated
- ✅ **PRODUCTION READY**

### 4.1 Command Handler Unit Tests

**File:** `src/modules/job-profiles/application/commands/handlers/update-job-profile.handler.spec.ts`

```typescript
import { Test, TestingModule } from "@nestjs/testing";
import {
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from "@nestjs/common";
import { UpdateJobProfileHandler } from "./update-job-profile.handler";
import { UpdateJobProfileCommand } from "../impl/update-job-profile.command";
import {
  IJobProfileRepository,
  JOB_PROFILE_REPOSITORY,
} from "../../../domain/repositories/job-profile.repository.interface";
import { JobProfile } from "../../../domain/entities/job-profile.entity";
import { UserId } from "../../../domain/value-objects/user-id";
import { JobProfileId } from "../../../domain/value-objects/job-profile-id";
import { SeniorityLevel } from "../../../domain/value-objects/seniority-level";

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
    };

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
        expect.objectContaining({
          getValue: expect.any(Function),
        }),
      );
      expect(mockRepository.save).toHaveBeenCalledWith(mockJobProfile);
      expect(result.jobTitle).toBe("Updated Senior Engineer");
      expect(result.companyName).toBe("Updated Company");
      expect(result.seniorityLevel).toBe(9);
      expect(result.hardSkills).toEqual(["Go", "Rust"]);
    });

    it("should throw NotFoundException when job profile not found", async () => {
      const command = new UpdateJobProfileCommand(
        "user-123",
        "non-existent-id",
        "Updated Title",
      );

      mockRepository.findById.mockResolvedValue(null);

      await expect(handler.execute(command)).rejects.toThrow(
        NotFoundException,
      );
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
      mockJobProfile.softDelete(); // Soft delete it

      mockRepository.findById.mockResolvedValue(mockJobProfile);

      await expect(handler.execute(command)).rejects.toThrow(
        ConflictException,
      );
      await expect(handler.execute(command)).rejects.toThrow(
        "Cannot update deleted job profile",
      );
    });

    it("should only update provided fields (partial update)", async () => {
      const userId = "user-123";
      const jobProfileId = "profile-456";
      const command = new UpdateJobProfileCommand(
        userId,
        jobProfileId,
        "Updated Title Only", // Only update title
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
      expect(result.companyName).toBe("Old Company"); // Unchanged
      expect(result.hardSkills).toEqual(["TypeScript"]); // Unchanged
      expect(result.seniorityLevel).toBe(7); // Unchanged
    });

    it("should update updatedAt timestamp", async () => {
      const userId = "user-123";
      const jobProfileId = "profile-456";
      const command = new UpdateJobProfileCommand(
        userId,
        jobProfileId,
        "Updated Title",
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
  });
});
```

### 4.2 Controller Unit Tests

**File:** `src/modules/job-profiles/presentation/http/controllers/job-profiles.controller.spec.ts`

Add to existing test file:

```typescript
import { UpdateJobProfileCommand } from "../../../application/commands/impl/update-job-profile.command";
import { UpdateJobProfileRequestDto } from "../dto/update-job-profile-request.dto";
import { UpdateJobProfileResponseDto } from "../dto/update-job-profile-response.dto";

describe("JobProfilesController", () => {
  // ...existing setup

  describe("update", () => {
    it("should update job profile for authenticated user", async () => {
      const userId = "user-123";
      const jobProfileId = "profile-456";
      const user = { id: userId };

      const updateDto: UpdateJobProfileRequestDto = {
        jobTitle: "Updated Senior Engineer",
        companyName: "Updated Company",
        seniorityLevel: 9,
      };

      const mockUpdatedProfile = {
        id: jobProfileId,
        userId: userId,
        jobTitle: "Updated Senior Engineer",
        companyName: "Updated Company",
        jobUrl: undefined,
        rawJD: "Original JD",
        competencies: [{ name: "Programming", weight: 1, depth: 8 }],
        hardSkills: ["TypeScript", "Go"],
        softSkills: ["Communication"],
        seniorityLevel: 9,
        interviewDifficultyLevel: 8,
        createdAt: new Date("2026-01-27T10:00:00Z"),
        updatedAt: new Date("2026-01-31T15:30:00Z"),
      };

      mockCommandBus.execute.mockResolvedValue(mockUpdatedProfile);

      const result = await controller.update(jobProfileId, updateDto, user);

      expect(mockCommandBus.execute).toHaveBeenCalledWith(
        expect.any(UpdateJobProfileCommand),
      );
      expect(result.id).toBe(jobProfileId);
      expect(result.jobTitle).toBe("Updated Senior Engineer");
      expect(result.companyName).toBe("Updated Company");
      expect(result.seniorityLevel).toBe(9);
    });

    it("should pass only provided fields to command", async () => {
      const userId = "user-123";
      const jobProfileId = "profile-456";
      const user = { id: userId };

      const updateDto: UpdateJobProfileRequestDto = {
        jobTitle: "Updated Title",
        // Only jobTitle provided
      };

      mockCommandBus.execute.mockResolvedValue({
        id: jobProfileId,
        userId,
        jobTitle: "Updated Title",
        createdAt: new Date(),
        updatedAt: new Date(),
        competencies: [],
        hardSkills: [],
        softSkills: [],
      });

      await controller.update(jobProfileId, updateDto, user);

      expect(mockCommandBus.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          userId,
          jobProfileId,
          jobTitle: "Updated Title",
          companyName: undefined,
          seniorityLevel: undefined,
        }),
      );
    });
  });
});
```

### 4.3 E2E Test (Optional but Recommended)

**File:** `test/job-profiles-update.e2e-spec.ts`

```typescript
import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication, ValidationPipe } from "@nestjs/common";
import * as request from "supertest";
import { AppModule } from "../src/app.module";

describe("JobProfiles Update (e2e)", () => {
  let app: INestApplication;
  let authToken: string;
  let jobProfileId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
      }),
    );
    await app.init();

    // TODO: Setup test auth and create a job profile for testing
  });

  afterAll(async () => {
    await app.close();
  });

  it("PATCH /api/v1/job-profiles/:id - should update job profile", () => {
    return request(app.getHttpServer())
      .patch(`/api/v1/job-profiles/${jobProfileId}`)
      .set("Authorization", `Bearer ${authToken}`)
      .send({
        jobTitle: "Updated Principal Engineer",
        seniorityLevel: 10,
        hardSkills: ["Go", "Rust", "Kubernetes"],
      })
      .expect(200)
      .expect((res) => {
        expect(res.body.jobTitle).toBe("Updated Principal Engineer");
        expect(res.body.seniorityLevel).toBe(10);
        expect(res.body.hardSkills).toContain("Go");
      });
  });

  it("PATCH /api/v1/job-profiles/:id - should return 404 for non-existent profile", () => {
    return request(app.getHttpServer())
      .patch("/api/v1/job-profiles/non-existent-id")
      .set("Authorization", `Bearer ${authToken}`)
      .send({ jobTitle: "Test" })
      .expect(404);
  });

  it("PATCH /api/v1/job-profiles/:id - should return 400 for invalid data", () => {
    return request(app.getHttpServer())
      .patch(`/api/v1/job-profiles/${jobProfileId}`)
      .set("Authorization", `Bearer ${authToken}`)
      .send({
        seniorityLevel: 15, // Invalid: max is 10
      })
      .expect(400);
  });

  it("PATCH /api/v1/job-profiles/:id - should return 401 without auth", () => {
    return request(app.getHttpServer())
      .patch(`/api/v1/job-profiles/${jobProfileId}`)
      .send({ jobTitle: "Test" })
      .expect(401);
  });
});
```

### 4.4 Update Module README

**File:** `src/modules/job-profiles/README.md`

Add the new endpoint to the API documentation:

```markdown
### PATCH /api/v1/job-profiles/:jobProfileId

Update an existing job profile. All fields are optional.

**Authentication:** Required (JWT Bearer token)

**Path Parameters:**

- `jobProfileId` (string, required) - UUID of the job profile

**Request Body:**

```json
{
  "jobTitle": "Principal Software Engineer",
  "companyName": "Updated Tech Corp",
  "competencies": [
    {
      "name": "System Design",
      "weight": 0.4,
      "depth": 10
    }
  ],
  "hardSkills": ["Go", "Rust", "Kubernetes"],
  "softSkills": ["Leadership", "Mentoring"],
  "seniorityLevel": 9,
  "interviewDifficultyLevel": 9
}
```

All fields are optional. Only provided fields will be updated.

**Response (200 OK):**

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "userId": "user-123",
  "jobTitle": "Principal Software Engineer",
  "companyName": "Updated Tech Corp",
  "jobUrl": "https://example.com/job",
  "rawJD": "Original job description (immutable)",
  "competencies": [
    {
      "name": "System Design",
      "weight": 0.4,
      "depth": 10
    }
  ],
  "hardSkills": ["Go", "Rust", "Kubernetes"],
  "softSkills": ["Leadership", "Mentoring"],
  "seniorityLevel": 9,
  "interviewDifficultyLevel": 9,
  "createdAt": "2026-01-27T10:00:00Z",
  "updatedAt": "2026-01-31T15:30:00Z"
}
```

**Error Responses:**

- `400 Bad Request` - Validation error (e.g., seniorityLevel > 10)
- `401 Unauthorized` - Missing or invalid JWT token
- `403 Forbidden` - Job profile belongs to another user
- `404 Not Found` - Job profile not found or soft-deleted
- `409 Conflict` - Cannot update deleted profile (restore first)

**Notes:**

- `jobUrl` and `rawJD` are immutable and cannot be updated
- Only the profile owner can update it
- Soft-deleted profiles cannot be updated (restore first)
- `updatedAt` timestamp is automatically updated

**Example:**

```bash
curl -X PATCH http://localhost:3000/api/v1/job-profiles/550e8400-e29b-41d4-a716-446655440000 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "jobTitle": "Principal Software Engineer",
    "seniorityLevel": 9,
    "hardSkills": ["Go", "Rust", "Kubernetes"]
  }'
```

### 4.5 Verification

```bash
# Run all tests
npm test

# Run specific tests
npm test -- --testPathPattern="update-job-profile"

# Verify coverage
npm run test:cov

# Lint
npm run lint

# Build
npm run build
```

**Expected State:**

- ✅ All tests passing
- ✅ Code coverage maintained (>80%)
- ✅ Documentation complete
- ✅ Linter passes
- ✅ Build succeeds
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
| ---- | --------------- | ----------- |
| 1 | ✅ Returns 200 | Validation, auth, structure, placeholder data |
| 2 | ✅ Returns 200 | Database update, authorization, business rules |
| 3 | ✅ Returns 200 | Full Swagger documentation |
| 4 | ✅ **PRODUCTION** | **Tests & complete docs** |

---

## Key Differences from Waterfall Approach

### Implementation Order

1. ❌ **Waterfall**: Command → Handler → Repository → Controller (horizontal layers)
2. ✅ **Iterative**: Endpoint → Database → Documentation → Tests (vertical slices)

### Benefits

- **Faster feedback**: Test the endpoint immediately after Step 1
- **Better validation**: Catch integration issues early
- **Clearer progress**: Each step delivers working functionality
- **Easier debugging**: Smaller changes between working states
- **Continuous value**: Stakeholders can see and test progress

---

## Business Rules Enforced

1. **Authorization**: Users can only update their own job profiles
2. **Immutable Fields**: `jobUrl` and `rawJD` cannot be updated (source data)
3. **Soft Delete Protection**: Cannot update soft-deleted profiles (restore first)
4. **Partial Updates**: All fields are optional, only provided fields are updated
5. **Validation**: All fields validated per PRD constraints (e.g., seniorityLevel 1-10)
6. **Timestamp**: `updatedAt` automatically set to current time on update

---

**Document Status:** ✅ Ready for Iterative Implementation
**Last Updated:** 2026-01-31
**Module:** job-profiles
**Feature:** FR-JP-004 Update Job Profile (Iterative)
