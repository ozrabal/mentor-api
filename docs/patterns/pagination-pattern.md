# Pagination Pattern - Implementation Guide

**Version:** 1.0
**Date:** 2026-01-29
**Status:** Active

---

## Overview

The MENTOR API implements **offset-based pagination** for all list endpoints. This pattern provides a consistent, predictable way to handle large datasets with standardized query parameters and response structure.

**Context:** We need to establish how frontend and backend will handle pagination across the API.

**Decision:** Offset pagination allows straightforward implementation and aligns well with our current database queries. Cursor pagination may be considered in the future for better performance with large datasets.

**Consequences:**

- ✅ Faster development and easier implementation
- ✅ Predictable page navigation (direct access to any page)
- ✅ Simple frontend integration
- ⚠️ Potentially slower performance for very large datasets compared to cursor pagination
- ⚠️ Possible data inconsistency during concurrent writes (acceptable for our use case)

---

## Benefits

1. **Consistency:** Uniform pagination across all API endpoints
2. **Predictability:** Clients can calculate total pages and navigate directly to any page
3. **Simplicity:** Easy to implement and understand for both backend and frontend
4. **Flexibility:** Clients control page size within reasonable limits
5. **Standard HTTP:** Uses query parameters following REST conventions

---

## API Contract

### Query Parameters

All paginated endpoints accept these query parameters:

```typescript
{
  page: number   // Current page number (1-indexed, default: 1)
  limit: number  // Items per page (default: 10, max: 100)
}
```

**Example Request:**

```bash
GET /api/v1/job-profiles?page=2&limit=20
```

### Response Structure

All paginated responses follow this structure:

```typescript
{
  success: true,
  data: {
    items: T[],              // Array of items for current page
    nextPage: number | null, // Next page number, or null if on last page
    prevPage: number | null, // Previous page number, or null if on first page
    totalItems: number,      // Total count of items (across all pages)
    totalPages: number,      // Total number of pages
    query: {
      page: number,          // Current page number (echoed back)
      limit: number,         // Items per page (echoed back)
    }
  },
}
```

**Example Response:**

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "jobTitle": "Senior Backend Engineer",
        "createdAt": "2026-01-15T10:30:00Z"
      }
    ],
    "nextPage": 3,
    "prevPage": 1,
    "totalItems": 47,
    "totalPages": 5,
    "query": {
      "page": 2,
      "limit": 10
    }
  }
}
```

---

## Implementation Layers

### 1. Presentation Layer (HTTP)

#### Query DTO

```typescript
// presentation/http/dto/pagination-query.dto.ts
import { Type } from 'class-transformer';
import { IsInt, Min, Max, IsOptional } from 'class-validator';

export class PaginationQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 10;
}
```

#### Response DTO

```typescript
// presentation/http/dto/paginated-response.dto.ts
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

#### Controller Implementation

```typescript
// presentation/http/controllers/job-profiles.controller.ts
@Controller('api/v1/job-profiles')
@UseGuards(SupabaseGuard)
export class JobProfilesController {
  constructor(
    private readonly queryBus: QueryBus,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List all job profiles for authenticated user' })
  @ApiResponse({
    status: 200,
    description: 'Paginated list of job profiles',
    type: PaginatedResponseDto<JobProfileListItemDto>,
  })
  async list(
    @Query() paginationQuery: PaginationQueryDto,
    @CurrentUser() user: { id: string },
  ): Promise<PaginatedResponseDto<JobProfileListItemDto>> {
    const query = new ListJobProfilesQuery(
      user.id,
      paginationQuery.page ?? 1,
      paginationQuery.limit ?? 10,
    );

    const result = await this.queryBus.execute(query);

    return JobProfileHttpMapper.toPaginatedResponseDto(result);
  }
}
```

#### HTTP Mapper

```typescript
// presentation/http/mappers/job-profile-http.mapper.ts
export class JobProfileHttpMapper {
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
        },
      },
    };
  }
}
```

---

### 2. Application Layer (CQRS)

#### Query

```typescript
// application/queries/impl/list-job-profiles.query.ts
export class ListJobProfilesQuery {
  constructor(
    public readonly userId: string,
    public readonly page: number,
    public readonly limit: number,
  ) {}
}
```

#### Query Handler

```typescript
// application/queries/handlers/list-job-profiles.handler.ts
import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { ListJobProfilesQuery } from '../impl/list-job-profiles.query';
import { IJobProfileRepository, JOB_PROFILE_REPOSITORY } from '@modules/job-profiles/domain/repositories/job-profile.repository.interface';
import { PaginatedResult } from '@/common/dto/paginated-result.dto';
import { JobProfileListItemDto } from '../../dto/job-profile-list-item.dto';
import { JobProfileApplicationMapper } from '../../mappers/job-profile-application.mapper';

@QueryHandler(ListJobProfilesQuery)
export class ListJobProfilesHandler
  implements IQueryHandler<ListJobProfilesQuery, PaginatedResult<JobProfileListItemDto>>
{
  constructor(
    @Inject(JOB_PROFILE_REPOSITORY)
    private readonly repository: IJobProfileRepository,
  ) {}

  async execute(query: ListJobProfilesQuery): Promise<PaginatedResult<JobProfileListItemDto>> {
    const { userId, page, limit } = query;

    // Calculate offset
    const offset = (page - 1) * limit;

    // Fetch data and total count in parallel
    const [profiles, totalItems] = await Promise.all([
      this.repository.findByUserId(
        UserId.create(userId),
        limit,
        offset,
      ),
      this.repository.countByUserId(UserId.create(userId)),
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
    };
  }
}
```

#### Application DTO

```typescript
// application/dto/paginated-result.dto.ts (shared utility)
export class PaginatedResult<T> {
  items: T[];
  nextPage: number | null;
  prevPage: number | null;
  totalItems: number;
  totalPages: number;
  page: number;
  limit: number;
}
```

---

### 3. Domain Layer

#### Repository Interface

```typescript
// domain/repositories/job-profile.repository.interface.ts
export interface IJobProfileRepository {
  // Paginated list query
  findByUserId(
    userId: UserId,
    limit: number,
    offset: number,
    includeDeleted?: boolean,
  ): Promise<JobProfile[]>;

  // Count for pagination metadata
  countByUserId(
    userId: UserId,
    includeDeleted?: boolean,
  ): Promise<number>;
}

export const JOB_PROFILE_REPOSITORY = Symbol('JOB_PROFILE_REPOSITORY');
```

---

### 4. Infrastructure Layer (Persistence)

#### Repository Implementation (Drizzle)

```typescript
// infrastructure/persistence/repositories/job-profile.repository.ts
@Injectable()
export class JobProfileRepository implements IJobProfileRepository {
  constructor(@Inject(DRIZZLE_DB) private readonly db: DrizzleDb) {}

  async findByUserId(
    userId: UserId,
    limit: number,
    offset: number,
    includeDeleted = false,
  ): Promise<JobProfile[]> {
    const conditions = [eq(jobProfiles.userId, userId.getValue())];

    // Exclude soft-deleted records by default
    if (!includeDeleted) {
      conditions.push(isNull(jobProfiles.deletedAt));
    }

    const result = await this.db
      .select()
      .from(jobProfiles)
      .where(and(...conditions))
      .limit(limit)
      .offset(offset)
      .orderBy(desc(jobProfiles.createdAt)); // Most recent first

    return result.map(JobProfilePersistenceMapper.toDomain);
  }

  async countByUserId(
    userId: UserId,
    includeDeleted = false,
  ): Promise<number> {
    const conditions = [eq(jobProfiles.userId, userId.getValue())];

    if (!includeDeleted) {
      conditions.push(isNull(jobProfiles.deletedAt));
    }

    const result = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(jobProfiles)
      .where(and(...conditions));

    return result[0]?.count ?? 0;
  }
}
```

#### Performance Optimization

Add indexes for common pagination queries:

```sql
-- Composite index for user_id + created_at (for sorting) + active records
CREATE INDEX idx_job_profiles_user_id_created_at_active
ON job_profiles(user_id, created_at DESC)
WHERE deleted_at IS NULL;

-- Index for counting queries
CREATE INDEX idx_job_profiles_user_id_active
ON job_profiles(user_id)
WHERE deleted_at IS NULL;
```

---

## Swagger Documentation

### Complete Endpoint Documentation

```typescript
@Get()
@ApiOperation({
  summary: 'List all job profiles for authenticated user',
  description: 'Returns a paginated list of job profiles ordered by creation date (newest first)',
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
          nextPage: { type: 'number', nullable: true, example: 3 },
          prevPage: { type: 'number', nullable: true, example: 1 },
          totalItems: { type: 'number', example: 47 },
          totalPages: { type: 'number', example: 5 },
          query: {
            type: 'object',
            properties: {
              page: { type: 'number', example: 2 },
              limit: { type: 'number', example: 10 },
            },
          },
        },
      },
    },
  },
})
@ApiResponse({ status: 401, description: 'Unauthorized' })
async list(
  @Query() paginationQuery: PaginationQueryDto,
  @CurrentUser() user: { id: string },
): Promise<PaginatedResponseDto<JobProfileListItemDto>> {
  // Implementation
}
```

---

## Testing

### Unit Tests - Query Handler

```typescript
describe('ListJobProfilesHandler', () => {
  let handler: ListJobProfilesHandler;
  let repository: jest.Mocked<IJobProfileRepository>;

  beforeEach(() => {
    repository = {
      findByUserId: jest.fn(),
      countByUserId: jest.fn(),
    } as any;

    handler = new ListJobProfilesHandler(repository);
  });

  it('should return paginated results for first page', async () => {
    const userId = UserId.create('user-123');
    const mockProfiles = [
      JobProfile.createNew({ userId, rawJD: 'JD 1' }),
      JobProfile.createNew({ userId, rawJD: 'JD 2' }),
    ];

    repository.findByUserId.mockResolvedValue(mockProfiles);
    repository.countByUserId.mockResolvedValue(15);

    const query = new ListJobProfilesQuery('user-123', 1, 10);
    const result = await handler.execute(query);

    expect(result.items).toHaveLength(2);
    expect(result.totalItems).toBe(15);
    expect(result.totalPages).toBe(2);
    expect(result.nextPage).toBe(2);
    expect(result.prevPage).toBeNull();
    expect(result.query).toEqual({ page: 1, limit: 10 });
  });

  it('should return correct pagination for middle page', async () => {
    repository.findByUserId.mockResolvedValue([]);
    repository.countByUserId.mockResolvedValue(50);

    const query = new ListJobProfilesQuery('user-123', 3, 10);
    const result = await handler.execute(query);

    expect(result.totalPages).toBe(5);
    expect(result.nextPage).toBe(4);
    expect(result.prevPage).toBe(2);
  });

  it('should return null nextPage for last page', async () => {
    repository.findByUserId.mockResolvedValue([]);
    repository.countByUserId.mockResolvedValue(25);

    const query = new ListJobProfilesQuery('user-123', 3, 10);
    const result = await handler.execute(query);

    expect(result.totalPages).toBe(3);
    expect(result.nextPage).toBeNull();
    expect(result.prevPage).toBe(2);
  });

  it('should calculate correct offset', async () => {
    repository.findByUserId.mockResolvedValue([]);
    repository.countByUserId.mockResolvedValue(100);

    const query = new ListJobProfilesQuery('user-123', 3, 20);
    await handler.execute(query);

    expect(repository.findByUserId).toHaveBeenCalledWith(
      expect.any(UserId),
      20,  // limit
      40,  // offset = (page - 1) * limit = (3 - 1) * 20
    );
  });
});
```

### Integration Tests - Repository

```typescript
describe('JobProfileRepository - Pagination', () => {
  let repository: JobProfileRepository;
  let db: DrizzleDb;

  beforeAll(async () => {
    // Setup test database
  });

  it('should return correct page of results', async () => {
    const userId = UserId.create('user-123');

    // Create 25 profiles
    for (let i = 0; i < 25; i++) {
      const profile = JobProfile.createNew({
        userId,
        rawJD: `JD ${i}`,
      });
      await repository.save(profile);
    }

    // Get page 2 with 10 items per page
    const page2 = await repository.findByUserId(userId, 10, 10);
    expect(page2).toHaveLength(10);

    // Get page 3 with 10 items per page
    const page3 = await repository.findByUserId(userId, 10, 20);
    expect(page3).toHaveLength(5); // Last page has remaining 5 items
  });

  it('should return correct count', async () => {
    const userId = UserId.create('user-456');

    // Create 15 profiles
    for (let i = 0; i < 15; i++) {
      const profile = JobProfile.createNew({
        userId,
        rawJD: `JD ${i}`,
      });
      await repository.save(profile);
    }

    const count = await repository.countByUserId(userId);
    expect(count).toBe(15);
  });

  it('should exclude soft-deleted from count', async () => {
    const userId = UserId.create('user-789');

    // Create 10 profiles
    const profiles = [];
    for (let i = 0; i < 10; i++) {
      const profile = JobProfile.createNew({
        userId,
        rawJD: `JD ${i}`,
      });
      await repository.save(profile);
      profiles.push(profile);
    }

    // Soft delete 3 profiles
    await repository.softDelete(profiles[0].getId());
    await repository.softDelete(profiles[1].getId());
    await repository.softDelete(profiles[2].getId());

    const count = await repository.countByUserId(userId);
    expect(count).toBe(7); // 10 - 3 deleted
  });
});
```

### E2E Tests

```typescript
describe('GET /api/v1/job-profiles (pagination)', () => {
  it('should return first page with default limit', () => {
    return request(app.getHttpServer())
      .get('/api/v1/job-profiles')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200)
      .expect((res) => {
        expect(res.body.success).toBe(true);
        expect(res.body.data).toHaveProperty('items');
        expect(res.body.data).toHaveProperty('nextPage');
        expect(res.body.data).toHaveProperty('prevPage');
        expect(res.body.data).toHaveProperty('totalItems');
        expect(res.body.data).toHaveProperty('totalPages');
        expect(res.body.data.query).toEqual({ page: 1, limit: 10 });
      });
  });

  it('should respect custom page and limit', () => {
    return request(app.getHttpServer())
      .get('/api/v1/job-profiles?page=2&limit=5')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200)
      .expect((res) => {
        expect(res.body.data.query).toEqual({ page: 2, limit: 5 });
      });
  });

  it('should reject invalid page number', () => {
    return request(app.getHttpServer())
      .get('/api/v1/job-profiles?page=0')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(400);
  });

  it('should reject limit exceeding max', () => {
    return request(app.getHttpServer())
      .get('/api/v1/job-profiles?limit=101')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(400);
  });
});
```

---

## Edge Cases

### Empty Results

```typescript
// Handler returns empty array
{
  items: [],
  nextPage: null,
  prevPage: null,
  totalItems: 0,
  totalPages: 0,
  query: { page: 1, limit: 10 }
}
```

### Single Page

```typescript
// Total items <= limit
{
  items: [...], // 5 items
  nextPage: null,
  prevPage: null,
  totalItems: 5,
  totalPages: 1,
  query: { page: 1, limit: 10 }
}
```

### Last Page Partial

```typescript
// Page 3 of 3 with only 7 items (limit: 10)
{
  items: [...], // 7 items
  nextPage: null,
  prevPage: 2,
  totalItems: 27,
  totalPages: 3,
  query: { page: 3, limit: 10 }
}
```

### Beyond Last Page

Handler should treat as valid but return empty results:

```typescript
// Requesting page 10 when total pages = 3
{
  items: [],
  nextPage: null,
  prevPage: 9,
  totalItems: 27,
  totalPages: 3,
  query: { page: 10, limit: 10 }
}
```

---

## Best Practices

### ✅ DO

1. **Use default values**

   ```typescript
   page?: number = 1;
   limit?: number = 10;
   ```

2. **Enforce maximum limit**

   ```typescript
   @Max(100)
   limit?: number = 10;
   ```

3. **Parallel count and fetch**

   ```typescript
   const [items, total] = await Promise.all([
     repository.find(...),
     repository.count(...),
   ]);
   ```

4. **Add database indexes**

   ```sql
   CREATE INDEX idx_table_user_created_active
   ON table_name(user_id, created_at DESC)
   WHERE deleted_at IS NULL;
   ```

5. **Return consistent structure**
   - Always include all pagination metadata
   - Echo back query parameters

6. **Validate input**

   ```typescript
   @Min(1) page
   @Min(1) @Max(100) limit
   ```

### ❌ DON'T

1. **Don't skip validation**

   ```typescript
   // ❌ Bad - no validation
   @Get()
   async list(@Query('page') page: number) { ... }
   ```

2. **Don't fetch all records**

   ```typescript
   // ❌ Bad - no limit
   const all = await repository.findAll();
   ```

3. **Don't ignore soft-deleted records**

   ```typescript
   // ❌ Bad - includes deleted
   const count = await db.count().from(table);
   ```

4. **Don't calculate total on every query**
   - For very large tables, consider caching total count
   - Use approximate counts for estimates

5. **Don't use inconsistent defaults**
   - Use the same default limit across all endpoints

---

## Performance Considerations

### Optimization Strategies

1. **Index Coverage**

   ```sql
   -- Covering index for common queries
   CREATE INDEX idx_job_profiles_pagination
   ON job_profiles(user_id, created_at DESC, id)
   WHERE deleted_at IS NULL;
   ```

2. **Count Optimization**
   - For very large tables, consider approximate counts
   - Cache total count with invalidation strategy

3. **Limit Boundaries**
   - Enforce reasonable max limit (100)
   - Discourage very large page sizes

4. **Query Planning**

   ```sql
   -- Verify index usage
   EXPLAIN ANALYZE
   SELECT * FROM job_profiles
   WHERE user_id = 'xxx' AND deleted_at IS NULL
   ORDER BY created_at DESC
   LIMIT 10 OFFSET 20;
   ```

### When to Consider Cursor Pagination

Switch to cursor pagination if:

- Dataset > 100,000 records per user
- Deep pagination is common (page > 100)
- Real-time updates cause data shifts
- Performance tests show offset slowdown

---

## Migration to Cursor Pagination (Future)

If needed, cursor pagination structure:

```typescript
// Query parameters
{
  cursor?: string,  // Encoded cursor
  limit?: number,
}

// Response
{
  success: true,
  data: {
    items: T[],
    nextCursor: string | null,
    prevCursor: string | null,
    hasMore: boolean,
  }
}
```

---

## Summary

The pagination pattern in MENTOR API:

✅ **Offset-based pagination** for simplicity and predictability
✅ **Consistent query parameters** (`page`, `limit`)
✅ **Standardized response structure** with full metadata
✅ **Validation at HTTP boundary** (min/max constraints)
✅ **Parallel count and fetch** for performance
✅ **Soft-delete aware** (excludes deleted by default)
✅ **Database indexes** for optimized queries
✅ **Complete Swagger documentation**
✅ **Comprehensive testing** at all layers

---

**Document Version:** 1.0
**Last Updated:** 2026-01-29
