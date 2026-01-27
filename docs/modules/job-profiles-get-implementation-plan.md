# FR-JP-002: Get Job Profile - Implementation Plan

**Module:** `job-profiles`
**Feature:** Get Job Profile
**Version:** 1.0
**Date:** 2026-01-26
**Status:** Ready for Implementation

---

## Overview

This document provides a step-by-step implementation plan for the Get Job Profile feature (FR-JP-002). The implementation follows the modular monolith architecture with CQRS pattern, strict layer boundaries, and explicit DTO mapping. After each step, the application should run and remain stable.

### Key Implementation Notes

- **Auth & Authorization:** Endpoint is guarded by `SupabaseJwtGuard`; access is limited to the authenticated user’s own job profiles.
- **Soft Delete:** Repository methods must exclude soft-deleted records by default.
- **CQRS:** Use `QueryBus` with a dedicated Query + Handler.
- **DTO Mapping:** Map at every boundary (HTTP ↔ Application ↔ Domain).

---

## Architecture Context

The existing `job-profiles` module already includes:

- Domain entities and value objects
- `IJobProfileRepository` with `findById` and `findByUserId`
- Application `JobProfileDto` and `JobProfileMapper`
- Presentation `JobProfilesController` for `POST /parse`

We will add a Query and a new HTTP response DTO for the full job profile shape.

---

## Implementation Steps

### Step 1: Define Query + Handler (Application Layer)

**Goal:** Add a CQRS query to retrieve a job profile by ID, enforcing ownership.

**Status After:** Query layer compiles; no controller route yet.

#### 1.1 Add Query Class

**File:** `src/modules/job-profiles/application/queries/impl/get-job-profile.query.ts`

```typescript
export class GetJobProfileQuery {
  constructor(
    public readonly userId: string,
    public readonly jobProfileId: string,
  ) {}
}
```

#### 1.2 Add Query Handler

**File:** `src/modules/job-profiles/application/queries/handlers/get-job-profile.handler.ts`

```typescript
import { ForbiddenException, Inject, NotFoundException } from "@nestjs/common";
import { IQueryHandler, QueryHandler } from "@nestjs/cqrs";

import {
  IJobProfileRepository,
  JOB_PROFILE_REPOSITORY,
} from "../../../domain/repositories/job-profile.repository.interface";
import { JobProfileId } from "../../../domain/value-objects/job-profile-id";
import { JobProfileMapper } from "../../mappers/job-profile.mapper";
import { JobProfileDto } from "../../dto/job-profile.dto";
import { GetJobProfileQuery } from "../impl/get-job-profile.query";

@QueryHandler(GetJobProfileQuery)
export class GetJobProfileHandler
  implements IQueryHandler<GetJobProfileQuery>
{
  constructor(
    @Inject(JOB_PROFILE_REPOSITORY)
    private readonly repository: IJobProfileRepository,
  ) {}

  async execute(query: GetJobProfileQuery): Promise<JobProfileDto> {
    const jobProfile = await this.repository.findById(
      JobProfileId.create(query.jobProfileId),
    );

    if (!jobProfile) {
      throw new NotFoundException("Job profile not found");
    }

    if (jobProfile.getUserId().getValue() !== query.userId) {
      // Avoid leaking existence across tenants
      throw new ForbiddenException("Access denied");
    }

    return JobProfileMapper.toDto(jobProfile);
  }
}
```

#### 1.3 Register Query Handler

**File:** `src/modules/job-profiles/job-profiles.module.ts`

- Add `GetJobProfileHandler` to the module’s `providers` (Query Handlers section).

#### 1.4 Verification

```bash
npm run build
```

**Expected State:**

- ✅ Query compiles and is registered
- ✅ No HTTP endpoint yet

---

### Step 2: Add HTTP DTOs + Mapper (Presentation Layer)

**Goal:** Provide response DTO for full job profile shape.

**Status After:** DTOs and mapper compile; no controller route yet.

#### 2.1 Create Response DTO

**File:** `src/modules/job-profiles/presentation/http/dto/get-job-profile-response.dto.ts`

```typescript
import { ApiProperty } from "@nestjs/swagger";

export class GetJobProfileResponseDto {
  @ApiProperty() id!: string;
  @ApiProperty() userId!: string;
  @ApiProperty({ required: false }) jobTitle?: string;
  @ApiProperty({ required: false }) companyName?: string;
  @ApiProperty({ required: false }) jobUrl?: string;
  @ApiProperty({ required: false }) rawJD?: string;
  @ApiProperty({ type: [Object] }) competencies!: Array<{
    name: string;
    weight: number;
    depth: number;
  }>;
  @ApiProperty({ type: [String] }) hardSkills!: string[];
  @ApiProperty({ type: [String] }) softSkills!: string[];
  @ApiProperty({ required: false }) seniorityLevel?: number;
  @ApiProperty({ required: false }) interviewDifficultyLevel?: number;
  @ApiProperty() createdAt!: Date;
  @ApiProperty() updatedAt!: Date;
}
```

#### 2.2 Extend HTTP Mapper

**File:** `src/modules/job-profiles/presentation/http/mappers/job-profile-http.mapper.ts`

- Add a `toGetResponse` mapper that returns the full DTO.

```typescript
import { GetJobProfileResponseDto } from "../dto/get-job-profile-response.dto";

// ...existing code

static toGetResponse(dto: JobProfileDto): GetJobProfileResponseDto {
  return {
    companyName: dto.companyName,
    competencies: dto.competencies,
    createdAt: dto.createdAt,
    hardSkills: dto.hardSkills,
    id: dto.id,
    interviewDifficultyLevel: dto.interviewDifficultyLevel,
    jobTitle: dto.jobTitle,
    jobUrl: dto.jobUrl,
    rawJD: dto.rawJD,
    seniorityLevel: dto.seniorityLevel,
    softSkills: dto.softSkills,
    updatedAt: dto.updatedAt,
    userId: dto.userId,
  };
}
```

#### 2.3 Verification

```bash
npm run build
```

**Expected State:**

- ✅ Presentation DTOs compile
- ✅ Mapper compiles
- ✅ No HTTP endpoint yet

---

### Step 3: Add Controller Route (Presentation Layer)

**Goal:** Expose `GET /api/v1/job-profiles/:jobProfileId`.

**Status After:** Endpoint responds with the full job profile for its owner.

#### 3.1 Update Controller

**File:** `src/modules/job-profiles/presentation/http/controllers/job-profiles.controller.ts`

- Inject `QueryBus` (keep `CommandBus` for parse).
- Add a `@Get(":jobProfileId")` method that:
  - Uses `@CurrentUser()` for user ID
  - Creates and executes `GetJobProfileQuery`
  - Maps to `GetJobProfileResponseDto`

```typescript
import { Get, Param } from "@nestjs/common";
import { QueryBus } from "@nestjs/cqrs";

// ...existing imports
import { GetJobProfileQuery } from "../../../application/queries/impl/get-job-profile.query";
import { GetJobProfileResponseDto } from "../dto/get-job-profile-response.dto";

// ...within controller
constructor(
  private readonly commandBus: CommandBus,
  private readonly queryBus: QueryBus,
) {}

@Get(":jobProfileId")
async getById(
  @Param("jobProfileId") jobProfileId: string,
  @CurrentUser() user: { email: string; id: string; identityId?: string },
): Promise<GetJobProfileResponseDto> {
  const result = await this.queryBus.execute<
    GetJobProfileQuery,
    JobProfileDto
  >(new GetJobProfileQuery(user.id, jobProfileId));

  return JobProfileHttpMapper.toGetResponse(result);
}
```

#### 3.2 Add Swagger Metadata (Optional but recommended)

Add `@ApiOperation` and `@ApiResponse` entries for the new GET endpoint to match existing controller style.

#### 3.3 Verification

```bash
npm run dev
# With a valid JWT and an existing job profile ID:
# GET /api/v1/job-profiles/:jobProfileId
```

**Expected State:**

- ✅ Authenticated users can fetch their own job profile
- ✅ Accessing another user’s profile returns 403 (Forbidden)
- ✅ Non-existent ID returns 404 (Not Found)

---

### Step 4: Add Tests (Recommended)

**Goal:** Validate authorization and response mapping.

**Status After:** Tests cover core behavior.

#### 4.1 Controller Unit Tests

**File:** `src/modules/job-profiles/presentation/http/controllers/job-profiles.controller.spec.ts`

- Add tests for:
  - QueryBus called with `GetJobProfileQuery`
  - Mapper output for full response

#### 4.2 Handler Unit Tests

**File:** `src/modules/job-profiles/application/queries/handlers/get-job-profile.handler.spec.ts`

- Use a mocked repository to test:
  - `NotFoundException` when job profile is missing
  - `ForbiddenException` when user mismatch
  - Successful return of `JobProfileDto` when owner matches

#### 4.3 Verification

```bash
npm test
```

**Expected State:**

- ✅ Unit tests pass
- ✅ Coverage for authorization and not-found cases

---

## Final Deliverable Checklist

- Query + handler implemented and registered
- HTTP DTO and mapper for full job profile response
- Controller GET endpoint wired with auth guard
- Optional Swagger metadata
- Tests added for handler and controller

---

## Notes / Alignment with Architecture

- No direct repository access from controllers
- No cross-module imports outside public contracts
- Mapping at each boundary retained
- Soft-deleted profiles are automatically excluded by repository
