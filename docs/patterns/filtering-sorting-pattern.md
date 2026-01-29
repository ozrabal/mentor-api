# Filtering and Sorting Pattern - Implementation Guide

**Version:** 1.0
**Date:** 2026-01-29
**Status:** Active

---

## Overview

The MENTOR API implements a **unified filtering and sorting system** for all list endpoints. This pattern provides type-safe, flexible, and consistent query capabilities across modules with automatic transformation from flat query parameters to structured DTOs.

**Context:** We need a standardized approach for handling filtering, sorting, and pagination across all list endpoints that works seamlessly with our modular monolith architecture and CQRS pattern.

**Decision:** Implement a base search DTO system with custom transformation pipe that handles complex query parameter transformations (arrays, date ranges, nested objects) while maintaining type safety and validation.

**Consequences:**

- ✅ Type-safe sorting with compile-time validation
- ✅ Consistent API across all modules
- ✅ Flexible filtering with various data types
- ✅ Automatic query parameter transformation
- ✅ Clean integration with CQRS handlers
- ⚠️ Learning curve for custom transformers
- ⚠️ Initial setup overhead per module
- ⚠️ Must ensure SearchTransformPipe runs before validation

---

## Benefits

1. **Type Safety:** Compile-time validation of sort fields and entity properties
2. **Consistency:** Uniform API across all modules for search operations
3. **Flexibility:** Supports complex filters (arrays, ranges, nested objects)
4. **Validation:** Automatic query parameter validation using class-validator
5. **Maintainability:** Centralized logic for common search operations
6. **Developer Experience:** Clear, predictable API structure
7. **Extensibility:** Easy to add new filter types and transformations

---

## API Contract

### Query Parameters Example

```bash
GET /api/v1/job-profiles?page=1&limit=15&jobTitle=Senior&status=ACTIVE,PENDING&sort=createdAt:desc&createdAt=2025-01-01,2025-12-31
```

**Query Parameters:**

- **Pagination:** `page`, `limit`
- **Sorting:** `sort=field:direction` (e.g., `sort=createdAt:desc`)
- **Filters:**
  - Simple string: `jobTitle=Senior`
  - Array (comma-separated): `status=ACTIVE,PENDING`
  - Date range (comma-separated): `createdAt=2025-01-01,2025-12-31`
  - Boolean: `isParsed=true`
  - Nested object: `user.email=john@example.com`

### Response Structure

```typescript
{
  success: true,
  data: {
    items: T[],              // Filtered and sorted items
    nextPage: number | null,
    prevPage: number | null,
    totalItems: number,      // Total matching items (after filters)
    totalPages: number,
    query: {
      page: number,
      limit: number,
      filters: Record<string, any>,  // Applied filters
      sort?: {
        field: string,
        direction: 'asc' | 'desc'
      }
    }
  }
}
```

---

## Core Components

### 1. Base Search DTO

Abstract base class that all module search DTOs extend from:

```typescript
// src/common/dto/base-search.dto.ts
import { IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

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

### 2. Pagination DTO

```typescript
// src/common/dto/base-pagination.dto.ts
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

### 3. Sort DTO

```typescript
// src/common/dto/sort.dto.ts
import { IsOptional, IsIn } from 'class-validator';
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

### 4. Search Transform Pipe

Custom pipe that transforms flat query parameters into nested DTO structure:

```typescript
// src/common/pipes/search-transform.pipe.ts
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

### 5. Custom Transform Decorators

```typescript
// src/common/decorators/transform-string-array.decorator.ts
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

```typescript
// src/common/decorators/transform-date-range.decorator.ts
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

```typescript
// src/common/decorators/transform-boolean.decorator.ts
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

## Implementation Layers

### 1. Presentation Layer (HTTP)

#### Module-Specific Search DTO

```typescript
// modules/job-profiles/presentation/http/dto/job-profile-search.dto.ts
import { IsOptional, IsString, IsEnum, IsUUID } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { BaseSearchDto } from '@/common/dto/base-search.dto';
import { OffsetPaginationDto } from '@/common/dto/base-pagination.dto';
import { TransformStringArray } from '@/common/decorators/transform-string-array.decorator';
import { TransformDateRange } from '@/common/decorators/transform-date-range.decorator';
import { TransformBoolean } from '@/common/decorators/transform-boolean.decorator';

export enum JobProfileStatus {
  DRAFT = 'DRAFT',
  ACTIVE = 'ACTIVE',
  ARCHIVED = 'ARCHIVED',
}

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

  // Array filter (comma-separated)
  @ApiPropertyOptional({
    description: 'Filter by status (multiple values allowed, comma-separated)',
    example: 'ACTIVE,PENDING',
    enum: JobProfileStatus,
    isArray: true,
  })
  @IsOptional()
  @TransformStringArray()
  @IsEnum(JobProfileStatus, { each: true })
  status?: JobProfileStatus[];

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

  // UUID filter
  @ApiPropertyOptional({
    description: 'Filter by user ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsOptional()
  @IsUUID()
  userId?: string;

  // Define allowed sort fields
  protected getAllowedSortFields(): (keyof JobProfile)[] {
    return ['jobTitle', 'createdAt', 'updatedAt', 'status'];
  }
}
```

#### Controller Implementation

```typescript
// modules/job-profiles/presentation/http/controllers/job-profiles.controller.ts
import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { SupabaseGuard } from '@/auth/guards/supabase.guard';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { SearchTransformPipe } from '@/common/pipes/search-transform.pipe';
import { JobProfileSearchDto } from '../dto/job-profile-search.dto';
import { SearchJobProfilesQuery } from '@modules/job-profiles/application/queries/impl/search-job-profiles.query';
import { PaginatedResponseDto } from '@/common/dto/paginated-response.dto';
import { JobProfileListItemDto } from '../dto/job-profile-list-item.dto';

@Controller('api/v1/job-profiles')
@UseGuards(SupabaseGuard)
@ApiTags('Job Profiles')
export class JobProfilesController {
  constructor(private readonly queryBus: QueryBus) {}

  @Get()
  @ApiOperation({
    summary: 'Search and list job profiles',
    description: 'Returns a paginated, filtered, and sorted list of job profiles',
  })
  @ApiResponse({
    status: 200,
    description: 'Paginated list of job profiles',
    type: PaginatedResponseDto<JobProfileListItemDto>,
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
      searchDto.status,
      searchDto.isParsed,
      searchDto.createdAt,
      searchDto.sortOptions?.sort,
    );

    const result = await this.queryBus.execute(query);

    return JobProfileHttpMapper.toPaginatedResponseDto(result);
  }
}
```

---

### 2. Application Layer (CQRS)

#### Search Query

```typescript
// application/queries/impl/search-job-profiles.query.ts
import { JobProfileStatus } from '@modules/job-profiles/presentation/http/dto/job-profile-search.dto';

export class SearchJobProfilesQuery {
  constructor(
    public readonly userId: string,
    public readonly page: number,
    public readonly limit: number,
    public readonly jobTitle?: string,
    public readonly status?: JobProfileStatus[],
    public readonly isParsed?: boolean,
    public readonly createdAt?: { start: Date; end: Date },
    public readonly sort?: { field: string; direction: 'asc' | 'desc' },
  ) {}
}
```

#### Query Handler

```typescript
// application/queries/handlers/search-job-profiles.handler.ts
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
    const { userId, page, limit, jobTitle, status, isParsed, createdAt, sort } = query;

    // Calculate offset
    const offset = (page - 1) * limit;

    // Build filter criteria
    const filters = {
      userId,
      jobTitle,
      status,
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

---

### 3. Domain Layer

#### Repository Interface

```typescript
// domain/repositories/job-profile.repository.interface.ts
export interface SearchFilters {
  userId: string;
  jobTitle?: string;
  status?: JobProfileStatus[];
  isParsed?: boolean;
  createdAt?: { start: Date; end: Date };
}

export interface SortOptions {
  field: string;
  direction: 'asc' | 'desc';
}

export interface IJobProfileRepository {
  // Search with filters and sorting
  search(
    filters: SearchFilters,
    sort: SortOptions,
    limit: number,
    offset: number,
  ): Promise<JobProfile[]>;

  // Count with filters
  count(filters: SearchFilters): Promise<number>;
}

export const JOB_PROFILE_REPOSITORY = Symbol('JOB_PROFILE_REPOSITORY');
```

---

### 4. Infrastructure Layer (Persistence)

#### Repository Implementation (Drizzle)

```typescript
// infrastructure/persistence/repositories/job-profile.repository.ts
import { Injectable, Inject } from '@nestjs/common';
import { DRIZZLE_DB, DrizzleDb } from '@/database/drizzle.provider';
import { jobProfiles } from '@/database/schema';
import { eq, and, or, like, between, isNull, desc, asc, inArray, sql } from 'drizzle-orm';
import { IJobProfileRepository, SearchFilters, SortOptions } from '@modules/job-profiles/domain/repositories/job-profile.repository.interface';
import { JobProfile } from '@modules/job-profiles/domain/entities/job-profile.entity';
import { JobProfilePersistenceMapper } from '../mappers/job-profile-persistence.mapper';

@Injectable()
export class JobProfileRepository implements IJobProfileRepository {
  constructor(@Inject(DRIZZLE_DB) private readonly db: DrizzleDb) {}

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

    // Status filter (multiple values)
    if (filters.status && filters.status.length > 0) {
      conditions.push(inArray(jobProfiles.status, filters.status));
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
      createdAt: jobProfiles.createdAt,
      updatedAt: jobProfiles.updatedAt,
      status: jobProfiles.status,
    };

    return columnMap[field] || jobProfiles.createdAt;
  }
}
```

#### Performance Optimization - Database Indexes

```sql
-- Composite index for common search patterns
CREATE INDEX idx_job_profiles_search
ON job_profiles(user_id, status, created_at DESC)
WHERE deleted_at IS NULL;

-- GIN index for full-text search on job_title
CREATE INDEX idx_job_profiles_job_title_search
ON job_profiles USING GIN (to_tsvector('english', job_title))
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

---

## Testing

### Unit Tests - Query Handler

```typescript
describe('SearchJobProfilesHandler', () => {
  let handler: SearchJobProfilesHandler;
  let repository: jest.Mocked<IJobProfileRepository>;

  beforeEach(() => {
    repository = {
      search: jest.fn(),
      count: jest.fn(),
    } as any;

    handler = new SearchJobProfilesHandler(repository);
  });

  it('should search with filters', async () => {
    const mockProfiles = [
      JobProfile.createNew({ userId: UserId.create('user-123'), rawJD: 'JD 1' }),
    ];

    repository.search.mockResolvedValue(mockProfiles);
    repository.count.mockResolvedValue(1);

    const query = new SearchJobProfilesQuery(
      'user-123',
      1,
      10,
      'Senior',
      [JobProfileStatus.ACTIVE],
      true,
      undefined,
      { field: 'createdAt', direction: 'desc' },
    );

    const result = await handler.execute(query);

    expect(repository.search).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'user-123',
        jobTitle: 'Senior',
        status: [JobProfileStatus.ACTIVE],
        isParsed: true,
      }),
      { field: 'createdAt', direction: 'desc' },
      10,
      0,
    );
    expect(result.items).toHaveLength(1);
  });

  it('should apply default sort when none provided', async () => {
    repository.search.mockResolvedValue([]);
    repository.count.mockResolvedValue(0);

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

    expect(repository.search).toHaveBeenCalledWith(
      expect.any(Object),
      { field: 'createdAt', direction: 'desc' },
      10,
      0,
    );
  });
});
```

### Integration Tests - Repository

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
      JobProfile.createNew({ userId, jobTitle: 'Senior Backend Engineer' })
    );
    await repository.save(
      JobProfile.createNew({ userId, jobTitle: 'Junior Frontend Developer' })
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

  it('should filter by multiple statuses', async () => {
    const userId = UserId.create('user-123');

    await repository.save(
      JobProfile.createNew({ userId, status: JobProfileStatus.ACTIVE })
    );
    await repository.save(
      JobProfile.createNew({ userId, status: JobProfileStatus.DRAFT })
    );
    await repository.save(
      JobProfile.createNew({ userId, status: JobProfileStatus.ARCHIVED })
    );

    const results = await repository.search(
      {
        userId: userId.getValue(),
        status: [JobProfileStatus.ACTIVE, JobProfileStatus.DRAFT],
      },
      { field: 'createdAt', direction: 'desc' },
      10,
      0,
    );

    expect(results).toHaveLength(2);
  });

  it('should filter by date range', async () => {
    const userId = UserId.create('user-123');

    // Create profiles at different times
    const old = JobProfile.createNew({ userId, createdAt: new Date('2024-01-01') });
    const recent = JobProfile.createNew({ userId, createdAt: new Date('2025-01-15') });

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

    const profile1 = JobProfile.createNew({ userId, jobTitle: 'Zebra' });
    const profile2 = JobProfile.createNew({ userId, jobTitle: 'Alpha' });
    const profile3 = JobProfile.createNew({ userId, jobTitle: 'Beta' });

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
});
```

### E2E Tests

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

  it('should filter by multiple statuses', () => {
    return request(app.getHttpServer())
      .get('/api/v1/job-profiles?status=ACTIVE,PENDING')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200)
      .expect((res) => {
        expect(res.body.data.items.every((item) =>
          ['ACTIVE', 'PENDING'].includes(item.status)
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
      .get('/api/v1/job-profiles?jobTitle=Engineer&status=ACTIVE&sort=createdAt:desc&page=2&limit=5')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200)
      .expect((res) => {
        expect(res.body.data.query).toEqual({
          page: 2,
          limit: 5,
          filters: expect.objectContaining({
            jobTitle: 'Engineer',
            status: ['ACTIVE'],
          }),
          sort: { field: 'createdAt', direction: 'desc' },
        });
      });
  });
});
```

---

## Best Practices

### ✅ DO

1. **Define allowed sort fields explicitly**

   ```typescript
   protected getAllowedSortFields(): (keyof JobProfile)[] {
     return ['jobTitle', 'createdAt', 'updatedAt'];
   }
   ```

2. **Use custom transform decorators**

   ```typescript
   @TransformStringArray()
   @IsString({ each: true })
   status?: string[];
   ```

3. **Provide default sort**

   ```typescript
   const sortOptions = sort || { field: 'createdAt', direction: 'desc' };
   ```

4. **Add database indexes**

   ```sql
   CREATE INDEX idx_table_search ON table(user_id, status, created_at)
   WHERE deleted_at IS NULL;
   ```

5. **Document query parameters**

   ```typescript
   @ApiPropertyOptional({
     description: 'Filter by status (comma-separated)',
     example: 'ACTIVE,PENDING',
   })
   ```

6. **Validate all inputs**

   ```typescript
   @IsEnum(Status, { each: true })
   status?: Status[];
   ```

7. **Use parallel queries for search and count**

   ```typescript
   const [items, total] = await Promise.all([
     repository.search(...),
     repository.count(...),
   ]);
   ```

### ❌ DON'T

1. **Don't allow arbitrary sort fields**

   ```typescript
   // ❌ Bad - no validation
   async search(sort: string) { ... }
   ```

2. **Don't build raw SQL strings**

   ```typescript
   // ❌ Bad - SQL injection risk
   const query = `SELECT * FROM table WHERE ${field} = '${value}'`;
   ```

3. **Don't skip transformation validation**

   ```typescript
   // ❌ Bad - no transform decorator
   status?: string[]; // Will receive comma-separated string
   ```

4. **Don't ignore soft-deleted records**

   ```typescript
   // ❌ Bad - includes deleted
   const conditions = [eq(table.userId, userId)];
   ```

5. **Don't use inconsistent filter parameter names**

   ```typescript
   // ❌ Bad - inconsistent naming
   jobTitle vs job_title vs JOB_TITLE
   ```

---

## Advanced Features

### Full-Text Search (PostgreSQL)

For advanced text search capabilities:

```typescript
// Repository method
async fullTextSearch(
  userId: string,
  searchTerm: string,
  limit: number,
  offset: number,
): Promise<JobProfile[]> {
  const result = await this.db
    .select()
    .from(jobProfiles)
    .where(
      and(
        eq(jobProfiles.userId, userId),
        isNull(jobProfiles.deletedAt),
        sql`to_tsvector('english', ${jobProfiles.jobTitle} || ' ' || ${jobProfiles.rawJd}) @@ plainto_tsquery('english', ${searchTerm})`
      )
    )
    .orderBy(
      sql`ts_rank(to_tsvector('english', ${jobProfiles.jobTitle}), plainto_tsquery('english', ${searchTerm})) DESC`
    )
    .limit(limit)
    .offset(offset);

  return result.map(JobProfilePersistenceMapper.toDomain);
}
```

### Nested Object Filters

```typescript
// DTO
@ApiPropertyOptional({
  description: 'Filter by nested user properties',
  example: { email: 'john@example.com', role: 'ADMIN' },
})
@IsOptional()
@ValidateNested()
@Type(() => UserFilterDto)
user?: UserFilterDto;

// UserFilterDto
export class UserFilterDto {
  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;
}
```

### Dynamic Filter Building

```typescript
// Advanced filter builder
private buildDynamicFilters(filters: Record<string, any>): any[] {
  const conditions: any[] = [];

  const filterMap: Record<string, (value: any) => any> = {
    jobTitle: (value) => sql`LOWER(${jobProfiles.jobTitle}) LIKE LOWER(${`%${value}%`})`,
    status: (value) => inArray(jobProfiles.status, value),
    isParsed: (value) => eq(jobProfiles.isParsed, value),
    createdAt: (value) => between(jobProfiles.createdAt, value.start, value.end),
  };

  for (const [key, value] of Object.entries(filters)) {
    if (value !== undefined && value !== null && filterMap[key]) {
      conditions.push(filterMap[key](value));
    }
  }

  return conditions;
}
```

---

## Summary

The filtering and sorting pattern in MENTOR API provides:

✅ **Unified search system** across all modules
✅ **Type-safe filtering and sorting** with validation
✅ **Flexible query parameters** (arrays, ranges, nested objects)
✅ **Automatic transformation** via SearchTransformPipe
✅ **Clean integration** with CQRS and modular architecture
✅ **Performance optimization** with database indexes
✅ **Consistent API contract** with Swagger documentation
✅ **Comprehensive testing** at all layers
✅ **Extensible design** for new filter types

---

**Document Version:** 1.0
**Last Updated:** 2026-01-29
**Related Patterns:**

- [Pagination Pattern](./pagination-pattern.md)
- [Soft Delete Pattern](./soft-delete-pattern.md)
- [Iterative Endpoint Implementation](../rules/iterative-endpoint-implementation.md)
