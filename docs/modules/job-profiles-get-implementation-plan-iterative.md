# FR-JP-002: Get Job Profile & List Job Profiles - Iterative Implementation Plan

**Module:** `job-profiles`
**Feature:** Get Job Profile (Single) & List Job Profiles (Paginated with Filtering/Sorting)
**Version:** 3.0 (Iterative with Patterns)
**Date:** 2026-01-29
**Status:** Ready for Implementation

---

## Quick Start Guide

### Key Files to Create/Modify

#### Get Job Profile (Single)
1. **Application**: `src/modules/job-profiles/application/queries/impl/get-job-profile.query.ts`
2. **Application**: `src/modules/job-profiles/application/queries/handlers/get-job-profile.handler.ts`
3. **Presentation**: `src/modules/job-profiles/presentation/http/dto/get-job-profile-response.dto.ts`
4. **Presentation**: Update `src/modules/job-profiles/presentation/http/controllers/job-profiles.controller.ts`
5. **Module**: Update `src/modules/job-profiles/job-profiles.module.ts`

#### List Job Profiles (Paginated)
1. **Common**: Create base search/pagination DTOs (shared across modules)
2. **Presentation**: `src/modules/job-profiles/presentation/http/dto/job-profile-search.dto.ts`
3. **Application**: `src/modules/job-profiles/application/queries/impl/search-job-profiles.query.ts`
4. **Application**: `src/modules/job-profiles/application/queries/handlers/search-job-profiles.handler.ts`
5. **Domain**: Extend `IJobProfileRepository` with search/count methods
6. **Infrastructure**: Implement search/count in repository with Drizzle
7. **Presentation**: Update controller with search endpoint

### Implementation Strategy

Follow steps 1-5 sequentially. After each step, endpoints should work and return responses (even if placeholder initially).

---

## Overview

This document provides an **iterative and incremental** implementation plan for the Job Profiles retrieval features:
- **FR-JP-002**: Get single job profile by ID
- **FR-JP-003**: List/search job profiles with pagination, filtering, and sorting

This approach prioritizes having **working endpoints from the start** that return responses after each step, incorporating the unified filtering/sorting and pagination patterns from `docs/patterns/`.

### Key Principles

1. **Endpoint First**: Create working HTTP endpoints in Step 1
2. **Incremental Enhancement**: Each step adds real functionality while maintaining working endpoints
3. **Continuous Testing**: Endpoints can be tested after every step
4. **Minimal Viable Slices**: Each step delivers a complete vertical slice through all layers
5. **Pattern Compliance**: Follows unified filtering/sorting and pagination patterns

### Architecture Context

The existing `job-profiles` module already includes:

- Domain entities and value objects
- `IJobProfileRepository` with `findById`, `findByUserId`, and `countByUserId`
- Application `JobProfileDto` and `JobProfileMapper`
- Presentation `JobProfilesController` for `POST /parse` and basic listing

### Patterns Applied

This implementation incorporates:

1. **Pagination Pattern** (`docs/patterns/pagination-pattern.md`):
   - Offset-based pagination with `page` and `limit` parameters
   - Standardized response structure with pagination metadata
   - Parallel count and fetch for performance

2. **Filtering & Sorting Pattern** (`docs/patterns/filtering-sorting-pattern.md`):
   - Base search DTO system with custom transformation pipe
   - Type-safe sorting with compile-time validation
   - Flexible filtering (arrays, date ranges, strings, booleans)
   - Custom transform decorators for query parameter handling

---

## Implementation Steps Overview

| Step | What Gets Added | Endpoint Returns |
| ---- | --------------- | ---------------- |
| 1 | **ALREADY IMPLEMENTED** - Basic endpoints for Get and List | Working endpoints (Get returns single profile, List returns basic paginated results) |
| 2 | Add filtering & sorting infrastructure (DTOs, transforms, pipes) | List endpoint accepts filter/sort params (mock/basic implementation) |
| 3 | Implement full search with repository layer | Returns filtered, sorted, paginated results from DB |
| 4 | Complete documentation & Swagger specs | Full OpenAPI documentation visible |
| 5 | Tests + final documentation | Production ready |

---

## Step 1: Basic Endpoint Structure ✅ ALREADY IMPLEMENTED

**Goal:** Create working endpoints that accept requests and return responses.

**Status After:**

- ✅ Endpoint `GET /api/v1/job-profiles/:jobProfileId` responds with 200
- ✅ Endpoint `GET /api/v1/job-profiles` responds with 200 (basic list)
- ✅ Accepts GET request with ID parameter (single profile)
- ✅ Accepts GET request with limit/offset parameters (list)
- ✅ Returns real job profile data from database
- ✅ Authentication required
- ✅ Validation works
- ✅ Authorization checks in place (403 for non-owners)

**NOTE:** This step is already complete in the codebase. The following sections document the existing implementation for reference only.

### 1.1 Presentation Layer - Request/Response DTOs

**File:** `src/modules/job-profiles/presentation/http/dto/get-job-profile-response.dto.ts`

```typescript
export class GetJobProfileResponseDto {
  id!: string;
  userId!: string;
  jobTitle?: string;
  companyName?: string;
  jobUrl?: string;
  rawJD?: string;
  competencies!: Array<{
    name: string;
    weight: number;
    depth: number;
  }>;
  hardSkills!: string[];
  softSkills!: string[];
  seniorityLevel?: number;
  interviewDifficultyLevel?: number;
  createdAt!: Date;
  updatedAt!: Date;
}
```

### 1.2 Application Layer - Query

**File:** `src/modules/job-profiles/application/queries/impl/get-job-profile.query.ts`

```typescript
export class GetJobProfileQuery {
  constructor(
    public readonly userId: string,
    public readonly jobProfileId: string,
  ) {}
}
```

### 1.3 Application Layer - Query Handler (Placeholder)

**File:** `src/modules/job-profiles/application/queries/handlers/get-job-profile.handler.ts`

```typescript
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Logger } from '@nestjs/common';
import { GetJobProfileQuery } from '../impl/get-job-profile.query';
import { JobProfileDto } from '../../dto/job-profile.dto';

@QueryHandler(GetJobProfileQuery)
export class GetJobProfileHandler
  implements IQueryHandler<GetJobProfileQuery>
{
  private readonly logger = new Logger(GetJobProfileHandler.name);

  async execute(query: GetJobProfileQuery): Promise<JobProfileDto> {
    this.logger.log(
      `Fetching job profile ${query.jobProfileId} for user ${query.userId}`,
    );

    // TODO: This is placeholder data - will be replaced in Step 2
    const mockResponse: JobProfileDto = {
      id: query.jobProfileId,
      userId: query.userId,
      jobTitle: 'Software Engineer (placeholder)',
      companyName: 'Example Corp (placeholder)',
      jobUrl: undefined,
      rawJD: 'Placeholder job description',
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
    };

    this.logger.log(
      `Returning placeholder job profile with id ${mockResponse.id}`,
    );
    return mockResponse;
  }
}
```

### 1.4 Update HTTP Mapper

**File:** `src/modules/job-profiles/presentation/http/mappers/job-profile-http.mapper.ts`

Add a new method to the existing mapper:

```typescript
import { JobProfileDto } from '../../../application/dto/job-profile.dto';
import { GetJobProfileResponseDto } from '../dto/get-job-profile-response.dto';

// ...existing code

export class JobProfileHttpMapper {
  // ...existing toParseResponse method

  static toGetResponse(dto: JobProfileDto): GetJobProfileResponseDto {
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

Update the existing controller to add the GET endpoint:

```typescript
import { Controller, Post, Get, Body, Param, UseGuards, Logger } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ParseJobDescriptionRequestDto } from '../dto/parse-job-description-request.dto';
import { ParseJobDescriptionResponseDto } from '../dto/parse-job-description-response.dto';
import { GetJobProfileResponseDto } from '../dto/get-job-profile-response.dto';
import { JobProfileHttpMapper } from '../mappers/job-profile-http.mapper';
import { ParseJobDescriptionCommand } from '../../../application/commands/impl/parse-job-description.command';
import { GetJobProfileQuery } from '../../../application/queries/impl/get-job-profile.query';
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

  // ...existing parse method

  @Get(':jobProfileId')
  async getById(
    @Param('jobProfileId') jobProfileId: string,
    @CurrentUser() user: { id: string },
  ): Promise<GetJobProfileResponseDto> {
    this.logger.log(`Getting job profile ${jobProfileId} for user ${user.id}`);

    const result = await this.queryBus.execute(
      new GetJobProfileQuery(user.id, jobProfileId),
    );

    return JobProfileHttpMapper.toGetResponse(result);
  }
}
```

### 1.6 Register Query Handler in Module

**File:** `src/modules/job-profiles/job-profiles.module.ts`

```typescript
import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { ConfigModule } from '@nestjs/config';
import { JobProfilesController } from './presentation/http/controllers/job-profiles.controller';
import { ParseJobDescriptionHandler } from './application/commands/handlers/parse-job-description.handler';
import { GetJobProfileHandler } from './application/queries/handlers/get-job-profile.handler';
import { HtmlFetcherService } from './infrastructure/services/html-fetcher.service';
import { JdExtractorService } from './infrastructure/services/jd-extractor.service';
import { AiParserService } from './infrastructure/services/ai-parser.service';
import { JobProfileRepository } from './infrastructure/persistence/repositories/job-profile.repository';
import { JOB_PROFILE_REPOSITORY } from './domain/repositories/job-profile.repository.interface';
import { DatabaseModule } from '@/database/database.module';

const CommandHandlers = [ParseJobDescriptionHandler];
const QueryHandlers = [GetJobProfileHandler]; // Add this
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

### 1.7 Verification

```bash
# Start the application
npm run dev

# Test the endpoint (get JWT token first from auth endpoint)
curl -X GET http://localhost:3000/api/v1/job-profiles/test-id-123 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Expected: 200 OK with placeholder response
```

**Expected State:**

- ✅ Endpoint accessible and returns 200
- ✅ Authentication guard works
- ✅ Returns consistent JSON structure
- ✅ Application runs without errors

---

## Step 2: Add Filtering & Sorting Infrastructure

**Goal:** Create the base DTOs, decorators, and pipes for unified filtering and sorting following the pattern.

**Status After:**

- ✅ Base search DTO created with pagination support
- ✅ Custom transform decorators created (string arrays, date ranges, booleans)
- ✅ SearchTransformPipe created for query parameter transformation
- ✅ Job profile search DTO created with allowed filters
- ✅ List endpoint accepts filter/sort parameters (transforms but doesn't filter yet)

### 2.1 Create Common Base DTOs

**File:** `src/common/dto/base-pagination.dto.ts`

```typescript
import { Type } from 'class-transformer';
import { IsInt, Min, Max, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export abstract class BasePaginationDto {
  abstract page: number;
  abstract limit: number;
}

export class OffsetPaginationDto extends BasePaginationDto {
  @ApiPropertyOptional({ minimum: 1, default: 1, example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @ApiPropertyOptional({ minimum: 1, maximum: 100, default: 10, example: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit: number = 10;
}
```

**File:** `src/common/dto/sort.dto.ts`

```typescript
import { IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class SortDto<TEntity> {
  @ApiPropertyOptional({
    description: 'Sort configuration in format "field:direction"',
    example: 'createdAt:desc',
  })
  @IsOptional()
  sort?: {
    field: keyof TEntity;
    direction: 'asc' | 'desc';
  };
}
```

**File:** `src/common/dto/base-search.dto.ts`

```typescript
import { IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { BasePaginationDto } from './base-pagination.dto';
import { SortDto } from './sort.dto';

export abstract class BaseSearchDto<TEntity, TPagination extends BasePaginationDto> {
  @ValidateNested()
  @Type(() => Object) // Override in subclass with specific pagination type
  abstract pagination: TPagination;

  @ApiPropertyOptional({
    description: 'Sort configuration',
    example: { field: 'createdAt', direction: 'desc' },
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => SortDto)
  sortOptions?: SortDto<TEntity>;

  // Subclasses must define allowed sort fields
  protected abstract getAllowedSortFields(): (keyof TEntity)[];

  // Validate sort field is allowed
  validateSortField(): boolean {
    if (!this.sortOptions?.sort) return true;
    return this.getAllowedSortFields().includes(this.sortOptions.sort.field);
  }
}
```

**File:** `src/common/dto/paginated-result.dto.ts`

```typescript
export class PaginatedResult<T> {
  items: T[];
  nextPage: number | null;
  prevPage: number | null;
  totalItems: number;
  totalPages: number;
  page: number;
  limit: number;
  filters?: Record<string, any>;
  sort?: { field: string; direction: 'asc' | 'desc' };
}
```

**File:** `src/common/dto/paginated-response.dto.ts`

```typescript
import { ApiProperty } from '@nestjs/swagger';

export class PaginationMetadataDto {
  @ApiProperty({ example: 2, nullable: true })
  nextPage: number | null;

  @ApiProperty({ example: 1, nullable: true })
  prevPage: number | null;

  @ApiProperty({ example: 47 })
  totalItems: number;

  @ApiProperty({ example: 5 })
  totalPages: number;

  @ApiProperty({ type: 'object', example: { page: 2, limit: 10 } })
  query: {
    page: number;
    limit: number;
    filters?: Record<string, any>;
    sort?: { field: string; direction: 'asc' | 'desc' };
  };
}

export class PaginatedResponseDto<T> {
  @ApiProperty({ example: true })
  success: true;

  @ApiProperty()
  data: {
    items: T[];
  } & PaginationMetadataDto;
}
```

### 2.2 Create Custom Transform Decorators

**File:** `src/common/decorators/transform-string-array.decorator.ts`

```typescript
import { Transform } from 'class-transformer';

/**
 * Transforms comma-separated string to array
 * Example: "ACTIVE,PENDING" -> ["ACTIVE", "PENDING"]
 */
export function TransformStringArray() {
  return Transform(({ value }) => {
    if (!value) return undefined;
    if (Array.isArray(value)) return value;
    if (typeof value === 'string') {
      return value.split(',').map(v => v.trim());
    }
    return [value];
  });
}
```

**File:** `src/common/decorators/transform-date-range.decorator.ts`

```typescript
import { Transform } from 'class-transformer';
import { BadRequestException } from '@nestjs/common';

/**
 * Transforms comma-separated dates to date range
 * Example: "2025-01-01,2025-12-31" -> { start: Date, end: Date }
 */
export function TransformDateRange() {
  return Transform(({ value }) => {
    if (!value) return undefined;

    if (typeof value === 'string') {
      const [start, end] = value.split(',').map(v => v.trim());

      const startDate = new Date(start);
      const endDate = end ? new Date(end) : undefined;

      if (isNaN(startDate.getTime())) {
        throw new BadRequestException('Invalid start date format');
      }

      if (endDate && isNaN(endDate.getTime())) {
        throw new BadRequestException('Invalid end date format');
      }

      return {
        start: startDate,
        end: endDate || startDate,
      };
    }

    return value;
  });
}
```

**File:** `src/common/decorators/transform-boolean.decorator.ts`

```typescript
import { Transform } from 'class-transformer';

/**
 * Transforms string to boolean
 * Example: "true" -> true, "false" -> false, "1" -> true, "0" -> false
 */
export function TransformBoolean() {
  return Transform(({ value }) => {
    if (value === undefined || value === null) return undefined;
    if (typeof value === 'boolean') return value;
    if (value === 'true' || value === '1') return true;
    if (value === 'false' || value === '0') return false;
    return undefined;
  });
}
```

### 2.3 Create SearchTransformPipe

**File:** `src/common/pipes/search-transform.pipe.ts`

```typescript
import { PipeTransform, Injectable, ArgumentMetadata, BadRequestException } from '@nestjs/common';
import { plainToClass } from 'class-transformer';
import { validate } from 'class-validator';

@Injectable()
export class SearchTransformPipe implements PipeTransform {
  async transform(value: any, metadata: ArgumentMetadata) {
    if (!metadata.metatype) {
      return value;
    }

    // Transform flat query parameters to nested structure
    const transformed = this.transformQueryParams(value);

    // Convert to DTO class
    const dto = plainToClass(metadata.metatype, transformed);

    // Validate
    const errors = await validate(dto);
    if (errors.length > 0) {
      throw new BadRequestException('Validation failed', errors.toString());
    }

    // Validate sort field if present
    if (dto.validateSortField && !dto.validateSortField()) {
      throw new BadRequestException('Invalid sort field');
    }

    return dto;
  }

  private transformQueryParams(query: any): any {
    const transformed: any = {
      pagination: {},
      filters: {},
    };

    // Extract pagination parameters
    if (query.page !== undefined) {
      transformed.pagination.page = query.page;
    }
    if (query.limit !== undefined) {
      transformed.pagination.limit = query.limit;
    }

    // Extract sort parameter (format: "field:direction")
    if (query.sort) {
      const [field, direction] = query.sort.split(':');
      transformed.sortOptions = {
        sort: {
          field,
          direction: direction || 'asc',
        },
      };
    }

    // All other parameters are filters
    for (const [key, value] of Object.entries(query)) {
      if (!['page', 'limit', 'sort'].includes(key)) {
        transformed[key] = value;
      }
    }

    return transformed;
  }
}
```

### 2.4 Create Job Profile Search DTO

**File:** `src/modules/job-profiles/presentation/http/dto/job-profile-search.dto.ts`

```typescript
import { IsOptional, IsString, IsBoolean, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { BaseSearchDto } from '@/common/dto/base-search.dto';
import { OffsetPaginationDto } from '@/common/dto/base-pagination.dto';
import { TransformStringArray } from '@/common/decorators/transform-string-array.decorator';
import { TransformDateRange } from '@/common/decorators/transform-date-range.decorator';
import { TransformBoolean } from '@/common/decorators/transform-boolean.decorator';
import { JobProfile } from '@modules/job-profiles/domain/entities/job-profile.entity';

export class JobProfileSearchDto extends BaseSearchDto<JobProfile, OffsetPaginationDto> {
  @ApiPropertyOptional({ type: OffsetPaginationDto })
  @ValidateNested()
  @Type(() => OffsetPaginationDto)
  pagination!: OffsetPaginationDto;

  // Simple string filter
  @ApiPropertyOptional({
    description: 'Filter by job title (partial match)',
    example: 'Senior Backend Engineer',
  })
  @IsOptional()
  @IsString()
  jobTitle?: string;

  // Simple string filter
  @ApiPropertyOptional({
    description: 'Filter by company name (partial match)',
    example: 'Tech Corp',
  })
  @IsOptional()
  @IsString()
  companyName?: string;

  // Boolean filter
  @ApiPropertyOptional({
    description: 'Filter by parsed status',
    example: true,
  })
  @IsOptional()
  @TransformBoolean()
  @IsBoolean()
  isParsed?: boolean;

  // Date range filter
  @ApiPropertyOptional({
    description: 'Filter by creation date range (format: start,end)',
    example: '2025-01-01,2025-12-31',
  })
  @IsOptional()
  @TransformDateRange()
  createdAt?: {
    start: Date;
    end: Date;
  };

  // Define allowed sort fields
  protected getAllowedSortFields(): (keyof JobProfile)[] {
    return ['jobTitle', 'companyName', 'createdAt', 'updatedAt'];
  }
}
```

### 2.5 Update List Query to Support Search

**File:** `src/modules/job-profiles/application/queries/impl/search-job-profiles.query.ts`

```typescript
export class SearchJobProfilesQuery {
  constructor(
    public readonly userId: string,
    public readonly page: number,
    public readonly limit: number,
    public readonly jobTitle?: string,
    public readonly companyName?: string,
    public readonly isParsed?: boolean,
    public readonly createdAt?: { start: Date; end: Date },
    public readonly sort?: { field: string; direction: 'asc' | 'desc' },
  ) {}
}
```

### 2.6 Update Controller to Use SearchTransformPipe (Placeholder Handler)

**File:** Update `src/modules/job-profiles/presentation/http/controllers/job-profiles.controller.ts`

```typescript
import { SearchTransformPipe } from '@/common/pipes/search-transform.pipe';
import { JobProfileSearchDto } from '../dto/job-profile-search.dto';
import { PaginatedResponseDto } from '@/common/dto/paginated-response.dto';
import { SearchJobProfilesQuery } from '../../../application/queries/impl/search-job-profiles.query';

// In the controller class:

@Get()
@ApiOperation({
  summary: 'Search and list job profiles',
  description: 'Returns a paginated, filtered, and sorted list of job profiles',
})
@ApiResponse({
  status: 200,
  description: 'Paginated list of job profiles',
  type: PaginatedResponseDto,
})
@ApiResponse({ status: 400, description: 'Invalid query parameters' })
@ApiResponse({ status: 401, description: 'Unauthorized' })
async search(
  @Query(SearchTransformPipe) searchDto: JobProfileSearchDto,
  @CurrentUser() user: { id: string },
): Promise<PaginatedResponseDto<JobProfileListItemDto>> {
  const query = new SearchJobProfilesQuery(
    user.id,
    searchDto.pagination.page,
    searchDto.pagination.limit,
    searchDto.jobTitle,
    searchDto.companyName,
    searchDto.isParsed,
    searchDto.createdAt,
    searchDto.sortOptions?.sort,
  );

  // For now, this will use the existing ListJobProfilesHandler
  // In Step 3, we'll create a dedicated SearchJobProfilesHandler
  const result = await this.queryBus.execute(query);

  return JobProfileHttpMapper.toPaginatedResponseDto(result);
}
```

### 2.7 Verification

```bash
npm run dev

# Test the list endpoint with filters and sorting
curl -X GET "http://localhost:3000/api/v1/job-profiles?page=1&limit=10&sort=createdAt:desc" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Test with filters (should accept but not apply filters yet)
curl -X GET "http://localhost:3000/api/v1/job-profiles?jobTitle=Senior&isParsed=true" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Test with date range filter
curl -X GET "http://localhost:3000/api/v1/job-profiles?createdAt=2025-01-01,2025-12-31" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Test validation - invalid sort field should return 400
curl -X GET "http://localhost:3000/api/v1/job-profiles?sort=invalidField:desc" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Expected State:**

- ✅ Accepts query parameters with proper transformation
- ✅ Validates pagination parameters (min/max)
- ✅ Validates sort fields (only allowed fields)
- ✅ Transforms comma-separated values to arrays
- ✅ Transforms date ranges correctly
- ✅ Returns 400 for invalid parameters
- ⚠️ Filters may not be applied yet (will be implemented in Step 3)

---

## Step 3: Implement Full Search with Repository Layer

**Goal:** Implement the complete search/filter/sort functionality in the repository layer and query handler.

**Status After:**

- ✅ Repository interface extended with search and count methods
- ✅ Repository implementation with Drizzle for filtering and sorting
- ✅ SearchJobProfilesHandler created with full logic
- ✅ Database indexes added for performance
- ✅ Returns filtered, sorted, paginated results from database

### 3.1 Extend Repository Interface

**File:** `src/modules/job-profiles/domain/repositories/job-profile.repository.interface.ts`

```typescript
import { JobProfile } from "../entities/job-profile.entity";
import { JobProfileId } from "../value-objects/job-profile-id";
import { UserId } from "../value-objects/user-id";

export interface SearchFilters {
  userId: string;
  jobTitle?: string;
  companyName?: string;
  isParsed?: boolean;
  createdAt?: { start: Date; end: Date };
}

export interface SortOptions {
  field: string;
  direction: 'asc' | 'desc';
}

export interface IJobProfileRepository {
  countByUserId(userId: UserId, includeDeleted?: boolean): Promise<number>;
  findById(
    id: JobProfileId,
    includeDeleted?: boolean,
  ): Promise<JobProfile | null>;
  findByUserId(
    userId: UserId,
    limit?: number,
    offset?: number,
    includeDeleted?: boolean,
  ): Promise<JobProfile[]>;
  restore(id: JobProfileId): Promise<void>;
  save(jobProfile: JobProfile): Promise<void>;
  softDelete(id: JobProfileId): Promise<void>;

  // New methods for search
  search(
    filters: SearchFilters,
    sort: SortOptions,
    limit: number,
    offset: number,
  ): Promise<JobProfile[]>;

  count(filters: SearchFilters): Promise<number>;
}

export const JOB_PROFILE_REPOSITORY = Symbol("JOB_PROFILE_REPOSITORY");
```

### 3.2 Implement Repository Search Methods

**File:** `src/modules/job-profiles/infrastructure/persistence/repositories/job-profile.repository.ts`

Add these methods to the existing repository:

```typescript
import { eq, and, like, between, isNull, desc, asc, sql } from 'drizzle-orm';
import { SearchFilters, SortOptions } from '@modules/job-profiles/domain/repositories/job-profile.repository.interface';

// Add to JobProfileRepository class:

async search(
  filters: SearchFilters,
  sort: SortOptions,
  limit: number,
  offset: number,
): Promise<JobProfile[]> {
  // Build WHERE conditions
  const conditions = this.buildFilterConditions(filters);

  // Build ORDER BY clause
  const orderByClause = this.buildSortClause(sort);

  // Execute query
  const result = await this.db
    .select()
    .from(jobProfiles)
    .where(and(...conditions))
    .orderBy(orderByClause)
    .limit(limit)
    .offset(offset);

  return result.map(JobProfilePersistenceMapper.toDomain);
}

async count(filters: SearchFilters): Promise<number> {
  const conditions = this.buildFilterConditions(filters);

  const result = await this.db
    .select({ count: sql<number>`count(*)` })
    .from(jobProfiles)
    .where(and(...conditions));

  return result[0]?.count ?? 0;
}

private buildFilterConditions(filters: SearchFilters): any[] {
  const conditions: any[] = [];

  // Always filter by user ID
  conditions.push(eq(jobProfiles.userId, filters.userId));

  // Exclude soft-deleted records
  conditions.push(isNull(jobProfiles.deletedAt));

  // Job title filter (partial match, case-insensitive)
  if (filters.jobTitle) {
    conditions.push(
      sql`LOWER(${jobProfiles.jobTitle}) LIKE LOWER(${`%${filters.jobTitle}%`})`
    );
  }

  // Company name filter (partial match, case-insensitive)
  if (filters.companyName) {
    conditions.push(
      sql`LOWER(${jobProfiles.companyName}) LIKE LOWER(${`%${filters.companyName}%`})`
    );
  }

  // Boolean filter
  if (filters.isParsed !== undefined) {
    conditions.push(eq(jobProfiles.isParsed, filters.isParsed));
  }

  // Date range filter
  if (filters.createdAt) {
    conditions.push(
      between(
        jobProfiles.createdAt,
        filters.createdAt.start,
        filters.createdAt.end
      )
    );
  }

  return conditions;
}

private buildSortClause(sort: SortOptions): any {
  // Map sort field to database column
  const sortColumn = this.getSortColumn(sort.field);

  // Apply sort direction
  return sort.direction === 'desc' ? desc(sortColumn) : asc(sortColumn);
}

private getSortColumn(field: string): any {
  // Map domain field names to database columns
  const columnMap: Record<string, any> = {
    jobTitle: jobProfiles.jobTitle,
    companyName: jobProfiles.companyName,
    createdAt: jobProfiles.createdAt,
    updatedAt: jobProfiles.updatedAt,
  };

  return columnMap[field] || jobProfiles.createdAt;
}
```

### 3.3 Create SearchJobProfilesHandler

**File:** `src/modules/job-profiles/application/queries/handlers/search-job-profiles.handler.ts`

```typescript
import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { SearchJobProfilesQuery } from '../impl/search-job-profiles.query';
import { IJobProfileRepository, JOB_PROFILE_REPOSITORY } from '@modules/job-profiles/domain/repositories/job-profile.repository.interface';
import { PaginatedResult } from '@/common/dto/paginated-result.dto';
import { JobProfileListItemDto } from '../../dto/job-profile-list-item.dto';
import { JobProfileApplicationMapper } from '../../mappers/job-profile-application.mapper';

@QueryHandler(SearchJobProfilesQuery)
export class SearchJobProfilesHandler
  implements IQueryHandler<SearchJobProfilesQuery, PaginatedResult<JobProfileListItemDto>>
{
  constructor(
    @Inject(JOB_PROFILE_REPOSITORY)
    private readonly repository: IJobProfileRepository,
  ) {}

  async execute(query: SearchJobProfilesQuery): Promise<PaginatedResult<JobProfileListItemDto>> {
    const { userId, page, limit, jobTitle, companyName, isParsed, createdAt, sort } = query;

    // Calculate offset
    const offset = (page - 1) * limit;

    // Build filter criteria
    const filters = {
      userId,
      jobTitle,
      companyName,
      isParsed,
      createdAt,
    };

    // Build sort options
    const sortOptions = sort
      ? { field: sort.field, direction: sort.direction }
      : { field: 'createdAt', direction: 'desc' as const };

    // Execute search with filters and sorting
    const [profiles, totalItems] = await Promise.all([
      this.repository.search(filters, sortOptions, limit, offset),
      this.repository.count(filters),
    ]);

    // Calculate pagination metadata
    const totalPages = Math.ceil(totalItems / limit);
    const nextPage = page < totalPages ? page + 1 : null;
    const prevPage = page > 1 ? page - 1 : null;

    // Map to DTOs
    const items = profiles.map(JobProfileApplicationMapper.toListItemDto);

    return {
      items,
      nextPage,
      prevPage,
      totalItems,
      totalPages,
      page,
      limit,
      filters,
      sort: sortOptions,
    };
  }
}
```

### 3.4 Update HTTP Mapper for Paginated Response

**File:** `src/modules/job-profiles/presentation/http/mappers/job-profile-http.mapper.ts`

Add method to existing mapper:

```typescript
import { PaginatedResult } from '@/common/dto/paginated-result.dto';
import { PaginatedResponseDto } from '@/common/dto/paginated-response.dto';
import { JobProfileListItemDto } from '../dto/job-profile-list-item.dto';

export class JobProfileHttpMapper {
  // ...existing methods

  static toPaginatedResponseDto(
    result: PaginatedResult<JobProfileListItemDto>,
  ): PaginatedResponseDto<JobProfileListItemDto> {
    return {
      success: true,
      data: {
        items: result.items,
        nextPage: result.nextPage,
        prevPage: result.prevPage,
        totalItems: result.totalItems,
        totalPages: result.totalPages,
        query: {
          page: result.page,
          limit: result.limit,
          filters: result.filters,
          sort: result.sort,
        },
      },
    };
  }
}
```

### 3.5 Register SearchJobProfilesHandler

**File:** `src/modules/job-profiles/job-profiles.module.ts`

```typescript
import { SearchJobProfilesHandler } from './application/queries/handlers/search-job-profiles.handler';

const QueryHandlers = [
  GetJobProfileHandler,
  ListJobProfilesHandler,
  SearchJobProfilesHandler, // Add this
];
```

### 3.6 Add Database Indexes for Performance

Create migration or add to schema:

```sql
-- Composite index for common search patterns
CREATE INDEX idx_job_profiles_search
ON job_profiles(user_id, created_at DESC)
WHERE deleted_at IS NULL;

-- Index for job title searches
CREATE INDEX idx_job_profiles_job_title
ON job_profiles(user_id, job_title)
WHERE deleted_at IS NULL;

-- Index for company name searches
CREATE INDEX idx_job_profiles_company_name
ON job_profiles(user_id, company_name)
WHERE deleted_at IS NULL;

-- Index for date range queries
CREATE INDEX idx_job_profiles_created_at
ON job_profiles(user_id, created_at)
WHERE deleted_at IS NULL;

-- Index for boolean filters
CREATE INDEX idx_job_profiles_parsed
ON job_profiles(user_id, is_parsed)
WHERE deleted_at IS NULL;
```

### 3.7 Update Response DTO with Swagger Decorators

**File:** `src/modules/job-profiles/presentation/http/dto/job-profile-list-item.dto.ts`

```typescript
import { ApiProperty } from '@nestjs/swagger';

export class JobProfileListItemDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  id!: string;

  @ApiProperty({ example: 'Senior Software Engineer' })
  jobTitle!: string;

  @ApiProperty({ example: 'Tech Corp', required: false })
  companyName?: string;

  @ApiProperty({ example: true })
  isParsed!: boolean;

  @ApiProperty({ example: '2026-01-27T10:00:00Z' })
  createdAt!: Date;

  @ApiProperty({ example: '2026-01-27T10:00:00Z' })
  updatedAt!: Date;
}
```

### 3.8 Verification

```bash
npm run dev

# Test search with filters
curl -X GET "http://localhost:3000/api/v1/job-profiles?jobTitle=Senior&page=1&limit=10&sort=createdAt:desc" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Test with company name filter
curl -X GET "http://localhost:3000/api/v1/job-profiles?companyName=Tech" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Test with boolean filter
curl -X GET "http://localhost:3000/api/v1/job-profiles?isParsed=true" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Test with date range
curl -X GET "http://localhost:3000/api/v1/job-profiles?createdAt=2025-01-01,2025-12-31" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Test with multiple filters and sorting
curl -X GET "http://localhost:3000/api/v1/job-profiles?jobTitle=Engineer&companyName=Corp&sort=jobTitle:asc&page=1&limit=5" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Expected State:**

- ✅ Returns filtered results based on query parameters
- ✅ Returns sorted results based on sort parameter
- ✅ Returns paginated results with correct metadata
- ✅ Partial string matching works (case-insensitive)
- ✅ Date range filtering works
- ✅ Boolean filtering works
- ✅ Multiple filters work together
- ✅ Count reflects filtered results (not total)
- ✅ Performance is acceptable (indexes help)

---

## Step 4: Complete Swagger Documentation

**Goal:** Add comprehensive Swagger/OpenAPI documentation for all endpoints.

**Status After:**

- ✅ Full Swagger/OpenAPI documentation
- ✅ All query parameters documented
- ✅ All response fields documented
- ✅ Proper HTTP status codes documented
- ✅ Examples provided for all endpoints
- ✅ Visible and testable in Swagger UI

### 4.1 Add Comprehensive Swagger Documentation to Controller

**File:** `src/modules/job-profiles/presentation/http/controllers/job-profiles.controller.ts`

Update the search endpoint with full documentation:

```typescript
import { ApiQuery } from '@nestjs/swagger';

@Get()
@ApiOperation({
  summary: 'Search and list job profiles',
  description: `Returns a paginated, filtered, and sorted list of job profiles.

  **Filters:**
  - jobTitle: Partial match, case-insensitive
  - companyName: Partial match, case-insensitive
  - isParsed: Boolean filter for parsed status
  - createdAt: Date range filter (format: start,end)

  **Sorting:**
  - Use format: field:direction (e.g., createdAt:desc)
  - Allowed fields: jobTitle, companyName, createdAt, updatedAt

  **Pagination:**
  - page: Page number (1-indexed, default: 1)
  - limit: Items per page (default: 10, max: 100)`,
})
@ApiQuery({
  name: 'page',
  required: false,
  type: Number,
  description: 'Page number (1-indexed)',
  example: 1,
})
@ApiQuery({
  name: 'limit',
  required: false,
  type: Number,
  description: 'Items per page (max: 100)',
  example: 10,
})
@ApiQuery({
  name: 'sort',
  required: false,
  type: String,
  description: 'Sort configuration (format: field:direction)',
  example: 'createdAt:desc',
})
@ApiQuery({
  name: 'jobTitle',
  required: false,
  type: String,
  description: 'Filter by job title (partial match, case-insensitive)',
  example: 'Senior Engineer',
})
@ApiQuery({
  name: 'companyName',
  required: false,
  type: String,
  description: 'Filter by company name (partial match, case-insensitive)',
  example: 'Tech Corp',
})
@ApiQuery({
  name: 'isParsed',
  required: false,
  type: Boolean,
  description: 'Filter by parsed status',
  example: true,
})
@ApiQuery({
  name: 'createdAt',
  required: false,
  type: String,
  description: 'Filter by creation date range (format: start,end)',
  example: '2025-01-01,2025-12-31',
})
@ApiResponse({
  status: 200,
  description: 'Paginated list of job profiles',
  schema: {
    type: 'object',
    properties: {
      success: { type: 'boolean', example: true },
      data: {
        type: 'object',
        properties: {
          items: {
            type: 'array',
            items: { $ref: '#/components/schemas/JobProfileListItemDto' },
          },
          nextPage: { type: 'number', nullable: true, example: 2 },
          prevPage: { type: 'number', nullable: true, example: null },
          totalItems: { type: 'number', example: 47 },
          totalPages: { type: 'number', example: 5 },
          query: {
            type: 'object',
            properties: {
              page: { type: 'number', example: 1 },
              limit: { type: 'number', example: 10 },
              filters: {
                type: 'object',
                example: { jobTitle: 'Senior', isParsed: true },
              },
              sort: {
                type: 'object',
                properties: {
                  field: { type: 'string', example: 'createdAt' },
                  direction: { type: 'string', example: 'desc' },
                },
              },
            },
          },
        },
      },
    },
  },
})
@ApiResponse({ status: 400, description: 'Invalid query parameters' })
@ApiResponse({ status: 401, description: 'Unauthorized' })
async search(
  @Query(SearchTransformPipe) searchDto: JobProfileSearchDto,
  @CurrentUser() user: { id: string },
): Promise<PaginatedResponseDto<JobProfileListItemDto>> {
  // Implementation
}
```

### 4.2 Document Get Single Profile Endpoint

Ensure the existing GET by ID endpoint has full documentation:

```typescript
@Get(':jobProfileId')
@ApiOperation({
  summary: 'Get job profile by ID',
  description: 'Retrieve a job profile by its ID. Users can only access their own job profiles.',
})
@ApiParam({
  name: 'jobProfileId',
  description: 'UUID of the job profile',
  example: '550e8400-e29b-41d4-a716-446655440000',
})
@ApiResponse({
  status: HttpStatus.OK,
  description: 'Job profile retrieved successfully',
  type: GetJobProfileResponseDto,
})
@ApiResponse({
  status: HttpStatus.NOT_FOUND,
  description: 'Job profile not found or soft-deleted',
})
@ApiResponse({
  status: HttpStatus.FORBIDDEN,
  description: 'Access denied - profile belongs to another user',
})
@ApiResponse({
  status: HttpStatus.UNAUTHORIZED,
  description: 'Authentication required',
})
async getById(
  @Param('jobProfileId') jobProfileId: string,
  @CurrentUser() user: { id: string },
): Promise<GetJobProfileResponseDto> {
  // Implementation
}
```

### 4.3 Add Full Swagger Decorators to Response DTOs

**File:** `src/modules/job-profiles/presentation/http/dto/get-job-profile-response.dto.ts`

```typescript
import { ApiProperty } from '@nestjs/swagger';

export class CompetencyResponseDto {
  @ApiProperty({ example: 'System Design', description: 'Competency name' })
  name!: string;

  @ApiProperty({
    example: 0.3,
    minimum: 0,
    maximum: 1,
    description: 'Weight/importance of this competency (0-1)'
  })
  weight!: number;

  @ApiProperty({
    example: 8,
    minimum: 1,
    maximum: 10,
    description: 'Required depth/expertise level (1-10)'
  })
  depth!: number;
}

export class GetJobProfileResponseDto {
  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'Job profile unique identifier'
  })
  id!: string;

  @ApiProperty({
    example: 'user-123',
    description: 'User ID who owns this profile'
  })
  userId!: string;

  @ApiProperty({
    example: 'Senior Software Engineer',
    description: 'Job title',
    required: false
  })
  jobTitle?: string;

  @ApiProperty({
    example: 'Tech Corp',
    description: 'Company name',
    required: false
  })
  companyName?: string;

  @ApiProperty({
    example: 'https://example.com/jobs/senior-engineer',
    description: 'Original job posting URL',
    required: false,
  })
  jobUrl?: string;

  @ApiProperty({
    example: 'We are looking for a senior engineer...',
    description: 'Raw job description text',
    required: false,
  })
  rawJD?: string;

  @ApiProperty({
    type: [CompetencyResponseDto],
    description: 'Parsed competencies with weights and depth'
  })
  competencies!: CompetencyResponseDto[];

  @ApiProperty({
    type: [String],
    example: ['TypeScript', 'NestJS', 'PostgreSQL'],
    description: 'Technical skills required'
  })
  hardSkills!: string[];

  @ApiProperty({
    type: [String],
    example: ['Communication', 'Leadership', 'Mentoring'],
    description: 'Soft skills required'
  })
  softSkills!: string[];

  @ApiProperty({
    example: 7,
    minimum: 1,
    maximum: 10,
    description: 'Seniority level (1-10)',
    required: false
  })
  seniorityLevel?: number;

  @ApiProperty({
    example: 8,
    minimum: 1,
    maximum: 10,
    description: 'Expected interview difficulty (1-10)',
    required: false
  })
  interviewDifficultyLevel?: number;

  @ApiProperty({
    example: '2026-01-27T10:00:00Z',
    description: 'Profile creation timestamp'
  })
  createdAt!: Date;

  @ApiProperty({
    example: '2026-01-27T10:00:00Z',
    description: 'Profile last update timestamp'
  })
  updatedAt!: Date;
}
```

### 4.4 Verification

```bash
npm run dev

# Access Swagger UI
open http://localhost:3000/api

# Verify documentation:
# 1. GET /api/v1/job-profiles - search endpoint with all query params
# 2. GET /api/v1/job-profiles/{jobProfileId} - get by ID endpoint
# 3. All parameters documented with examples
# 4. All response schemas visible
# 5. Try out functionality works in Swagger UI
```

**Expected State:**

- ✅ Swagger UI shows both GET endpoints
- ✅ All query parameters documented with descriptions and examples
- ✅ Response schemas fully documented
- ✅ Status codes documented
- ✅ Can test endpoints directly from Swagger UI
- ✅ Examples are accurate and helpful

---

## Step 5: Tests + Final Documentation

**Goal:** Add comprehensive tests and finalize documentation.

**Status After:**

- ✅ Unit tests for query handlers
- ✅ Integration tests for repository
- ✅ E2E tests for endpoints
- ✅ README updated
- ✅ **PRODUCTION READY**

### 5.1 SearchJobProfilesHandler Unit Tests

**File:** `src/modules/job-profiles/application/queries/handlers/search-job-profiles.handler.spec.ts`

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { SearchJobProfilesHandler } from './search-job-profiles.handler';
import { SearchJobProfilesQuery } from '../impl/search-job-profiles.query';
import {
  IJobProfileRepository,
  JOB_PROFILE_REPOSITORY,
} from '../../../domain/repositories/job-profile.repository.interface';
import { JobProfile } from '../../../domain/entities/job-profile.entity';
import { UserId } from '../../../domain/value-objects/user-id';

describe('SearchJobProfilesHandler', () => {
  let handler: SearchJobProfilesHandler;
  let mockRepository: jest.Mocked<IJobProfileRepository>;

  beforeEach(async () => {
    mockRepository = {
      search: jest.fn(),
      count: jest.fn(),
      findById: jest.fn(),
      findByUserId: jest.fn(),
      save: jest.fn(),
      countByUserId: jest.fn(),
      softDelete: jest.fn(),
      restore: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SearchJobProfilesHandler,
        {
          provide: JOB_PROFILE_REPOSITORY,
          useValue: mockRepository,
        },
      ],
    }).compile();

    handler = module.get<SearchJobProfilesHandler>(SearchJobProfilesHandler);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    it('should return paginated and filtered results', async () => {
      const userId = 'user-123';
      const mockProfiles = [
        JobProfile.createNew({
          userId: UserId.create(userId),
          jobTitle: 'Senior Engineer',
          rawJD: 'JD 1',
        }),
      ];

      mockRepository.search.mockResolvedValue(mockProfiles);
      mockRepository.count.mockResolvedValue(1);

      const query = new SearchJobProfilesQuery(
        userId,
        1,
        10,
        'Senior',
        undefined,
        true,
        undefined,
        { field: 'createdAt', direction: 'desc' },
      );

      const result = await handler.execute(query);

      expect(mockRepository.search).toHaveBeenCalledWith(
        expect.objectContaining({
          userId,
          jobTitle: 'Senior',
          isParsed: true,
        }),
        { field: 'createdAt', direction: 'desc' },
        10,
        0,
      );
      expect(result.items).toHaveLength(1);
      expect(result.totalItems).toBe(1);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
    });

    it('should apply default sort when none provided', async () => {
      mockRepository.search.mockResolvedValue([]);
      mockRepository.count.mockResolvedValue(0);

      const query = new SearchJobProfilesQuery(
        'user-123',
        1,
        10,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
      );

      await handler.execute(query);

      expect(mockRepository.search).toHaveBeenCalledWith(
        expect.any(Object),
        { field: 'createdAt', direction: 'desc' },
        10,
        0,
      );
    });

    it('should calculate pagination metadata correctly', async () => {
      mockRepository.search.mockResolvedValue([]);
      mockRepository.count.mockResolvedValue(50);

      const query = new SearchJobProfilesQuery(
        'user-123',
        3,
        10,
      );

      const result = await handler.execute(query);

      expect(result.totalPages).toBe(5);
      expect(result.nextPage).toBe(4);
      expect(result.prevPage).toBe(2);
    });
  });
});
```

### 5.2 Repository Integration Tests

**File:** `src/modules/job-profiles/infrastructure/persistence/repositories/job-profile.repository.spec.ts`

Add to existing test file:

```typescript
describe('JobProfileRepository - Search', () => {
  let repository: JobProfileRepository;
  let db: DrizzleDb;

  beforeEach(async () => {
    // Setup test database
  });

  it('should filter by job title (partial match)', async () => {
    const userId = UserId.create('user-123');

    // Create test data
    await repository.save(
      JobProfile.createNew({ userId, jobTitle: 'Senior Backend Engineer', rawJD: 'JD' })
    );
    await repository.save(
      JobProfile.createNew({ userId, jobTitle: 'Junior Frontend Developer', rawJD: 'JD' })
    );

    const results = await repository.search(
      { userId: userId.getValue(), jobTitle: 'Backend' },
      { field: 'createdAt', direction: 'desc' },
      10,
      0,
    );

    expect(results).toHaveLength(1);
    expect(results[0].getJobTitle()).toContain('Backend');
  });

  it('should filter by company name (partial match)', async () => {
    const userId = UserId.create('user-123');

    await repository.save(
      JobProfile.createNew({ userId, companyName: 'Tech Corp', rawJD: 'JD' })
    );
    await repository.save(
      JobProfile.createNew({ userId, companyName: 'Other Inc', rawJD: 'JD' })
    );

    const results = await repository.search(
      { userId: userId.getValue(), companyName: 'Tech' },
      { field: 'createdAt', direction: 'desc' },
      10,
      0,
    );

    expect(results).toHaveLength(1);
    expect(results[0].getCompanyName()).toBe('Tech Corp');
  });

  it('should filter by isParsed', async () => {
    const userId = UserId.create('user-123');

    const parsed = JobProfile.createNew({ userId, rawJD: 'JD', isParsed: true });
    const unparsed = JobProfile.createNew({ userId, rawJD: 'JD', isParsed: false });

    await repository.save(parsed);
    await repository.save(unparsed);

    const results = await repository.search(
      { userId: userId.getValue(), isParsed: true },
      { field: 'createdAt', direction: 'desc' },
      10,
      0,
    );

    expect(results).toHaveLength(1);
    expect(results[0].getIsParsed()).toBe(true);
  });

  it('should filter by date range', async () => {
    const userId = UserId.create('user-123');

    // Create profiles at different times
    const old = JobProfile.createNew({
      userId,
      rawJD: 'JD',
      createdAt: new Date('2024-01-01'),
    });
    const recent = JobProfile.createNew({
      userId,
      rawJD: 'JD',
      createdAt: new Date('2025-01-15'),
    });

    await repository.save(old);
    await repository.save(recent);

    const results = await repository.search(
      {
        userId: userId.getValue(),
        createdAt: {
          start: new Date('2025-01-01'),
          end: new Date('2025-12-31'),
        },
      },
      { field: 'createdAt', direction: 'desc' },
      10,
      0,
    );

    expect(results).toHaveLength(1);
    expect(results[0].getId().getValue()).toBe(recent.getId().getValue());
  });

  it('should sort correctly', async () => {
    const userId = UserId.create('user-123');

    const profile1 = JobProfile.createNew({ userId, jobTitle: 'Zebra', rawJD: 'JD' });
    const profile2 = JobProfile.createNew({ userId, jobTitle: 'Alpha', rawJD: 'JD' });
    const profile3 = JobProfile.createNew({ userId, jobTitle: 'Beta', rawJD: 'JD' });

    await repository.save(profile1);
    await repository.save(profile2);
    await repository.save(profile3);

    // Sort ascending
    const resultsAsc = await repository.search(
      { userId: userId.getValue() },
      { field: 'jobTitle', direction: 'asc' },
      10,
      0,
    );

    expect(resultsAsc[0].getJobTitle()).toBe('Alpha');
    expect(resultsAsc[2].getJobTitle()).toBe('Zebra');

    // Sort descending
    const resultsDesc = await repository.search(
      { userId: userId.getValue() },
      { field: 'jobTitle', direction: 'desc' },
      10,
      0,
    );

    expect(resultsDesc[0].getJobTitle()).toBe('Zebra');
    expect(resultsDesc[2].getJobTitle()).toBe('Alpha');
  });

  it('should apply multiple filters together', async () => {
    const userId = UserId.create('user-123');

    await repository.save(
      JobProfile.createNew({
        userId,
        jobTitle: 'Senior Engineer',
        companyName: 'Tech Corp',
        isParsed: true,
        rawJD: 'JD',
      })
    );
    await repository.save(
      JobProfile.createNew({
        userId,
        jobTitle: 'Senior Engineer',
        companyName: 'Other Inc',
        isParsed: false,
        rawJD: 'JD',
      })
    );

    const results = await repository.search(
      {
        userId: userId.getValue(),
        jobTitle: 'Senior',
        companyName: 'Tech',
        isParsed: true,
      },
      { field: 'createdAt', direction: 'desc' },
      10,
      0,
    );

    expect(results).toHaveLength(1);
    expect(results[0].getCompanyName()).toBe('Tech Corp');
  });
});
```

### 5.3 E2E Tests

**File:** `test/job-profiles.e2e-spec.ts`

Add to existing test file:

```typescript
describe('GET /api/v1/job-profiles (search)', () => {
  it('should filter by job title', () => {
    return request(app.getHttpServer())
      .get('/api/v1/job-profiles?jobTitle=Senior')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200)
      .expect((res) => {
        expect(res.body.success).toBe(true);
        expect(res.body.data.items.every((item) =>
          item.jobTitle.includes('Senior')
        )).toBe(true);
      });
  });

  it('should filter by company name', () => {
    return request(app.getHttpServer())
      .get('/api/v1/job-profiles?companyName=Tech')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200)
      .expect((res) => {
        expect(res.body.data.items.every((item) =>
          item.companyName?.includes('Tech')
        )).toBe(true);
      });
  });

  it('should sort by created date descending', () => {
    return request(app.getHttpServer())
      .get('/api/v1/job-profiles?sort=createdAt:desc')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200)
      .expect((res) => {
        const items = res.body.data.items;
        for (let i = 0; i < items.length - 1; i++) {
          const current = new Date(items[i].createdAt);
          const next = new Date(items[i + 1].createdAt);
          expect(current.getTime()).toBeGreaterThanOrEqual(next.getTime());
        }
      });
  });

  it('should reject invalid sort field', () => {
    return request(app.getHttpServer())
      .get('/api/v1/job-profiles?sort=invalidField:desc')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(400);
  });

  it('should combine filters, sorting, and pagination', () => {
    return request(app.getHttpServer())
      .get('/api/v1/job-profiles?jobTitle=Engineer&sort=createdAt:desc&page=1&limit=5')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200)
      .expect((res) => {
        expect(res.body.data.query).toEqual({
          page: 1,
          limit: 5,
          filters: expect.objectContaining({
            jobTitle: 'Engineer',
          }),
          sort: { field: 'createdAt', direction: 'desc' },
        });
      });
  });
});
```

### 5.4 Update Module README

**File:** `src/modules/job-profiles/README.md`

Add comprehensive API documentation:

```markdown
## Job Profiles API

### GET /api/v1/job-profiles

Search and list job profiles with pagination, filtering, and sorting.

**Authentication:** Required (JWT Bearer token)

**Query Parameters:**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `page` | number | No | 1 | Page number (1-indexed) |
| `limit` | number | No | 10 | Items per page (max: 100) |
| `sort` | string | No | createdAt:desc | Sort format: field:direction |
| `jobTitle` | string | No | - | Filter by job title (partial, case-insensitive) |
| `companyName` | string | No | - | Filter by company name (partial, case-insensitive) |
| `isParsed` | boolean | No | - | Filter by parsed status |
| `createdAt` | string | No | - | Filter by date range (format: start,end) |

**Allowed Sort Fields:**
- `jobTitle`, `companyName`, `createdAt`, `updatedAt`

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "jobTitle": "Senior Software Engineer",
        "companyName": "Tech Corp",
        "isParsed": true,
        "createdAt": "2026-01-27T10:00:00Z",
        "updatedAt": "2026-01-27T10:00:00Z"
      }
    ],
    "nextPage": 2,
    "prevPage": null,
    "totalItems": 47,
    "totalPages": 5,
    "query": {
      "page": 1,
      "limit": 10,
      "filters": {
        "jobTitle": "Senior",
        "isParsed": true
      },
      "sort": {
        "field": "createdAt",
        "direction": "desc"
      }
    }
  }
}
```

**Examples:**

```bash
# Basic listing
curl -X GET "http://localhost:3000/api/v1/job-profiles?page=1&limit=10" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# With filters
curl -X GET "http://localhost:3000/api/v1/job-profiles?jobTitle=Senior&isParsed=true" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# With sorting
curl -X GET "http://localhost:3000/api/v1/job-profiles?sort=jobTitle:asc" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Combined
curl -X GET "http://localhost:3000/api/v1/job-profiles?jobTitle=Engineer&companyName=Tech&sort=createdAt:desc&page=1&limit=5" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

### GET /api/v1/job-profiles/:jobProfileId

Retrieve a single job profile by its ID.

**Authentication:** Required (JWT Bearer token)

**Path Parameters:**

- `jobProfileId` (string, required) - UUID of the job profile

**Response (200 OK):**

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "userId": "user-123",
  "jobTitle": "Senior Software Engineer",
  "companyName": "Tech Corp",
  "jobUrl": "https://example.com/job",
  "rawJD": "We are looking for...",
  "competencies": [
    {
      "name": "System Design",
      "weight": 0.3,
      "depth": 8
    }
  ],
  "hardSkills": ["TypeScript", "NestJS", "PostgreSQL"],
  "softSkills": ["Communication", "Leadership"],
  "seniorityLevel": 7,
  "interviewDifficultyLevel": 8,
  "createdAt": "2026-01-27T10:00:00Z",
  "updatedAt": "2026-01-27T10:00:00Z"
}
```

**Error Responses:**

- `401 Unauthorized` - Missing or invalid JWT token
- `403 Forbidden` - Job profile belongs to another user
- `404 Not Found` - Job profile not found or soft-deleted

**Example:**

```bash
curl -X GET http://localhost:3000/api/v1/job-profiles/550e8400-e29b-41d4-a716-446655440000 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```
```

### 5.5 Verification

```bash
# Run all tests
npm test

# Run specific tests
npm test -- --testPathPattern="get-job-profile"

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

1. **Working endpoints from Step 1** - can be tested immediately (already implemented)
2. **Incremental value** - each step adds real functionality
3. **Pattern compliance** - follows unified filtering/sorting and pagination patterns
4. **Continuous integration** - app never breaks
5. **Easier debugging** - issues isolated to recent changes
6. **Better understanding** - see how layers connect progressively
7. **Type safety** - compile-time validation of filters and sort fields
8. **Performance** - database indexes for optimized queries

| Step | Endpoint Status | What's Real |
| ---- | --------------- | ----------- |
| 1 | ✅ **IMPLEMENTED** | Both endpoints working with basic pagination |
| 2 | 🔨 **TODO** | Add filtering & sorting infrastructure (DTOs, pipes, transforms) |
| 3 | 🔨 **TODO** | Implement full search in repository layer |
| 4 | 🔨 **TODO** | Complete Swagger/OpenAPI documentation |
| 5 | 🔨 **TODO** | Tests & final docs → **PRODUCTION READY** |

---

## Pattern Implementation Benefits

### Filtering & Sorting Pattern

✅ **Type-safe sorting** - compile-time validation of allowed fields
✅ **Flexible filtering** - supports strings, arrays, booleans, date ranges
✅ **Automatic transformation** - comma-separated values to arrays, date ranges
✅ **Custom decorators** - reusable transform logic
✅ **SearchTransformPipe** - unified query parameter handling
✅ **Validation** - class-validator integration

### Pagination Pattern

✅ **Offset-based pagination** - simple and predictable
✅ **Standardized response** - consistent structure across all endpoints
✅ **Rich metadata** - nextPage, prevPage, totalItems, totalPages
✅ **Query echo** - returns applied filters and sort in response
✅ **Parallel queries** - count and fetch executed in parallel
✅ **Performance optimized** - database indexes for common patterns

---

## Key Differences from Original Plan

### Implementation Order

1. ❌ **Original**: Query → DTO → Controller (waterfall)
2. ✅ **Updated**: Endpoint (✅ done) → Filters/Sort Infrastructure → Repository → Swagger → Tests

### New Additions

- **Base search DTO system** for consistent filtering across modules
- **Custom transform decorators** for query parameter handling
- **SearchTransformPipe** for automatic parameter transformation
- **Unified pagination response** structure
- **Database indexes** for performance optimization
- **Type-safe sorting** with allowed field validation

### Benefits

- **Faster feedback**: Endpoints already working
- **Better validation**: Query parameters validated and transformed automatically
- **Clearer progress**: Each step delivers working functionality
- **Easier debugging**: Smaller changes between working states
- **Pattern compliance**: Follows established architectural patterns
- **Reusability**: Base DTOs and decorators can be used by other modules

---

## Related Patterns

This implementation follows:

- **Pagination Pattern**: `docs/patterns/pagination-pattern.md`
- **Filtering & Sorting Pattern**: `docs/patterns/filtering-sorting-pattern.md`
- **Iterative Implementation**: `docs/rules/iterative-endpoint-implementation.md`

---

**Document Status:** ✅ Ready for Implementation (Step 1 Complete, Steps 2-5 Defined)
**Last Updated:** 2026-01-29
**Module:** job-profiles
**Features:**
- FR-JP-002: Get Job Profile by ID (✅ Implemented)
- FR-JP-003: List/Search Job Profiles with Pagination, Filtering, Sorting (🔨 Steps 2-5 TODO)
