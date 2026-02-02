# FR-JP-004: Delete Job Profile - Iterative Implementation Plan

**Module:** `job-profiles`
**Feature:** Soft Delete Job Profile
**Version:** 1.0 (Iterative)
**Date:** 2026-01-31
**Status:** Ready for Implementation

---

## Quick Start Guide

### Key Files to Create/Modify

1. **Application**: `src/modules/job-profiles/application/commands/impl/soft-delete-job-profile.command.ts`
2. **Application**: `src/modules/job-profiles/application/commands/handlers/soft-delete-job-profile.handler.ts`
3. **Presentation**: Update `src/modules/job-profiles/presentation/http/controllers/job-profiles.controller.ts`
4. **Module**: Update `src/modules/job-profiles/job-profiles.module.ts`

### Implementation Strategy

Follow steps 1-4 sequentially. After each step, the endpoint should work and return a response (even if placeholder initially).

---

## Overview

This document provides an **iterative and incremental** implementation plan for the Delete Job Profile feature (FR-JP-004). This approach prioritizes having a **working endpoint from the start** that executes after each step, even with placeholder logic initially.

### Key Principles

1. **Endpoint First**: Create the HTTP endpoint in Step 1 so it can be invoked immediately
2. **Incremental Enhancement**: Each step adds real functionality while maintaining a working endpoint
3. **Continuous Testing**: The endpoint can be tested after every step
4. **Minimal Viable Slices**: Each step delivers a complete vertical slice through all layers

### Architecture Context

The existing `job-profiles` module already includes:

- Domain entity `JobProfile` with `softDelete()` method (line 180-186 in entity)
- `IJobProfileRepository` with `softDelete(id: JobProfileId)` method (line 40 in interface)
- Application DTOs and mappers
- Presentation controller with GET and POST endpoints
- Soft delete pattern implementation following `docs/patterns/soft-delete-pattern.md`

We will add a Command and update the controller to implement the DELETE endpoint.

---

## Implementation Steps Overview

| Step | What Gets Added | Endpoint Returns |
| ---- | --------------- | ---------------- |
| 1 | Basic endpoint structure + placeholder command | 204 No Content (placeholder - just logs) |
| 2 | Real repository soft delete + authorization | 204 No Content (actual soft delete) |
| 3 | Full Swagger documentation | Fully documented DELETE endpoint |
| 4 | Tests + documentation | Production ready |

---

## Step 1: Basic Endpoint Structure (Placeholder)

**Goal:** Create working DELETE endpoint that accepts requests and executes placeholder logic.

**Status After:**

- ✅ Endpoint `DELETE /api/v1/job-profiles/:jobProfileId` responds with 204
- ✅ Accepts DELETE request with ID parameter
- ✅ Executes placeholder command (logs only)
- ✅ Authentication required
- ✅ Can test with curl/Postman

### 1.1 Application Layer - Command

**File:** `src/modules/job-profiles/application/commands/impl/soft-delete-job-profile.command.ts`

```typescript
export class SoftDeleteJobProfileCommand {
  constructor(
    public readonly userId: string,
    public readonly jobProfileId: string,
  ) {}
}
```

### 1.2 Application Layer - Command Handler (Placeholder)

**File:** `src/modules/job-profiles/application/commands/handlers/soft-delete-job-profile.handler.ts`

```typescript
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Logger } from '@nestjs/common';
import { SoftDeleteJobProfileCommand } from '../impl/soft-delete-job-profile.command';

@CommandHandler(SoftDeleteJobProfileCommand)
export class SoftDeleteJobProfileHandler
  implements ICommandHandler<SoftDeleteJobProfileCommand>
{
  private readonly logger = new Logger(SoftDeleteJobProfileHandler.name);

  async execute(command: SoftDeleteJobProfileCommand): Promise<void> {
    this.logger.log(
      `Soft deleting job profile ${command.jobProfileId} for user ${command.userId}`,
    );

    // TODO: This is placeholder logic - will be replaced in Step 2
    // In production, this will:
    // 1. Fetch job profile from repository
    // 2. Check if it exists (404 if not)
    // 3. Verify ownership (403 if not owner)
    // 4. Call entity.softDelete()
    // 5. Persist via repository.softDelete()

    this.logger.log(
      `Placeholder: Would soft delete job profile ${command.jobProfileId}`,
    );
  }
}
```

### 1.3 Update Controller with DELETE Endpoint

**File:** `src/modules/job-profiles/presentation/http/controllers/job-profiles.controller.ts`

Add the DELETE endpoint to the existing controller:

```typescript
import {
  Body,
  Controller,
  Delete,  // Add this import
  Get,
  HttpCode,  // Add this import
  HttpStatus,
  Logger,
  Param,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import { CommandBus, QueryBus } from "@nestjs/cqrs";
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";

import { CurrentUser } from "@/common/decorators/current-user.decorator";
import { PaginatedResponseDto } from "@/common/dto/paginated-response.dto";
import { SupabaseJwtGuard } from "@/modules/auth/guards/supabase-jwt.guard";

import { ParseJobDescriptionCommand } from "../../../application/commands/impl/parse-job-description.command";
import { SoftDeleteJobProfileCommand } from "../../../application/commands/impl/soft-delete-job-profile.command";  // Add this import
import { JobProfileDto } from "../../../application/dto/job-profile.dto";
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

  // ...existing methods (parse, search, getById)

  @Delete(":jobProfileId")
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(
    @Param("jobProfileId") jobProfileId: string,
    @CurrentUser() user: { id: string },
  ): Promise<void> {
    this.logger.log(
      `Deleting job profile ${jobProfileId} for user ${user.id}`,
    );

    const command = new SoftDeleteJobProfileCommand(user.id, jobProfileId);
    await this.commandBus.execute(command);
  }
}
```

### 1.4 Register Command Handler in Module

**File:** `src/modules/job-profiles/job-profiles.module.ts`

```typescript
import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { CqrsModule } from "@nestjs/cqrs";

import { DatabaseModule } from "@/database/database.module";
import { AuthModule } from "@/modules/auth/auth.module";

import { ParseJobDescriptionHandler } from "./application/commands/handlers/parse-job-description.handler";
import { SoftDeleteJobProfileHandler } from "./application/commands/handlers/soft-delete-job-profile.handler";  // Add this
import { GetJobProfileHandler } from "./application/queries/handlers/get-job-profile.handler";
import { ListJobProfilesHandler } from "./application/queries/handlers/list-job-profiles.handler";
import { SearchJobProfilesHandler } from "./application/queries/handlers/search-job-profiles.handler";
import { JOB_PROFILE_REPOSITORY } from "./domain/repositories/job-profile.repository.interface";
import { JobProfileRepository } from "./infrastructure/persistence/repositories/job-profile.repository";
import { AiParserService } from "./infrastructure/services/ai-parser.service";
import { HtmlFetcherService } from "./infrastructure/services/html-fetcher.service";
import { JdExtractorService } from "./infrastructure/services/jd-extractor.service";
import { JobProfilesController } from "./presentation/http/controllers/job-profiles.controller";

const CommandHandlers = [
  ParseJobDescriptionHandler,
  SoftDeleteJobProfileHandler,  // Add this
];
const QueryHandlers = [
  GetJobProfileHandler,
  ListJobProfilesHandler,
  SearchJobProfilesHandler,
];
const Services = [HtmlFetcherService, JdExtractorService, AiParserService];
const Repositories = [
  {
    provide: JOB_PROFILE_REPOSITORY,
    useClass: JobProfileRepository,
  },
];

@Module({
  controllers: [JobProfilesController],
  imports: [CqrsModule, ConfigModule, DatabaseModule, AuthModule],
  providers: [
    ...CommandHandlers,
    ...QueryHandlers,
    ...Services,
    ...Repositories,
  ],
})
export class JobProfilesModule {}
```

### 1.5 Verification

```bash
# Start the application
npm run dev

# Test the endpoint (get JWT token first from auth endpoint)
curl -X DELETE http://localhost:3000/api/v1/job-profiles/test-id-123 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -v

# Expected: 204 No Content with placeholder log message
```

**Expected State:**

- ✅ Endpoint accessible and returns 204 No Content
- ✅ Authentication guard works
- ✅ Logs show placeholder execution
- ✅ Application runs without errors
- ✅ `npm run build` succeeds

---

## Step 2: Real Implementation (Repository + Authorization)

**Goal:** Replace placeholder with actual soft delete logic including authorization checks.

**Status After:**

- ✅ Command handler fetches from database
- ✅ Returns 404 if job profile not found
- ✅ Returns 403 if user doesn't own the profile
- ✅ Performs actual soft delete for owner
- ✅ Updates `deleted_at` timestamp in database

### 2.1 Update Command Handler

**File:** `src/modules/job-profiles/application/commands/handlers/soft-delete-job-profile.handler.ts`

```typescript
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import {
  Inject,
  Logger,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { SoftDeleteJobProfileCommand } from '../impl/soft-delete-job-profile.command';
import {
  IJobProfileRepository,
  JOB_PROFILE_REPOSITORY,
} from '../../../domain/repositories/job-profile.repository.interface';
import { JobProfileId } from '../../../domain/value-objects/job-profile-id';

@CommandHandler(SoftDeleteJobProfileCommand)
export class SoftDeleteJobProfileHandler
  implements ICommandHandler<SoftDeleteJobProfileCommand>
{
  private readonly logger = new Logger(SoftDeleteJobProfileHandler.name);

  constructor(
    @Inject(JOB_PROFILE_REPOSITORY)
    private readonly repository: IJobProfileRepository,
  ) {}

  async execute(command: SoftDeleteJobProfileCommand): Promise<void> {
    this.logger.log(
      `Soft deleting job profile ${command.jobProfileId} for user ${command.userId}`,
    );

    const jobProfileId = JobProfileId.create(command.jobProfileId);

    // Fetch from database
    const jobProfile = await this.repository.findById(jobProfileId);

    // Check if exists (and not already soft-deleted)
    if (!jobProfile) {
      this.logger.warn(`Job profile ${command.jobProfileId} not found`);
      throw new NotFoundException('Job profile not found');
    }

    // Check ownership - avoid leaking existence across tenants
    if (jobProfile.getUserId().getValue() !== command.userId) {
      this.logger.warn(
        `User ${command.userId} attempted to delete job profile ${command.jobProfileId} owned by another user`,
      );
      throw new ForbiddenException('Access denied');
    }

    // Soft delete via repository (updates deleted_at timestamp)
    await this.repository.softDelete(jobProfileId);

    this.logger.log(
      `Successfully soft deleted job profile ${command.jobProfileId}`,
    );
  }
}
```

### 2.2 Verification

```bash
npm run dev

# Test with a real job profile ID (create one first using POST /parse)
curl -X DELETE http://localhost:3000/api/v1/job-profiles/REAL_JOB_PROFILE_ID \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -v

# Expected: 204 No Content, profile is soft-deleted

# Verify soft delete - GET should return 404 for deleted profile
curl -X GET http://localhost:3000/api/v1/job-profiles/REAL_JOB_PROFILE_ID \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Expected: 404 Not Found

# Test with non-existent ID - should return 404
curl -X DELETE http://localhost:3000/api/v1/job-profiles/non-existent-id \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -v

# Expected: 404 Not Found

# Test with another user's profile ID - should return 403
curl -X DELETE http://localhost:3000/api/v1/job-profiles/OTHER_USER_PROFILE_ID \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -v

# Expected: 403 Forbidden
```

**Expected State:**

- ✅ Performs actual soft delete in database
- ✅ Returns 404 for non-existent profiles
- ✅ Returns 403 for profiles owned by other users
- ✅ Soft-deleted profiles are excluded from GET/LIST queries
- ✅ `deleted_at` timestamp is set in database
- ✅ `updated_at` timestamp is updated
- ✅ `npm run build` succeeds

---

## Step 3: Documentation (Swagger/OpenAPI)

**Goal:** Add comprehensive Swagger documentation for the DELETE endpoint.

**Status After:**

- ✅ Full Swagger/OpenAPI documentation
- ✅ All HTTP status codes documented
- ✅ Authentication requirements documented
- ✅ Visible in Swagger UI

### 3.1 Add Swagger Decorators to Controller

**File:** `src/modules/job-profiles/presentation/http/controllers/job-profiles.controller.ts`

Update the DELETE endpoint with full Swagger documentation:

```typescript
@ApiOperation({
  summary: 'Soft delete job profile by ID',
  description:
    'Soft delete a job profile by its ID. This marks the profile as deleted but does not remove it from the database. ' +
    'Users can only delete their own job profiles. ' +
    'Soft-deleted profiles are excluded from all queries and cannot be accessed via GET endpoints.',
})
@ApiParam({
  name: 'jobProfileId',
  description: 'UUID of the job profile to delete',
  example: '550e8400-e29b-41d4-a716-446655440000',
})
@ApiResponse({
  status: HttpStatus.NO_CONTENT,
  description: 'Job profile soft deleted successfully. No content returned.',
})
@ApiResponse({
  status: HttpStatus.NOT_FOUND,
  description: 'Job profile not found or already soft-deleted',
  schema: {
    type: 'object',
    properties: {
      statusCode: { type: 'number', example: 404 },
      message: { type: 'string', example: 'Job profile not found' },
      error: { type: 'string', example: 'Not Found' },
    },
  },
})
@ApiResponse({
  status: HttpStatus.FORBIDDEN,
  description: 'Access denied - profile belongs to another user',
  schema: {
    type: 'object',
    properties: {
      statusCode: { type: 'number', example: 403 },
      message: { type: 'string', example: 'Access denied' },
      error: { type: 'string', example: 'Forbidden' },
    },
  },
})
@ApiResponse({
  status: HttpStatus.UNAUTHORIZED,
  description: 'Authentication required - missing or invalid JWT token',
  schema: {
    type: 'object',
    properties: {
      statusCode: { type: 'number', example: 401 },
      message: { type: 'string', example: 'Unauthorized' },
    },
  },
})
@Delete(':jobProfileId')
@HttpCode(HttpStatus.NO_CONTENT)
async delete(
  @Param('jobProfileId') jobProfileId: string,
  @CurrentUser() user: { id: string },
): Promise<void> {
  this.logger.log(
    `Deleting job profile ${jobProfileId} for user ${user.id}`,
  );

  const command = new SoftDeleteJobProfileCommand(user.id, jobProfileId);
  await this.commandBus.execute(command);
}
```

### 3.2 Verification

```bash
npm run dev

# Access Swagger UI
open http://localhost:3000/api

# Verify the DELETE /api/v1/job-profiles/{jobProfileId} endpoint is documented
# - Check all status codes are shown (204, 401, 403, 404)
# - Check description explains soft delete
# - Test via Swagger UI "Try it out" button
```

**Expected State:**

- ✅ Swagger documentation complete
- ✅ All HTTP status codes documented (204, 401, 403, 404)
- ✅ Request parameters documented
- ✅ Error response schemas documented
- ✅ Soft delete behavior explained
- ✅ Authentication requirements visible
- ✅ Can test via Swagger UI
- ✅ `npm run build` succeeds

---

## Step 4: Tests + Final Documentation

**Goal:** Add comprehensive tests and update module documentation.

**Status After:**

- ✅ Unit tests for command handler
- ✅ Controller tests
- ✅ Module README updated
- ✅ All tests passing
- ✅ **PRODUCTION READY**

### 4.1 Command Handler Unit Tests

**File:** `src/modules/job-profiles/application/commands/handlers/soft-delete-job-profile.handler.spec.ts`

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { SoftDeleteJobProfileHandler } from './soft-delete-job-profile.handler';
import { SoftDeleteJobProfileCommand } from '../impl/soft-delete-job-profile.command';
import {
  IJobProfileRepository,
  JOB_PROFILE_REPOSITORY,
} from '../../../domain/repositories/job-profile.repository.interface';
import { JobProfile } from '../../../domain/entities/job-profile.entity';
import { UserId } from '../../../domain/value-objects/user-id';
import { JobProfileId } from '../../../domain/value-objects/job-profile-id';

describe('SoftDeleteJobProfileHandler', () => {
  let handler: SoftDeleteJobProfileHandler;
  let mockRepository: jest.Mocked<IJobProfileRepository>;

  beforeEach(async () => {
    mockRepository = {
      findById: jest.fn(),
      findByUserId: jest.fn(),
      save: jest.fn(),
      softDelete: jest.fn(),
      restore: jest.fn(),
      countByUserId: jest.fn(),
      count: jest.fn(),
      search: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SoftDeleteJobProfileHandler,
        {
          provide: JOB_PROFILE_REPOSITORY,
          useValue: mockRepository,
        },
      ],
    }).compile();

    handler = module.get<SoftDeleteJobProfileHandler>(
      SoftDeleteJobProfileHandler,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    it('should soft delete job profile when found and user is owner', async () => {
      const userId = 'user-123';
      const jobProfileId = 'profile-456';
      const command = new SoftDeleteJobProfileCommand(userId, jobProfileId);

      const mockJobProfile = JobProfile.createNew({
        userId: UserId.create(userId),
        jobTitle: 'Senior Engineer',
        rawJD: 'Job description',
      });

      mockRepository.findById.mockResolvedValue(mockJobProfile);

      await handler.execute(command);

      expect(mockRepository.findById).toHaveBeenCalledWith(
        expect.objectContaining({
          getValue: expect.any(Function),
        }),
      );
      expect(mockRepository.softDelete).toHaveBeenCalledWith(
        expect.objectContaining({
          getValue: expect.any(Function),
        }),
      );
    });

    it('should throw NotFoundException when job profile not found', async () => {
      const command = new SoftDeleteJobProfileCommand(
        'user-123',
        'non-existent-id',
      );

      mockRepository.findById.mockResolvedValue(null);

      await expect(handler.execute(command)).rejects.toThrow(
        NotFoundException,
      );
      await expect(handler.execute(command)).rejects.toThrow(
        'Job profile not found',
      );
      expect(mockRepository.softDelete).not.toHaveBeenCalled();
    });

    it('should throw ForbiddenException when user is not owner', async () => {
      const ownerId = 'owner-123';
      const requesterId = 'requester-456';
      const jobProfileId = 'profile-789';

      const command = new SoftDeleteJobProfileCommand(
        requesterId,
        jobProfileId,
      );

      const mockJobProfile = JobProfile.createNew({
        userId: UserId.create(ownerId),
        jobTitle: 'Senior Engineer',
        rawJD: 'Job description',
      });

      mockRepository.findById.mockResolvedValue(mockJobProfile);

      await expect(handler.execute(command)).rejects.toThrow(
        ForbiddenException,
      );
      await expect(handler.execute(command)).rejects.toThrow('Access denied');
      expect(mockRepository.softDelete).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException for already soft-deleted profile', async () => {
      const command = new SoftDeleteJobProfileCommand(
        'user-123',
        'deleted-profile-id',
      );

      // Repository returns null for soft-deleted profiles
      mockRepository.findById.mockResolvedValue(null);

      await expect(handler.execute(command)).rejects.toThrow(
        NotFoundException,
      );
      expect(mockRepository.softDelete).not.toHaveBeenCalled();
    });

    it('should log success message after soft delete', async () => {
      const userId = 'user-123';
      const jobProfileId = 'profile-456';
      const command = new SoftDeleteJobProfileCommand(userId, jobProfileId);

      const mockJobProfile = JobProfile.createNew({
        userId: UserId.create(userId),
        jobTitle: 'Senior Engineer',
        rawJD: 'Job description',
      });

      mockRepository.findById.mockResolvedValue(mockJobProfile);

      const logSpy = jest.spyOn(handler['logger'], 'log');

      await handler.execute(command);

      expect(logSpy).toHaveBeenCalledWith(
        expect.stringContaining('Successfully soft deleted'),
      );
    });
  });
});
```

### 4.2 Controller Unit Tests

**File:** `src/modules/job-profiles/presentation/http/controllers/job-profiles.controller.spec.ts`

Add to existing test file:

```typescript
import { SoftDeleteJobProfileCommand } from '../../../application/commands/impl/soft-delete-job-profile.command';

describe('JobProfilesController', () => {
  // ...existing setup

  describe('delete', () => {
    it('should soft delete job profile for authenticated user', async () => {
      const userId = 'user-123';
      const jobProfileId = 'profile-456';
      const user = { id: userId };

      mockCommandBus.execute.mockResolvedValue(undefined);

      const result = await controller.delete(jobProfileId, user);

      expect(mockCommandBus.execute).toHaveBeenCalledWith(
        expect.any(SoftDeleteJobProfileCommand),
      );
      expect(result).toBeUndefined();
    });

    it('should pass correct parameters to command', async () => {
      const userId = 'user-789';
      const jobProfileId = 'profile-abc';
      const user = { id: userId };

      mockCommandBus.execute.mockResolvedValue(undefined);

      await controller.delete(jobProfileId, user);

      const executedCommand = mockCommandBus.execute.mock
        .calls[0][0] as SoftDeleteJobProfileCommand;
      expect(executedCommand.userId).toBe(userId);
      expect(executedCommand.jobProfileId).toBe(jobProfileId);
    });
  });
});
```

### 4.3 E2E Test

**File:** `test/job-profiles-delete.e2e-spec.ts`

```typescript
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import { AppModule } from '@/app.module';

describe('Job Profiles - Delete (E2E)', () => {
  let app: INestApplication;
  let authToken: string;
  let userId: string;
  let jobProfileId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    // TODO: Setup auth token and create test job profile
    // This depends on your test setup strategy
  });

  afterAll(async () => {
    await app.close();
  });

  describe('DELETE /api/v1/job-profiles/:jobProfileId', () => {
    it('should soft delete job profile (204)', async () => {
      const response = await request(app.getHttpServer())
        .delete(`/api/v1/job-profiles/${jobProfileId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(204);

      expect(response.body).toEqual({});
    });

    it('should return 404 when profile not found', async () => {
      await request(app.getHttpServer())
        .delete('/api/v1/job-profiles/non-existent-id')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });

    it('should return 401 when not authenticated', async () => {
      await request(app.getHttpServer())
        .delete(`/api/v1/job-profiles/${jobProfileId}`)
        .expect(401);
    });

    it('should return 404 when trying to GET deleted profile', async () => {
      // First delete
      await request(app.getHttpServer())
        .delete(`/api/v1/job-profiles/${jobProfileId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(204);

      // Then try to GET
      await request(app.getHttpServer())
        .get(`/api/v1/job-profiles/${jobProfileId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });

    it('should return 404 when trying to delete already deleted profile', async () => {
      // Delete twice
      await request(app.getHttpServer())
        .delete(`/api/v1/job-profiles/${jobProfileId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(204);

      await request(app.getHttpServer())
        .delete(`/api/v1/job-profiles/${jobProfileId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });
});
```

### 4.4 Update Module README

**File:** `src/modules/job-profiles/README.md`

Add the DELETE endpoint documentation:

```markdown
### DELETE /api/v1/job-profiles/:jobProfileId

Soft delete a job profile by its ID.

**Authentication:** Required (JWT Bearer token)

**Path Parameters:**

- `jobProfileId` (string, required) - UUID of the job profile to delete

**Response (204 No Content):**

No content returned on success.

**Error Responses:**

- `401 Unauthorized` - Missing or invalid JWT token
- `403 Forbidden` - Job profile belongs to another user
- `404 Not Found` - Job profile not found or already soft-deleted

**Behavior:**

- Soft delete: Sets `deleted_at` timestamp, does not physically remove record
- Soft-deleted profiles are excluded from all GET/LIST queries
- Attempting to delete an already deleted profile returns 404
- Only the profile owner can delete their own profiles

**Example:**

```bash
curl -X DELETE http://localhost:3000/api/v1/job-profiles/550e8400-e29b-41d4-a716-446655440000 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -v

# Success: HTTP/1.1 204 No Content
```

### 4.5 Verification

```bash
# Run all tests
npm test

# Run specific tests
npm test -- --testPathPattern="soft-delete-job-profile"

# Run E2E tests
npm run test:e2e -- --testPathPattern="job-profiles-delete"

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
- ✅ Linter passes
- ✅ Build succeeds
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
| ---- | --------------- | ----------- |
| 1 | ✅ Returns 204 | Validation, auth, structure, logging |
| 2 | ✅ Returns 204 | Database soft delete, authorization |
| 3 | ✅ Returns 204 | Full Swagger documentation |
| 4 | ✅ **PRODUCTION** | **Tests & docs** |

---

## Key Implementation Notes

### Soft Delete Pattern

This endpoint follows the soft delete pattern as documented in `docs/patterns/soft-delete-pattern.md`:

- ✅ Sets `deleted_at` timestamp instead of physical deletion
- ✅ Updates `updated_at` timestamp
- ✅ Soft-deleted records excluded from queries by default
- ✅ Domain entity has `softDelete()` method
- ✅ Repository has `softDelete(id)` method
- ✅ No cascade delete (handled separately if needed)

### Authorization

- Users can only delete their own job profiles
- Returns 403 if attempting to delete another user's profile
- Returns 404 for non-existent or already deleted profiles (no info leak)

### HTTP Status Codes

- `204 No Content` - Successful soft delete
- `401 Unauthorized` - Missing/invalid JWT
- `403 Forbidden` - Not profile owner
- `404 Not Found` - Profile not found or already deleted

---

## Differences from Waterfall Approach

### Implementation Order

1. ❌ **Waterfall**: Command → Handler → Controller → Tests (all layers first)
2. ✅ **Iterative**: Endpoint → Authorization → Documentation → Tests (vertical slices)

### Benefits

- **Faster feedback**: Test the endpoint immediately after Step 1
- **Better validation**: Catch integration issues early
- **Clearer progress**: Each step delivers working functionality
- **Easier debugging**: Smaller changes between working states
- **Risk reduction**: Never have non-working code for extended periods

---

**Document Status:** ✅ Ready for Iterative Implementation
**Last Updated:** 2026-01-31
**Module:** job-profiles
**Feature:** FR-JP-004 Soft Delete Job Profile (Iterative)
