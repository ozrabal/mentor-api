# FR-JP-003: List Job Profiles - Iterative Implementation Plan

**Module:** `job-profiles`
**Feature:** List Job Profiles
**Version:** 1.0 (Iterative)
**Date:** 2026-01-28
**Status:** Ready for Implementation

---

## Quick Start Guide

### Key Files to Create/Modify

1. **Application**: `src/modules/job-profiles/application/queries/impl/list-job-profiles.query.ts`
2. **Application**: `src/modules/job-profiles/application/queries/handlers/list-job-profiles.handler.ts`
3. **Presentation**: `src/modules/job-profiles/presentation/http/dto/list-job-profiles-request.dto.ts`
4. **Presentation**: `src/modules/job-profiles/presentation/http/dto/list-job-profiles-response.dto.ts`
5. **Presentation**: Update `src/modules/job-profiles/presentation/http/controllers/job-profiles.controller.ts`
6. **Module**: Update `src/modules/job-profiles/job-profiles.module.ts`

### Implementation Strategy

Follow steps 1-4 sequentially. After each step, the endpoint should work and return a response (even if placeholder initially).

---

## Overview

This document provides an **iterative and incremental** implementation plan for the List Job Profiles feature (FR-JP-003). This approach prioritizes having a **working endpoint from the start** that returns responses after each step, even if they're placeholder responses initially.

### Key Principles

1. **Endpoint First**: Create the HTTP endpoint in Step 1 so it can be invoked immediately
2. **Incremental Enhancement**: Each step adds real functionality while maintaining a working endpoint
3. **Continuous Testing**: The endpoint can be tested after every step
4. **Minimal Viable Slices**: Each step delivers a complete vertical slice through all layers

### Architecture Context

The existing `job-profiles` module already includes:

- Domain entities (JobProfile) and value objects (UserId, JobProfileId)
- `IJobProfileRepository` with `findByUserId` method that supports pagination
- Application `JobProfileDto` and `JobProfileMapper`
- Presentation `JobProfilesController` with POST /parse and GET /:id endpoints

We will add a Query with pagination support and response DTOs for the list operation.

---

## Implementation Steps Overview

| Step | What Gets Added | Endpoint Returns |
| ---- | --------------- | ---------------- |
| 1 | Basic endpoint structure + minimal query wiring | Simple placeholder response with mock paginated data |
| 2 | Real repository query + pagination | Returns actual paginated job profiles from DB |
| 3 | Full HTTP response DTO + proper mapping | Complete response with all fields and metadata |
| 4 | Tests + documentation | Production ready |

---

## Step 1: Basic Endpoint Structure

**Goal:** Create working endpoint that accepts pagination parameters and returns placeholder response.

**Status After:**

- ✅ Endpoint `/api/v1/job-profiles` responds with 200
- ✅ Accepts GET request with optional query parameters (limit, offset)
- ✅ Returns mock paginated job profiles list
- ✅ Authentication required
- ✅ Validation works

### 1.1 Presentation Layer - Request DTO

**File:** `src/modules/job-profiles/presentation/http/dto/list-job-profiles-request.dto.ts`

```typescript
import { IsOptional, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class ListJobProfilesRequestDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 10;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  offset?: number = 0;
}
```

### 1.2 Presentation Layer - Response DTO

**File:** `src/modules/job-profiles/presentation/http/dto/list-job-profiles-response.dto.ts`

```typescript
export class JobProfileListItemDto {
  id!: string;
  userId!: string;
  jobTitle?: string;
  companyName?: string;
  seniorityLevel?: number;
  interviewDifficultyLevel?: number;
  createdAt!: Date;
  updatedAt!: Date;
}

export class ListJobProfilesResponseDto {
  profiles!: JobProfileListItemDto[];
  total!: number;
}
```

### 1.3 Application Layer - Query

**File:** `src/modules/job-profiles/application/queries/impl/list-job-profiles.query.ts`

```typescript
export class ListJobProfilesQuery {
  constructor(
    public readonly userId: string,
    public readonly limit: number = 10,
    public readonly offset: number = 0,
  ) {}
}
```

### 1.4 Application Layer - Query Handler (Placeholder)

**File:** `src/modules/job-profiles/application/queries/handlers/list-job-profiles.handler.ts`

```typescript
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Logger } from '@nestjs/common';
import { ListJobProfilesQuery } from '../impl/list-job-profiles.query';
import { JobProfileDto } from '../../dto/job-profile.dto';

export interface PaginatedJobProfilesDto {
  profiles: JobProfileDto[];
  total: number;
}

@QueryHandler(ListJobProfilesQuery)
export class ListJobProfilesHandler
  implements IQueryHandler<ListJobProfilesQuery>
{
  private readonly logger = new Logger(ListJobProfilesHandler.name);

  async execute(
    query: ListJobProfilesQuery,
  ): Promise<PaginatedJobProfilesDto> {
    this.logger.log(
      `Listing job profiles for user ${query.userId} (limit: ${query.limit}, offset: ${query.offset})`,
    );

    // TODO: This is placeholder data - will be replaced in Step 2
    const mockProfiles: JobProfileDto[] = [
      {
        id: 'profile-1',
        userId: query.userId,
        jobTitle: 'Senior Software Engineer (placeholder)',
        companyName: 'Tech Corp (placeholder)',
        jobUrl: undefined,
        rawJD: 'Placeholder job description 1',
        competencies: [
          { name: 'Programming', weight: 0.5, depth: 5 },
          { name: 'Communication', weight: 0.5, depth: 5 },
        ],
        hardSkills: ['JavaScript', 'TypeScript'],
        softSkills: ['Communication', 'Teamwork'],
        seniorityLevel: 5,
        interviewDifficultyLevel: 5,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'profile-2',
        userId: query.userId,
        jobTitle: 'Full Stack Developer (placeholder)',
        companyName: 'Startup Inc (placeholder)',
        jobUrl: undefined,
        rawJD: 'Placeholder job description 2',
        competencies: [
          { name: 'Frontend', weight: 0.5, depth: 4 },
          { name: 'Backend', weight: 0.5, depth: 4 },
        ],
        hardSkills: ['React', 'Node.js'],
        softSkills: ['Problem Solving', 'Adaptability'],
        seniorityLevel: 3,
        interviewDifficultyLevel: 4,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    const mockResponse: PaginatedJobProfilesDto = {
      profiles: mockProfiles.slice(query.offset, query.offset + query.limit),
      total: mockProfiles.length,
    };

    this.logger.log(
      `Returning ${mockResponse.profiles.length} placeholder profiles (total: ${mockResponse.total})`,
    );
    return mockResponse;
  }
}
```

### 1.5 Update HTTP Mapper

**File:** `src/modules/job-profiles/presentation/http/mappers/job-profile-http.mapper.ts`

Add new methods to the existing mapper:

```typescript
import { JobProfileDto } from '../../../application/dto/job-profile.dto';
import {
  JobProfileListItemDto,
  ListJobProfilesResponseDto,
} from '../dto/list-job-profiles-response.dto';
import { PaginatedJobProfilesDto } from '../../../application/queries/handlers/list-job-profiles.handler';

// ...existing code

export class JobProfileHttpMapper {
  // ...existing methods (toParseResponse, toGetResponse)

  static toListItemResponse(dto: JobProfileDto): JobProfileListItemDto {
    return {
      id: dto.id,
      userId: dto.userId,
      jobTitle: dto.jobTitle,
      companyName: dto.companyName,
      seniorityLevel: dto.seniorityLevel,
      interviewDifficultyLevel: dto.interviewDifficultyLevel,
      createdAt: dto.createdAt,
      updatedAt: dto.updatedAt,
    };
  }

  static toListResponse(
    paginated: PaginatedJobProfilesDto,
  ): ListJobProfilesResponseDto {
    return {
      profiles: paginated.profiles.map((profile) =>
        this.toListItemResponse(profile),
      ),
      total: paginated.total,
    };
  }
}
```

### 1.6 Controller with Placeholder Logic

**File:** `src/modules/job-profiles/presentation/http/controllers/job-profiles.controller.ts`

Update the existing controller to add the list endpoint:

```typescript
import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  UseGuards,
  Logger,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ParseJobDescriptionRequestDto } from '../dto/parse-job-description-request.dto';
import { ParseJobDescriptionResponseDto } from '../dto/parse-job-description-response.dto';
import { GetJobProfileResponseDto } from '../dto/get-job-profile-response.dto';
import { ListJobProfilesRequestDto } from '../dto/list-job-profiles-request.dto';
import { ListJobProfilesResponseDto } from '../dto/list-job-profiles-response.dto';
import { JobProfileHttpMapper } from '../mappers/job-profile-http.mapper';
import { ParseJobDescriptionCommand } from '../../../application/commands/impl/parse-job-description.command';
import { GetJobProfileQuery } from '../../../application/queries/impl/get-job-profile.query';
import { ListJobProfilesQuery } from '../../../application/queries/impl/list-job-profiles.query';
import { SupabaseGuard } from '@/modules/auth/guards/supabase.guard';
import { CurrentUser } from '@/common/decorators/current-user.decorator';

@Controller('api/v1/job-profiles')
@UseGuards(SupabaseGuard)
export class JobProfilesController {
  private readonly logger = new Logger(JobProfilesController.name);

  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  // ...existing parse and getById methods

  @Get()
  async list(
    @Query() queryParams: ListJobProfilesRequestDto,
    @CurrentUser() user: { id: string },
  ): Promise<ListJobProfilesResponseDto> {
    this.logger.log(
      `Listing job profiles for user ${user.id} (limit: ${queryParams.limit}, offset: ${queryParams.offset})`,
    );

    const result = await this.queryBus.execute(
      new ListJobProfilesQuery(
        user.id,
        queryParams.limit,
        queryParams.offset,
      ),
    );

    return JobProfileHttpMapper.toListResponse(result);
  }
}
```

### 1.7 Register Query Handler in Module

**File:** `src/modules/job-profiles/job-profiles.module.ts`

```typescript
import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { ConfigModule } from '@nestjs/config';
import { JobProfilesController } from './presentation/http/controllers/job-profiles.controller';
import { ParseJobDescriptionHandler } from './application/commands/handlers/parse-job-description.handler';
import { GetJobProfileHandler } from './application/queries/handlers/get-job-profile.handler';
import { ListJobProfilesHandler } from './application/queries/handlers/list-job-profiles.handler';
import { HtmlFetcherService } from './infrastructure/services/html-fetcher.service';
import { JdExtractorService } from './infrastructure/services/jd-extractor.service';
import { AiParserService } from './infrastructure/services/ai-parser.service';
import { JobProfileRepository } from './infrastructure/persistence/repositories/job-profile.repository';
import { JOB_PROFILE_REPOSITORY } from './domain/repositories/job-profile.repository.interface';
import { DatabaseModule } from '@/database/database.module';

const CommandHandlers = [ParseJobDescriptionHandler];
const QueryHandlers = [GetJobProfileHandler, ListJobProfilesHandler]; // Add ListJobProfilesHandler
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
  providers: [...CommandHandlers, ...QueryHandlers, ...Services, ...Repositories],
})
export class JobProfilesModule {}
```

### 1.8 Verification

```bash
# Start the application
npm run dev

# Test the endpoint (get JWT token first from auth endpoint)
curl -X GET "http://localhost:3000/api/v1/job-profiles?limit=10&offset=0" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Test with default parameters (should use limit=10, offset=0)
curl -X GET "http://localhost:3000/api/v1/job-profiles" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Expected: 200 OK with placeholder response
```

**Expected State:**

- ✅ Endpoint accessible and returns 200
- ✅ Authentication guard works
- ✅ Query parameter validation works (limit 1-100, offset >= 0)
- ✅ Returns consistent JSON structure with profiles array and total count
- ✅ Application runs without errors

---

## Step 2: Real Repository Query + Pagination

**Goal:** Replace mock data with actual database query using repository with pagination support.

**Status After:**

- ✅ Query handler fetches from database
- ✅ Pagination works correctly (limit, offset)
- ✅ Returns only user's own job profiles
- ✅ Returns real job profile data
- ✅ Excludes soft-deleted profiles

### 2.1 Update Query Handler

**File:** `src/modules/job-profiles/application/queries/handlers/list-job-profiles.handler.ts`

```typescript
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Inject, Logger } from '@nestjs/common';
import { ListJobProfilesQuery } from '../impl/list-job-profiles.query';
import { JobProfileDto } from '../../dto/job-profile.dto';
import { JobProfileMapper } from '../../mappers/job-profile.mapper';
import {
  IJobProfileRepository,
  JOB_PROFILE_REPOSITORY,
} from '../../../domain/repositories/job-profile.repository.interface';
import { UserId } from '../../../domain/value-objects/user-id';

export interface PaginatedJobProfilesDto {
  profiles: JobProfileDto[];
  total: number;
}

@QueryHandler(ListJobProfilesQuery)
export class ListJobProfilesHandler
  implements IQueryHandler<ListJobProfilesQuery>
{
  private readonly logger = new Logger(ListJobProfilesHandler.name);

  constructor(
    @Inject(JOB_PROFILE_REPOSITORY)
    private readonly repository: IJobProfileRepository,
  ) {}

  async execute(
    query: ListJobProfilesQuery,
  ): Promise<PaginatedJobProfilesDto> {
    this.logger.log(
      `Listing job profiles for user ${query.userId} (limit: ${query.limit}, offset: ${query.offset})`,
    );

    // Fetch job profiles for the user with pagination
    const jobProfiles = await this.repository.findByUserId(
      UserId.create(query.userId),
      query.limit,
      query.offset,
    );

    // Count total profiles for the user (for pagination metadata)
    const total = await this.repository.countByUserId(
      UserId.create(query.userId),
    );

    // Map domain entities to DTOs
    const profileDtos = jobProfiles.map((profile) =>
      JobProfileMapper.toDto(profile),
    );

    this.logger.log(
      `Successfully fetched ${profileDtos.length} profiles (total: ${total})`,
    );

    return {
      profiles: profileDtos,
      total,
    };
  }
}
```

### 2.2 Verification

```bash
npm run dev

# Test with real data (create some job profiles first using POST /parse)
curl -X GET "http://localhost:3000/api/v1/job-profiles?limit=5&offset=0" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Test pagination - offset
curl -X GET "http://localhost:3000/api/v1/job-profiles?limit=5&offset=5" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Test different limit
curl -X GET "http://localhost:3000/api/v1/job-profiles?limit=2&offset=0" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Test validation - invalid limit (should fail)
curl -X GET "http://localhost:3000/api/v1/job-profiles?limit=200&offset=0" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
# Expected: 400 Bad Request

# Test validation - negative offset (should fail)
curl -X GET "http://localhost:3000/api/v1/job-profiles?limit=10&offset=-1" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
# Expected: 400 Bad Request
```

**Expected State:**

- ✅ Returns real job profiles from database
- ✅ Pagination works correctly (limit, offset)
- ✅ Returns only profiles owned by authenticated user
- ✅ Total count reflects actual number of user's profiles
- ✅ Soft-deleted profiles are excluded
- ✅ Validation errors return 400 for invalid parameters

---

## Step 3: Full Response DTO + Swagger Documentation

**Goal:** Add comprehensive response documentation and ensure all fields are properly mapped.

**Status After:**

- ✅ Full Swagger/OpenAPI documentation
- ✅ All response fields documented
- ✅ Query parameters documented
- ✅ Proper HTTP status codes documented

### 3.1 Update Request DTO with Swagger Decorators

**File:** `src/modules/job-profiles/presentation/http/dto/list-job-profiles-request.dto.ts`

```typescript
import { IsOptional, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class ListJobProfilesRequestDto {
  @ApiProperty({
    description: 'Maximum number of profiles to return',
    example: 10,
    default: 10,
    minimum: 1,
    maximum: 100,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 10;

  @ApiProperty({
    description: 'Number of profiles to skip (for pagination)',
    example: 0,
    default: 0,
    minimum: 0,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  offset?: number = 0;
}
```

### 3.2 Update Response DTOs with Swagger Decorators

**File:** `src/modules/job-profiles/presentation/http/dto/list-job-profiles-response.dto.ts`

```typescript
import { ApiProperty } from '@nestjs/swagger';

export class JobProfileListItemDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  id!: string;

  @ApiProperty({ example: 'user-123' })
  userId!: string;

  @ApiProperty({ example: 'Senior Software Engineer', required: false })
  jobTitle?: string;

  @ApiProperty({ example: 'Tech Corp', required: false })
  companyName?: string;

  @ApiProperty({ example: 7, minimum: 1, maximum: 10, required: false })
  seniorityLevel?: number;

  @ApiProperty({ example: 8, minimum: 1, maximum: 10, required: false })
  interviewDifficultyLevel?: number;

  @ApiProperty({ example: '2026-01-27T10:00:00Z' })
  createdAt!: Date;

  @ApiProperty({ example: '2026-01-27T10:00:00Z' })
  updatedAt!: Date;
}

export class ListJobProfilesResponseDto {
  @ApiProperty({
    description: 'Array of job profiles',
    type: [JobProfileListItemDto],
  })
  profiles!: JobProfileListItemDto[];

  @ApiProperty({
    description: 'Total number of job profiles for the user',
    example: 15,
  })
  total!: number;
}
```

### 3.3 Add Swagger Decorators to Controller

**File:** `src/modules/job-profiles/presentation/http/controllers/job-profiles.controller.ts`

```typescript
import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  UseGuards,
  Logger,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
// ...other imports

@ApiTags('job-profiles')
@Controller('api/v1/job-profiles')
@UseGuards(SupabaseGuard)
@ApiBearerAuth()
export class JobProfilesController {
  private readonly logger = new Logger(JobProfilesController.name);

  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  // ...existing parse and getById methods

  @Get()
  @ApiOperation({
    summary: 'List job profiles',
    description:
      'Retrieve a paginated list of job profiles for the authenticated user. ' +
      'Profiles are returned in reverse chronological order (newest first). ' +
      'Soft-deleted profiles are excluded.',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Maximum number of profiles to return (default: 10, max: 100)',
    example: 10,
  })
  @ApiQuery({
    name: 'offset',
    required: false,
    type: Number,
    description: 'Number of profiles to skip for pagination (default: 0)',
    example: 0,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Job profiles retrieved successfully',
    type: ListJobProfilesResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid query parameters (e.g., limit > 100 or offset < 0)',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Authentication required',
  })
  async list(
    @Query() queryParams: ListJobProfilesRequestDto,
    @CurrentUser() user: { id: string },
  ): Promise<ListJobProfilesResponseDto> {
    this.logger.log(
      `Listing job profiles for user ${user.id} (limit: ${queryParams.limit}, offset: ${queryParams.offset})`,
    );

    const result = await this.queryBus.execute(
      new ListJobProfilesQuery(
        user.id,
        queryParams.limit,
        queryParams.offset,
      ),
    );

    return JobProfileHttpMapper.toListResponse(result);
  }
}
```

### 3.4 Verification

```bash
npm run dev

# Access Swagger UI
open http://localhost:3000/api

# Verify the GET /api/v1/job-profiles endpoint is documented
# Test via Swagger UI with different limit and offset values
```

**Expected State:**

- ✅ Swagger documentation complete
- ✅ All fields properly documented
- ✅ Query parameters documented with examples
- ✅ Example values shown
- ✅ HTTP status codes documented

---

## Step 4: Tests + Documentation

**Goal:** Add comprehensive tests and documentation.

**Status After:**

- ✅ Unit tests for query handler
- ✅ Controller tests
- ✅ Documentation updated
- ✅ **PRODUCTION READY**

### 4.1 Query Handler Unit Tests

**File:** `src/modules/job-profiles/application/queries/handlers/list-job-profiles.handler.spec.ts`

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { ListJobProfilesHandler } from './list-job-profiles.handler';
import { ListJobProfilesQuery } from '../impl/list-job-profiles.query';
import {
  IJobProfileRepository,
  JOB_PROFILE_REPOSITORY,
} from '../../../domain/repositories/job-profile.repository.interface';
import { JobProfile } from '../../../domain/entities/job-profile.entity';
import { UserId } from '../../../domain/value-objects/user-id';
import { JobProfileId } from '../../../domain/value-objects/job-profile-id';

describe('ListJobProfilesHandler', () => {
  let handler: ListJobProfilesHandler;
  let mockRepository: jest.Mocked<IJobProfileRepository>;

  beforeEach(async () => {
    mockRepository = {
      findById: jest.fn(),
      findByUserId: jest.fn(),
      save: jest.fn(),
      countByUserId: jest.fn(),
      softDelete: jest.fn(),
      restore: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ListJobProfilesHandler,
        {
          provide: JOB_PROFILE_REPOSITORY,
          useValue: mockRepository,
        },
      ],
    }).compile();

    handler = module.get<ListJobProfilesHandler>(ListJobProfilesHandler);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    it('should return paginated list of job profiles for user', async () => {
      const userId = 'user-123';
      const limit = 10;
      const offset = 0;
      const query = new ListJobProfilesQuery(userId, limit, offset);

      const mockProfile1 = JobProfile.createNew({
        userId: UserId.create(userId),
        jobTitle: 'Senior Engineer',
        rawJD: 'Job description 1',
      });

      const mockProfile2 = JobProfile.createNew({
        userId: UserId.create(userId),
        jobTitle: 'Tech Lead',
        rawJD: 'Job description 2',
      });

      mockRepository.findByUserId.mockResolvedValue([
        mockProfile1,
        mockProfile2,
      ]);
      mockRepository.countByUserId.mockResolvedValue(2);

      const result = await handler.execute(query);

      expect(mockRepository.findByUserId).toHaveBeenCalledWith(
        expect.objectContaining({
          getValue: expect.any(Function),
        }),
        limit,
        offset,
      );
      expect(mockRepository.countByUserId).toHaveBeenCalledWith(
        expect.objectContaining({
          getValue: expect.any(Function),
        }),
      );
      expect(result.profiles).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(result.profiles[0].userId).toBe(userId);
      expect(result.profiles[1].userId).toBe(userId);
    });

    it('should return empty list when user has no profiles', async () => {
      const userId = 'user-456';
      const query = new ListJobProfilesQuery(userId, 10, 0);

      mockRepository.findByUserId.mockResolvedValue([]);
      mockRepository.countByUserId.mockResolvedValue(0);

      const result = await handler.execute(query);

      expect(result.profiles).toHaveLength(0);
      expect(result.total).toBe(0);
    });

    it('should respect pagination parameters (limit)', async () => {
      const userId = 'user-789';
      const limit = 5;
      const offset = 0;
      const query = new ListJobProfilesQuery(userId, limit, offset);

      const mockProfiles = Array.from({ length: 5 }, (_, i) =>
        JobProfile.createNew({
          userId: UserId.create(userId),
          jobTitle: `Job ${i + 1}`,
          rawJD: `Description ${i + 1}`,
        }),
      );

      mockRepository.findByUserId.mockResolvedValue(mockProfiles);
      mockRepository.countByUserId.mockResolvedValue(10);

      const result = await handler.execute(query);

      expect(mockRepository.findByUserId).toHaveBeenCalledWith(
        expect.anything(),
        limit,
        offset,
      );
      expect(result.profiles).toHaveLength(5);
      expect(result.total).toBe(10);
    });

    it('should respect pagination parameters (offset)', async () => {
      const userId = 'user-999';
      const limit = 10;
      const offset = 10;
      const query = new ListJobProfilesQuery(userId, limit, offset);

      const mockProfiles = Array.from({ length: 5 }, (_, i) =>
        JobProfile.createNew({
          userId: UserId.create(userId),
          jobTitle: `Job ${i + 11}`,
          rawJD: `Description ${i + 11}`,
        }),
      );

      mockRepository.findByUserId.mockResolvedValue(mockProfiles);
      mockRepository.countByUserId.mockResolvedValue(15);

      const result = await handler.execute(query);

      expect(mockRepository.findByUserId).toHaveBeenCalledWith(
        expect.anything(),
        limit,
        offset,
      );
      expect(result.profiles).toHaveLength(5);
      expect(result.total).toBe(15);
    });

    it('should use default limit and offset when not provided', async () => {
      const userId = 'user-default';
      const query = new ListJobProfilesQuery(userId); // No limit/offset

      mockRepository.findByUserId.mockResolvedValue([]);
      mockRepository.countByUserId.mockResolvedValue(0);

      await handler.execute(query);

      expect(mockRepository.findByUserId).toHaveBeenCalledWith(
        expect.anything(),
        10, // default limit
        0, // default offset
      );
    });
  });
});
```

### 4.2 Controller Unit Tests

**File:** `src/modules/job-profiles/presentation/http/controllers/job-profiles.controller.spec.ts`

Add to existing test file:

```typescript
import { ListJobProfilesQuery } from '../../../application/queries/impl/list-job-profiles.query';
import { ListJobProfilesResponseDto } from '../dto/list-job-profiles-response.dto';
import { ListJobProfilesRequestDto } from '../dto/list-job-profiles-request.dto';

describe('JobProfilesController', () => {
  // ...existing setup

  describe('list', () => {
    it('should return paginated list of job profiles for authenticated user', async () => {
      const userId = 'user-123';
      const user = { id: userId };
      const queryParams: ListJobProfilesRequestDto = {
        limit: 10,
        offset: 0,
      };

      const mockPaginatedDto = {
        profiles: [
          {
            id: 'profile-1',
            userId: userId,
            jobTitle: 'Senior Engineer',
            companyName: 'Tech Corp',
            jobUrl: undefined,
            rawJD: 'Job description',
            competencies: [{ name: 'Programming', weight: 1, depth: 5 }],
            hardSkills: ['TypeScript'],
            softSkills: ['Communication'],
            seniorityLevel: 7,
            interviewDifficultyLevel: 8,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
        total: 1,
      };

      mockQueryBus.execute.mockResolvedValue(mockPaginatedDto);

      const result = await controller.list(queryParams, user);

      expect(mockQueryBus.execute).toHaveBeenCalledWith(
        expect.any(ListJobProfilesQuery),
      );
      expect(result.profiles).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.profiles[0].id).toBe('profile-1');
      expect(result.profiles[0].userId).toBe(userId);
    });

    it('should use default pagination parameters', async () => {
      const userId = 'user-456';
      const user = { id: userId };
      const queryParams: ListJobProfilesRequestDto = {}; // No params

      const mockPaginatedDto = {
        profiles: [],
        total: 0,
      };

      mockQueryBus.execute.mockResolvedValue(mockPaginatedDto);

      const result = await controller.list(queryParams, user);

      const executedQuery = mockQueryBus.execute.mock
        .calls[0][0] as ListJobProfilesQuery;
      expect(executedQuery.limit).toBe(10); // default
      expect(executedQuery.offset).toBe(0); // default
      expect(result.profiles).toHaveLength(0);
      expect(result.total).toBe(0);
    });

    it('should respect custom pagination parameters', async () => {
      const userId = 'user-789';
      const user = { id: userId };
      const queryParams: ListJobProfilesRequestDto = {
        limit: 5,
        offset: 10,
      };

      const mockPaginatedDto = {
        profiles: [],
        total: 20,
      };

      mockQueryBus.execute.mockResolvedValue(mockPaginatedDto);

      await controller.list(queryParams, user);

      const executedQuery = mockQueryBus.execute.mock
        .calls[0][0] as ListJobProfilesQuery;
      expect(executedQuery.limit).toBe(5);
      expect(executedQuery.offset).toBe(10);
    });
  });
});
```

### 4.3 Integration Tests (Optional)

**File:** `test/job-profiles/list-job-profiles.e2e-spec.ts`

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '@/app.module';

describe('List Job Profiles (e2e)', () => {
  let app: INestApplication;
  let authToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true }),
    );
    await app.init();

    // TODO: Get auth token (signup/login)
    // authToken = ...
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /api/v1/job-profiles', () => {
    it('should return paginated list with default parameters', () => {
      return request(app.getHttpServer())
        .get('/api/v1/job-profiles')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('profiles');
          expect(res.body).toHaveProperty('total');
          expect(Array.isArray(res.body.profiles)).toBe(true);
          expect(typeof res.body.total).toBe('number');
        });
    });

    it('should respect custom limit parameter', () => {
      return request(app.getHttpServer())
        .get('/api/v1/job-profiles?limit=5')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.profiles.length).toBeLessThanOrEqual(5);
        });
    });

    it('should return 400 for invalid limit (> 100)', () => {
      return request(app.getHttpServer())
        .get('/api/v1/job-profiles?limit=200')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);
    });

    it('should return 400 for invalid offset (< 0)', () => {
      return request(app.getHttpServer())
        .get('/api/v1/job-profiles?offset=-1')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);
    });

    it('should return 401 without authentication', () => {
      return request(app.getHttpServer())
        .get('/api/v1/job-profiles')
        .expect(401);
    });
  });
});
```

### 4.4 Update Module README

**File:** `src/modules/job-profiles/README.md`

Add the new endpoint to the API documentation:

```markdown
### GET /api/v1/job-profiles

Retrieve a paginated list of job profiles for the authenticated user.

**Authentication:** Required (JWT Bearer token)

**Query Parameters:**

- `limit` (number, optional) - Maximum number of profiles to return (default: 10, max: 100)
- `offset` (number, optional) - Number of profiles to skip for pagination (default: 0)

**Response (200 OK):**

```json
{
  "profiles": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "userId": "user-123",
      "jobTitle": "Senior Software Engineer",
      "companyName": "Tech Corp",
      "seniorityLevel": 7,
      "interviewDifficultyLevel": 8,
      "createdAt": "2026-01-27T10:00:00Z",
      "updatedAt": "2026-01-27T10:00:00Z"
    },
    {
      "id": "660e8400-e29b-41d4-a716-446655440001",
      "userId": "user-123",
      "jobTitle": "Full Stack Developer",
      "companyName": "Startup Inc",
      "seniorityLevel": 5,
      "interviewDifficultyLevel": 6,
      "createdAt": "2026-01-26T14:30:00Z",
      "updatedAt": "2026-01-26T14:30:00Z"
    }
  ],
  "total": 15
}
```

**Notes:**

- Profiles are returned in reverse chronological order (newest first)
- Soft-deleted profiles are excluded from results
- Only profiles owned by the authenticated user are returned
- The `total` field indicates the total number of profiles (regardless of pagination)

**Error Responses:**

- `400 Bad Request` - Invalid query parameters (e.g., limit > 100 or offset < 0)
- `401 Unauthorized` - Missing or invalid JWT token

**Examples:**

```bash
# Get first 10 profiles (default)
curl -X GET "http://localhost:3000/api/v1/job-profiles" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Get profiles with custom pagination
curl -X GET "http://localhost:3000/api/v1/job-profiles?limit=5&offset=10" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Get first page with limit
curl -X GET "http://localhost:3000/api/v1/job-profiles?limit=20&offset=0" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```
```

### 4.5 Verification

```bash
# Run all tests
npm test

# Run specific tests
npm test -- --testPathPattern="list-job-profiles"

# Verify coverage
npm run test:cov

# Lint
npm run lint

# Build
npm run build
```

**Expected State:**

- ✅ All tests passing
- ✅ Code coverage maintained
- ✅ Documentation complete
- ✅ **PRODUCTION READY**

---

## Summary

This iterative approach ensures:

1. **Working endpoint from Step 1** - can be tested immediately with placeholder data
2. **Incremental value** - each step adds real functionality (pagination, database queries)
3. **Continuous integration** - app never breaks between steps
4. **Easier debugging** - issues isolated to recent changes
5. **Better understanding** - see how pagination and filtering work progressively

| Step | Endpoint Status | What's Real |
| ---- | --------------- | ----------- |
| 1 | ✅ Returns 200 | Validation, auth, structure, pagination params |
| 2 | ✅ Returns 200 | Database query, pagination logic, authorization |
| 3 | ✅ Returns 200 | Full Swagger documentation |
| 4 | ✅ **PRODUCTION** | **Tests & docs** |

---

## Key Differences from Get Job Profile

### Pagination Support

- **List**: Returns array with pagination metadata (total count)
- **Get**: Returns single object

### Response Structure

- **List**: Lightweight list items (excludes rawJD, competencies details)
- **Get**: Full profile with all fields

### Repository Calls

- **List**: `findByUserId()` with limit/offset + `countByUserId()`
- **Get**: `findById()` with single ID

### Error Handling

- **List**: Returns empty array if no profiles (not 404)
- **Get**: Returns 404 if not found

---

## Implementation Considerations

### Performance

- Pagination prevents loading all profiles at once
- Limit capped at 100 to prevent abuse
- Repository uses efficient database queries with LIMIT/OFFSET
- Consider adding ordering by created_at DESC in repository

### Security

- Only returns profiles owned by authenticated user
- Soft-deleted profiles excluded by repository
- No way to access other users' profiles

### Future Enhancements

- Add filtering (by jobTitle, companyName, seniorityLevel)
- Add sorting (by createdAt, jobTitle, seniorityLevel)
- Add search functionality
- Consider cursor-based pagination for better performance

---

**Document Status:** ✅ Ready for Iterative Implementation
**Last Updated:** 2026-01-28
**Module:** job-profiles
**Feature:** FR-JP-003 List Job Profiles (Iterative)
