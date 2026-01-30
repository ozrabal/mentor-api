# FR-JP-003: List Job Profiles - Iterative Implementation Plan

**Module:** `job-profiles`
**Feature:** List Job Profiles with Filtering, Sorting, and Pagination
**Version:** 2.0 (Updated for Pagination & Filtering Patterns)
**Date:** 2026-01-30
**Status:** Ready for Implementation

---

## Quick Start Guide

### Key Files to Create/Modify

#### Common Layer (Shared Infrastructure)

1. **Common**: `src/common/dto/base-search.dto.ts` (Base search DTO)
2. **Common**: `src/common/dto/base-pagination.dto.ts` (Pagination DTOs)
3. **Common**: `src/common/dto/sort.dto.ts` (Sort DTO)
4. **Common**: `src/common/dto/paginated-result.dto.ts` (Application result DTO)
5. **Common**: `src/common/dto/paginated-response.dto.ts` (HTTP response DTO)
6. **Common**: `src/common/pipes/search-transform.pipe.ts` (Query transform pipe)
7. **Common**: `src/common/decorators/transform-string-array.decorator.ts` (Array transform)
8. **Common**: `src/common/decorators/transform-date-range.decorator.ts` (Date range transform)
9. **Common**: `src/common/decorators/transform-boolean.decorator.ts` (Boolean transform)

#### Job Profiles Module

1. **Application**: `src/modules/job-profiles/application/queries/impl/search-job-profiles.query.ts`
2. **Application**: `src/modules/job-profiles/application/queries/handlers/search-job-profiles.handler.ts`
3. **Presentation**: `src/modules/job-profiles/presentation/http/dto/job-profile-search.dto.ts`
4. **Presentation**: `src/modules/job-profiles/presentation/http/dto/job-profile-list-item.dto.ts`
5. **Presentation**: Update `src/modules/job-profiles/presentation/http/controllers/job-profiles.controller.ts`
6. **Presentation**: Update `src/modules/job-profiles/presentation/http/mappers/job-profile-http.mapper.ts`
7. **Domain**: Update `src/modules/job-profiles/domain/repositories/job-profile.repository.interface.ts`
8. **Infrastructure**: Update `src/modules/job-profiles/infrastructure/persistence/repositories/job-profile.repository.ts`
9. **Module**: Update `src/modules/job-profiles/job-profiles.module.ts`

### Implementation Strategy

Follow steps 1-4 sequentially. After each step, the endpoint should work and return a response (even if placeholder initially).

**Key Changes from v1.0:**

- Page-based pagination (not limit/offset at HTTP layer)
- Unified filtering and sorting system
- Base DTOs for consistency
- SearchTransformPipe for query parameter transformation
- Standardized paginated response structure

---

## Overview

This document provides an **iterative and incremental** implementation plan for the List Job Profiles feature (FR-JP-003) with **filtering, sorting, and pagination**. This approach prioritizes having a **working endpoint from the start** that returns responses after each step, even if they're placeholder responses initially.

### Key Principles

1. **Endpoint First**: Create the HTTP endpoint in Step 1 so it can be invoked immediately
2. **Incremental Enhancement**: Each step adds real functionality while maintaining a working endpoint
3. **Continuous Testing**: The endpoint can be tested after every step
4. **Minimal Viable Slices**: Each step delivers a complete vertical slice through all layers
5. **Pattern Compliance**: Follows established filtering-sorting and pagination patterns

### Architecture Context

The existing `job-profiles` module already includes:

- Domain entities (JobProfile) and value objects (UserId, JobProfileId)
- `IJobProfileRepository` with `findByUserId` and `countByUserId` methods
- Application `JobProfileDto` and `JobProfileMapper`
- Presentation `JobProfilesController` with POST /parse and GET /:id endpoints

### What We're Adding

1. **Common Infrastructure** (reusable across modules):
   - Base search DTO with pagination and sorting
   - SearchTransformPipe for query parameter transformation
   - Transform decorators for arrays, dates, booleans
   - Standardized paginated response DTOs

2. **Job Profiles Search**:
   - Search query and handler with filtering/sorting
   - Module-specific search DTO extending base
   - Enhanced repository with `search()` and `count()` methods
   - HTTP mapper for paginated responses

---

## Implementation Steps Overview

| Step | What Gets Added | Endpoint Returns |
| ---- | --------------- | ---------------- |
| 1 | Common infrastructure + basic endpoint with placeholder | Mock paginated response with filtering/sorting structure |
| 2 | Real repository search + filtering/sorting | Actual DB query results with filters and sorting |
| 3 | Full Swagger documentation + validation | Complete API documentation |
| 4 | Comprehensive tests | Production ready |

**API Contract Example:**

```bash
GET /api/v1/job-profiles?page=2&limit=10&jobTitle=Senior&sort=createdAt:desc
```

**Response Structure:**

```json
{
  "success": true,
  "data": {
    "items": [...],
    "nextPage": 3,
    "prevPage": 1,
    "totalItems": 47,
    "totalPages": 5,
    "query": {
      "page": 2,
      "limit": 10,
      "filters": { "jobTitle": "Senior" },
      "sort": { "field": "createdAt", "direction": "desc" }
    }
  }
}
```

---

## Step 1: Common Infrastructure + Basic Endpoint Structure

**Goal:** Create reusable common infrastructure and working endpoint with placeholder data.

**Status After:**

- ✅ Common pagination, sorting, and filtering infrastructure created
- ✅ Endpoint `/api/v1/job-profiles` responds with 200
- ✅ Accepts GET request with query parameters (page, limit, sort, filters)
- ✅ Returns mock paginated response following standard structure
- ✅ Authentication required
- ✅ Query parameter transformation works

---

### 1.1 Common Layer - Base Pagination DTO

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

---

### 1.2 Common Layer - Sort DTO

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

---

### 1.3 Common Layer - Base Search DTO

**File:** `src/common/dto/base-search.dto.ts`

```typescript
import { ValidateNested, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { SortDto } from './sort.dto';
import { BasePaginationDto } from './base-pagination.dto';

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

---

### 1.4 Common Layer - Transform Decorators

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

---

### 1.5 Common Layer - Search Transform Pipe

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

---

### 1.6 Common Layer - Paginated Result DTO (Application Layer)

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

---

### 1.7 Common Layer - Paginated Response DTO (HTTP Layer)

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

  @ApiProperty({ type: 'object' })
  query: {
    page: number;
    limit: number;
    filters?: Record<string, any>;
    sort?: { field: string; direction: 'asc' | 'desc' };
  };
}

export class PaginatedResponseDto<T> {
  @ApiProperty({ example: true })
  success: true = true;

  @ApiProperty()
  data!: {
    items: T[];
  } & PaginationMetadataDto;
}
```

---

### 1.8 Module Layer - Job Profile Search DTO

**File:** `src/modules/job-profiles/presentation/http/dto/job-profile-search.dto.ts`

```typescript
import { IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { BaseSearchDto } from '@/common/dto/base-search.dto';
import { OffsetPaginationDto } from '@/common/dto/base-pagination.dto';

// Minimal for Step 1 - will add more filters in Step 2
export class JobProfileSearchDto extends BaseSearchDto<any, OffsetPaginationDto> {
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

  // Define allowed sort fields
  protected getAllowedSortFields(): string[] {
    return ['jobTitle', 'createdAt', 'updatedAt', 'companyName'];
  }
}
```

---

### 1.9 Module Layer - List Item DTO

**File:** `src/modules/job-profiles/presentation/http/dto/job-profile-list-item.dto.ts`

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
```

### 1.10 Application Layer - Search Query

**File:** `src/modules/job-profiles/application/queries/impl/search-job-profiles.query.ts`

```typescript
export class SearchJobProfilesQuery {
  constructor(
    public readonly userId: string,
    public readonly page: number,
    public readonly limit: number,
    public readonly jobTitle?: string,
    public readonly sort?: { field: string; direction: 'asc' | 'desc' },
  ) {}
}
```

### 1.11 Application Layer - Query Handler (Placeholder)

**File:** `src/modules/job-profiles/application/queries/handlers/search-job-profiles.handler.ts`

```typescript
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Logger } from '@nestjs/common';
import { SearchJobProfilesQuery } from '../impl/search-job-profiles.query';
import { PaginatedResult } from '@/common/dto/paginated-result.dto';
import { JobProfileListItemDto } from '@modules/job-profiles/presentation/http/dto/job-profile-list-item.dto';

@QueryHandler(SearchJobProfilesQuery)
export class SearchJobProfilesHandler
  implements IQueryHandler<SearchJobProfilesQuery, PaginatedResult<JobProfileListItemDto>>
{
  private readonly logger = new Logger(SearchJobProfilesHandler.name);

  async execute(
    query: SearchJobProfilesQuery,
  ): Promise<PaginatedResult<JobProfileListItemDto>> {
    this.logger.log(
      `Searching job profiles for user ${query.userId} (page: ${query.page}, limit: ${query.limit})`,
    );

    // TODO: This is placeholder data - will be replaced in Step 2
    const mockItems: JobProfileListItemDto[] = [
      {
        id: 'profile-1',
        userId: query.userId,
        jobTitle: 'Senior Software Engineer (placeholder)',
        companyName: 'Tech Corp (placeholder)',
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
        seniorityLevel: 3,
        interviewDifficultyLevel: 4,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    // Mock pagination metadata
    const totalItems = 15;
    const totalPages = Math.ceil(totalItems / query.limit);
    const nextPage = query.page < totalPages ? query.page + 1 : null;
    const prevPage = query.page > 1 ? query.page - 1 : null;

    const result: PaginatedResult<JobProfileListItemDto> = {
      items: mockItems,
      nextPage,
      prevPage,
      totalItems,
      totalPages,
      page: query.page,
      limit: query.limit,
      filters: query.jobTitle ? { jobTitle: query.jobTitle } : {},
      sort: query.sort || { field: 'createdAt', direction: 'desc' },
    };

    this.logger.log(
      `Returning ${result.items.length} placeholder profiles (total: ${result.totalItems})`,
    );
    return result;
  }
}
```

### 1.12 Update HTTP Mapper

**File:** `src/modules/job-profiles/presentation/http/mappers/job-profile-http.mapper.ts`

Add new method to the existing mapper:

```typescript
import { PaginatedResult } from '@/common/dto/paginated-result.dto';
import { PaginatedResponseDto } from '@/common/dto/paginated-response.dto';
import { JobProfileListItemDto } from '../dto/job-profile-list-item.dto';

// ...existing code

export class JobProfileHttpMapper {
  // ...existing methods (toParseResponse, toGetResponse)

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

### 1.13 Controller with Placeholder Logic

**File:** `src/modules/job-profiles/presentation/http/controllers/job-profiles.controller.ts`

Update the existing controller to add the search endpoint:

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
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { ParseJobDescriptionRequestDto } from '../dto/parse-job-description-request.dto';
import { ParseJobDescriptionResponseDto } from '../dto/parse-job-description-response.dto';
import { GetJobProfileResponseDto } from '../dto/get-job-profile-response.dto';
import { JobProfileSearchDto } from '../dto/job-profile-search.dto';
import { JobProfileListItemDto } from '../dto/job-profile-list-item.dto';
import { JobProfileHttpMapper } from '../mappers/job-profile-http.mapper';
import { ParseJobDescriptionCommand } from '../../../application/commands/impl/parse-job-description.command';
import { GetJobProfileQuery } from '../../../application/queries/impl/get-job-profile.query';
import { SearchJobProfilesQuery } from '../../../application/queries/impl/search-job-profiles.query';
import { SupabaseGuard } from '@/modules/auth/guards/supabase.guard';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { SearchTransformPipe } from '@/common/pipes/search-transform.pipe';
import { PaginatedResponseDto } from '@/common/dto/paginated-response.dto';

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
  async search(
    @Query(SearchTransformPipe) searchDto: JobProfileSearchDto,
    @CurrentUser() user: { id: string },
  ): Promise<PaginatedResponseDto<JobProfileListItemDto>> {
    this.logger.log(
      `Searching job profiles for user ${user.id} (page: ${searchDto.pagination.page}, limit: ${searchDto.pagination.limit})`,
    );

    const query = new SearchJobProfilesQuery(
      user.id,
      searchDto.pagination.page,
      searchDto.pagination.limit,
      searchDto.jobTitle,
      searchDto.sortOptions?.sort,
    );

    const result = await this.queryBus.execute(query);

    return JobProfileHttpMapper.toPaginatedResponseDto(result);
  }
}
```

### 1.14 Register Query Handler in Module

**File:** `src/modules/job-profiles/job-profiles.module.ts`

```typescript
import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { ConfigModule } from '@nestjs/config';
import { JobProfilesController } from './presentation/http/controllers/job-profiles.controller';
import { ParseJobDescriptionHandler } from './application/commands/handlers/parse-job-description.handler';
import { GetJobProfileHandler } from './application/queries/handlers/get-job-profile.handler';
import { SearchJobProfilesHandler } from './application/queries/handlers/search-job-profiles.handler';
import { HtmlFetcherService } from './infrastructure/services/html-fetcher.service';
import { JdExtractorService } from './infrastructure/services/jd-extractor.service';
import { AiParserService } from './infrastructure/services/ai-parser.service';
import { JobProfileRepository } from './infrastructure/persistence/repositories/job-profile.repository';
import { JOB_PROFILE_REPOSITORY } from './domain/repositories/job-profile.repository.interface';
import { DatabaseModule } from '@/database/database.module';

const CommandHandlers = [ParseJobDescriptionHandler];
const QueryHandlers = [GetJobProfileHandler, SearchJobProfilesHandler]; // Add SearchJobProfilesHandler
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

### 1.15 Verification

```bash
# Start the application
npm run dev

# Test basic endpoint (get JWT token first from auth endpoint)
curl -X GET "http://localhost:3000/api/v1/job-profiles" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Test with pagination
curl -X GET "http://localhost:3000/api/v1/job-profiles?page=2&limit=5" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Test with sorting
curl -X GET "http://localhost:3000/api/v1/job-profiles?sort=createdAt:desc" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Test with filter
curl -X GET "http://localhost:3000/api/v1/job-profiles?jobTitle=Senior" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Test combination
curl -X GET "http://localhost:3000/api/v1/job-profiles?page=1&limit=10&jobTitle=Engineer&sort=createdAt:desc" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Test validation - invalid page (should fail)
curl -X GET "http://localhost:3000/api/v1/job-profiles?page=0" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
# Expected: 400 Bad Request

# Test validation - invalid limit (should fail)
curl -X GET "http://localhost:3000/api/v1/job-profiles?limit=101" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
# Expected: 400 Bad Request

# Test validation - invalid sort field (should fail)
curl -X GET "http://localhost:3000/api/v1/job-profiles?sort=invalidField:desc" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
# Expected: 400 Bad Request
```

**Expected Response Structure:**

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "profile-1",
        "userId": "user-123",
        "jobTitle": "Senior Software Engineer (placeholder)",
        "companyName": "Tech Corp (placeholder)",
        "seniorityLevel": 5,
        "interviewDifficultyLevel": 5,
        "createdAt": "2026-01-30T10:00:00Z",
        "updatedAt": "2026-01-30T10:00:00Z"
      }
    ],
    "nextPage": 2,
    "prevPage": null,
    "totalItems": 15,
    "totalPages": 2,
    "query": {
      "page": 1,
      "limit": 10,
      "filters": {},
      "sort": { "field": "createdAt", "direction": "desc" }
    }
  }
}
```

**Expected State:**

- ✅ Common infrastructure (base DTOs, pipes, decorators) created
- ✅ Endpoint accessible and returns 200
- ✅ Authentication guard works
- ✅ Query parameter validation works (page >= 1, limit 1-100)
- ✅ SearchTransformPipe transforms flat query params to nested structure
- ✅ Returns standardized paginated response structure
- ✅ Pagination metadata correct (nextPage, prevPage, totalPages)
- ✅ Query echo includes filters and sort
- ✅ Sort field validation works
- ✅ Application runs without errors

---

## Step 2: Real Repository Query with Filtering and Sorting

**Goal:** Replace mock data with actual database queries including filtering, sorting, and pagination.

**Status After:**

- ✅ Query handler fetches from database
- ✅ Filtering works (jobTitle partial match)
- ✅ Sorting works (configurable field and direction)
- ✅ Pagination works correctly (page-based)
- ✅ Returns only user's own job profiles
- ✅ Returns real job profile data
- ✅ Excludes soft-deleted profiles
- ✅ Parallel count and search queries for performance

### 2.1 Update Repository Interface

**File:** `src/modules/job-profiles/domain/repositories/job-profile.repository.interface.ts`

Add search methods to the existing interface:

```typescript
import { JobProfile } from "../entities/job-profile.entity";
import { JobProfileId } from "../value-objects/job-profile-id";
import { UserId } from "../value-objects/user-id";

export interface SearchFilters {
  userId: string;
  jobTitle?: string;
  // Add more filters as needed
}

export interface SortOptions {
  field: string;
  direction: 'asc' | 'desc';
}

export interface IJobProfileRepository {
  // Existing methods
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

  // New search methods
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

### 2.2 Update Repository Implementation

**File:** `src/modules/job-profiles/infrastructure/persistence/repositories/job-profile.repository.ts`

Add search methods to the existing repository:

```typescript
import { Inject, Injectable } from "@nestjs/common";
import { and, eq, isNull, desc, asc, sql } from "drizzle-orm";

import { DRIZZLE_DB, DrizzleDb } from "@/database/database.service";
import { jobProfiles } from "@/database/schema";

import { JobProfile } from "../../../domain/entities/job-profile.entity";
import {
  IJobProfileRepository,
  SearchFilters,
  SortOptions
} from "../../../domain/repositories/job-profile.repository.interface";
import { JobProfileId } from "../../../domain/value-objects/job-profile-id";
import { UserId } from "../../../domain/value-objects/user-id";
import { JobProfilePersistenceMapper } from "../mappers/job-profile-persistence.mapper";

@Injectable()
export class JobProfileRepository implements IJobProfileRepository {
  constructor(@Inject(DRIZZLE_DB) private readonly db: DrizzleDb) {}

  // ...existing methods (save, findById, findByUserId, countByUserId, softDelete, restore)

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

    return result.map((row) => JobProfilePersistenceMapper.toDomain(row));
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
      createdAt: jobProfiles.createdAt,
      updatedAt: jobProfiles.updatedAt,
      companyName: jobProfiles.companyName,
    };

    return columnMap[field] || jobProfiles.createdAt;
  }
}
```

### 2.3 Update Query Handler

**File:** `src/modules/job-profiles/application/queries/handlers/search-job-profiles.handler.ts`

Replace placeholder implementation with real database queries:

```typescript
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Inject, Logger } from '@nestjs/common';
import { SearchJobProfilesQuery } from '../impl/search-job-profiles.query';
import { PaginatedResult } from '@/common/dto/paginated-result.dto';
import { JobProfileListItemDto } from '@modules/job-profiles/presentation/http/dto/job-profile-list-item.dto';
import {
  IJobProfileRepository,
  JOB_PROFILE_REPOSITORY,
} from '../../../domain/repositories/job-profile.repository.interface';

@QueryHandler(SearchJobProfilesQuery)
export class SearchJobProfilesHandler
  implements IQueryHandler<SearchJobProfilesQuery, PaginatedResult<JobProfileListItemDto>>
{
  private readonly logger = new Logger(SearchJobProfilesHandler.name);

  constructor(
    @Inject(JOB_PROFILE_REPOSITORY)
    private readonly repository: IJobProfileRepository,
  ) {}

  async execute(
    query: SearchJobProfilesQuery,
  ): Promise<PaginatedResult<JobProfileListItemDto>> {
    const { userId, page, limit, jobTitle, sort } = query;

    this.logger.log(
      `Searching job profiles for user ${userId} (page: ${page}, limit: ${limit})`,
    );

    // Calculate offset
    const offset = (page - 1) * limit;

    // Build filter criteria
    const filters = {
      userId,
      jobTitle,
    };

    // Build sort options (default to createdAt:desc)
    const sortOptions = sort
      ? { field: sort.field, direction: sort.direction }
      : { field: 'createdAt', direction: 'desc' as const };

    // Execute search and count in parallel for performance
    const [profiles, totalItems] = await Promise.all([
      this.repository.search(filters, sortOptions, limit, offset),
      this.repository.count(filters),
    ]);

    // Calculate pagination metadata
    const totalPages = Math.ceil(totalItems / limit);
    const nextPage = page < totalPages ? page + 1 : null;
    const prevPage = page > 1 ? page - 1 : null;

    // Map domain entities to DTOs
    const items = profiles.map((profile) => ({
      id: profile.getId().getValue(),
      userId: profile.getUserId().getValue(),
      jobTitle: profile.getJobTitle(),
      companyName: profile.getCompanyName(),
      seniorityLevel: profile.getSeniorityLevel(),
      interviewDifficultyLevel: profile.getInterviewDifficultyLevel(),
      createdAt: profile.getCreatedAt(),
      updatedAt: profile.getUpdatedAt(),
    }));

    this.logger.log(
      `Successfully fetched ${items.length} profiles (total: ${totalItems})`,
    );

    return {
      items,
      nextPage,
      prevPage,
      totalItems,
      totalPages,
      page,
      limit,
      filters: jobTitle ? { jobTitle } : {},
      sort: sortOptions,
    };
  }
}
```

### 2.4 Verification

```bash
npm run dev

# Test with real data (create some job profiles first using POST /parse)
curl -X GET "http://localhost:3000/api/v1/job-profiles" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Test pagination - page 2
curl -X GET "http://localhost:3000/api/v1/job-profiles?page=2&limit=5" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Test different limit
curl -X GET "http://localhost:3000/api/v1/job-profiles?page=1&limit=2" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Test filtering by job title
curl -X GET "http://localhost:3000/api/v1/job-profiles?jobTitle=Engineer" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Test sorting ascending
curl -X GET "http://localhost:3000/api/v1/job-profiles?sort=jobTitle:asc" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Test sorting descending (newest first)
curl -X GET "http://localhost:3000/api/v1/job-profiles?sort=createdAt:desc" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Test combination of filter + sort + pagination
curl -X GET "http://localhost:3000/api/v1/job-profiles?page=1&limit=5&jobTitle=Senior&sort=createdAt:desc" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Test validation - invalid page (should fail)
curl -X GET "http://localhost:3000/api/v1/job-profiles?page=0" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
# Expected: 400 Bad Request

# Test validation - invalid limit (should fail)
curl -X GET "http://localhost:3000/api/v1/job-profiles?limit=101" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
# Expected: 400 Bad Request

# Test validation - invalid sort field (should fail)
curl -X GET "http://localhost:3000/api/v1/job-profiles?sort=invalidField:desc" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
# Expected: 400 Bad Request
```

**Expected State:**

- ✅ Returns real job profiles from database
- ✅ Filtering works (jobTitle partial match, case-insensitive)
- ✅ Sorting works (any allowed field, asc/desc)
- ✅ Pagination works correctly (page-based with proper metadata)
- ✅ Returns only profiles owned by authenticated user
- ✅ Total count reflects actual number after filtering
- ✅ Soft-deleted profiles are excluded
- ✅ Parallel queries (search + count) for performance
- ✅ Validation errors return 400 for invalid parameters
- ✅ Default sort applied (createdAt:desc) when not specified

---

## Step 3: Full Swagger Documentation

**Goal:** Add comprehensive Swagger/OpenAPI documentation for the search endpoint.

**Status After:**

- ✅ Full Swagger/OpenAPI documentation
- ✅ All query parameters documented
- ✅ Response structure documented
- ✅ Example requests and responses
- ✅ Error responses documented
- ✅ Proper HTTP status codes documented

### 3.1 Update Controller with Full Swagger Documentation

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
    summary: 'Search and list job profiles',
    description:
      'Retrieve a paginated, filtered, and sorted list of job profiles for the authenticated user. ' +
      'Supports filtering by job title (partial match), sorting by various fields, and pagination. ' +
      'Soft-deleted profiles are excluded. ' +
      'Default sort is by creation date (newest first).',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number (1-indexed, default: 1)',
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Items per page (default: 10, max: 100)',
    example: 10,
  })
  @ApiQuery({
    name: 'jobTitle',
    required: false,
    type: String,
    description: 'Filter by job title (partial match, case-insensitive)',
    example: 'Senior Backend Engineer',
  })
  @ApiQuery({
    name: 'sort',
    required: false,
    type: String,
    description:
      'Sort configuration in format "field:direction". ' +
      'Allowed fields: jobTitle, createdAt, updatedAt, companyName. ' +
      'Direction: asc or desc. ' +
      'Default: createdAt:desc',
    example: 'createdAt:desc',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Job profiles retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        data: {
          type: 'object',
          properties: {
            items: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string', example: '550e8400-e29b-41d4-a716-446655440000' },
                  userId: { type: 'string', example: 'user-123' },
                  jobTitle: { type: 'string', example: 'Senior Software Engineer' },
                  companyName: { type: 'string', example: 'Tech Corp' },
                  seniorityLevel: { type: 'number', example: 7 },
                  interviewDifficultyLevel: { type: 'number', example: 8 },
                  createdAt: { type: 'string', format: 'date-time' },
                  updatedAt: { type: 'string', format: 'date-time' },
                },
              },
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
                  properties: {
                    jobTitle: { type: 'string', example: 'Senior' },
                  },
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
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description:
      'Invalid query parameters (e.g., page < 1, limit > 100, invalid sort field)',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 400 },
        message: { type: 'string', example: 'Validation failed' },
        error: { type: 'string', example: 'Bad Request' },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Authentication required (missing or invalid JWT token)',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 401 },
        message: { type: 'string', example: 'Unauthorized' },
      },
    },
  })
  async search(
    @Query(SearchTransformPipe) searchDto: JobProfileSearchDto,
    @CurrentUser() user: { id: string },
  ): Promise<PaginatedResponseDto<JobProfileListItemDto>> {
    this.logger.log(
      `Searching job profiles for user ${user.id} ` +
      `(page: ${searchDto.pagination.page}, limit: ${searchDto.pagination.limit})`,
    );

    const query = new SearchJobProfilesQuery(
      user.id,
      searchDto.pagination.page,
      searchDto.pagination.limit,
      searchDto.jobTitle,
      searchDto.sortOptions?.sort,
    );

    const result = await this.queryBus.execute(query);

    return JobProfileHttpMapper.toPaginatedResponseDto(result);
  }
}
```

### 3.2 Verification

```bash
npm run dev

# Access Swagger UI
open http://localhost:3000/api

# Verify the GET /api/v1/job-profiles endpoint is documented with:
# - Operation summary and description
# - Query parameters (page, limit, jobTitle, sort)
# - Response schema with example
# - Error responses (400, 401)
# - Authentication requirement (Bearer token)

# Test via Swagger UI:
# 1. Click "Try it out"
# 2. Enter query parameters
# 3. Click "Execute"
# 4. Verify response matches documented schema
```

**Expected State:**

- ✅ Swagger documentation complete and accurate
- ✅ All query parameters documented with descriptions and examples
- ✅ Response structure fully documented
- ✅ Pagination metadata documented
- ✅ Filter and sort in query echo documented
- ✅ HTTP status codes documented (200, 400, 401)
- ✅ Example requests and responses visible
- ✅ Authentication requirement clearly indicated
- ✅ Can test endpoint directly from Swagger UI

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
2. **Pattern compliance** - follows established filtering, sorting, and pagination patterns
3. **Reusable infrastructure** - common DTOs, pipes, and decorators for future endpoints
4. **Incremental value** - each step adds real functionality
5. **Continuous integration** - app never breaks between steps
6. **Easier debugging** - issues isolated to recent changes
7. **Better understanding** - see how filtering, sorting, and pagination work progressively

| Step | Endpoint Status | What's Real |
| ---- | --------------- | ----------- |
| 1 | ✅ Returns 200 | Common infrastructure, validation, auth, structure, placeholder data |
| 2 | ✅ Returns 200 | Database search, filtering, sorting, pagination, authorization |
| 3 | ✅ Returns 200 | Full Swagger documentation with examples |
| 4 | ✅ **PRODUCTION** | **Comprehensive tests & documentation** |

---

## Key Differences from Get Job Profile

### Query Pattern

- **Search/List**: Uses Search Query with filtering, sorting, pagination
- **Get**: Uses simple Query with single ID

### Response Structure

- **Search/List**: Paginated response with metadata (nextPage, prevPage, totalItems, totalPages, query echo)
- **Get**: Single profile object

### Response Data

- **Search/List**: Lightweight list items (excludes rawJD, competencies details, skills arrays)
- **Get**: Full profile with all fields

### Repository Calls

- **Search/List**: `search()` with filters/sort + `count()` (parallel execution)
- **Get**: `findById()` with single ID

### HTTP Parameters

- **Search/List**: Query parameters (page, limit, jobTitle, sort)
- **Get**: Path parameter (id)

### Error Handling

- **Search/List**: Returns empty array if no profiles (not 404)
- **Get**: Returns 404 if not found

### Authorization

- **Search/List**: Implicit (only returns user's profiles via userId filter)
- **Get**: Explicit check (403 if profile belongs to another user)

---

## Implementation Considerations

### Performance

- **Parallel Queries**: Search and count executed in parallel using `Promise.all()`
- **Pagination**: Page-based pagination prevents loading all profiles at once
- **Limit Cap**: Capped at 100 to prevent abuse
- **Indexes**: Database indexes on (userId, createdAt DESC, deleted_at) for optimal query performance
- **Offset Calculation**: Computed in handler layer (offset = (page - 1) * limit)
- **Default Sort**: Always applies default sort (createdAt DESC) when not specified

### Security

- **Authorization**: Only returns profiles owned by authenticated user (userId filter)
- **Soft Deletes**: Automatically excluded via `isNull(deletedAt)` condition
- **Sort Field Validation**: Only allowed fields can be used for sorting
- **Input Validation**: All query parameters validated (page >= 1, limit 1-100)
- **No Direct Access**: No way to access other users' profiles

### Filtering

- **Job Title**: Partial match, case-insensitive using SQL `LOWER()` and `LIKE`
- **Extensible**: Easy to add more filters (companyName, seniorityLevel, status, etc.)
- **Type Safety**: Filters defined in `SearchFilters` interface
- **Applied at Repository**: Filtering logic in `buildFilterConditions()` method

### Sorting

- **Type Safe**: Sort fields validated against allowed list
- **Database Level**: Sorting applied in SQL query (not in-memory)
- **Direction Support**: Both ascending and descending
- **Column Mapping**: Domain field names mapped to database columns
- **Default**: Always has default sort to ensure consistent ordering

### Future Enhancements

- Add more filters (companyName, seniorityLevel, status, date ranges)
- Add full-text search on rawJD content
- Add advanced filters (competencies, skills arrays)
- Consider cursor-based pagination for very large datasets (>100k profiles)
- Add caching for total counts
- Add search highlighting for matched terms

---

## Related Documentation

- **Patterns:**
  - [Filtering and Sorting Pattern](../patterns/filtering-sorting-pattern.md)
  - [Pagination Pattern](../patterns/pagination-pattern.md)
  - [Iterative Endpoint Implementation](../rules/iterative-endpoint-implementation.md)

- **Other Implementations:**
  - [Parse Job Description](./job-profiles-parse-implementation-plan-iterative.md)
  - [Get Job Profile](./job-profiles-get-implementation-plan-iterative.md)

---

**Document Status:** ✅ Ready for Iterative Implementation
**Last Updated:** 2026-01-30
**Module:** job-profiles
**Feature:** FR-JP-003 List Job Profiles with Filtering, Sorting, and Pagination (Iterative v2.0)
