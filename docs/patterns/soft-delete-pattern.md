# Soft Delete Pattern - Implementation Guide

**Version:** 1.0
**Date:** 2026-01-17
**Status:** Active

---

## Overview

The MENTOR API implements the **soft delete pattern** across all entities. Records are never physically deleted from the database; instead, they are marked as deleted using a `deleted_at` timestamp.

---

## Benefits

1. **Data Recovery:** Soft-deleted records can be easily restored
2. **Audit Trail:** Maintain complete history of all data
3. **Referential Integrity:** Avoid cascading delete issues
4. **Compliance:** Support data retention policies and regulations
5. **Analytics:** Keep historical data for reporting and analysis

---

## Database Schema

### Standard Columns

All tables include these timestamp columns:

```typescript
{
  created_at: timestamp (defaultNow, notNull)
  updated_at: timestamp (defaultNow, notNull)
  deleted_at: timestamp (nullable)  // Soft delete marker
}
```

### Example: Job Profiles Table

```sql
CREATE TABLE job_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  job_title VARCHAR(255),
  -- other columns...
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
  deleted_at TIMESTAMP  -- NULL = active, NOT NULL = deleted
);

-- Index for performance (exclude deleted records)
CREATE INDEX idx_job_profiles_user_id_active
ON job_profiles(user_id)
WHERE deleted_at IS NULL;
```

---

## Domain Layer Implementation

### Entity Methods

Domain entities expose soft delete functionality through dedicated methods:

```typescript
export class JobProfile {
  private deletedAt?: Date;

  // Check if entity is deleted
  isDeleted(): boolean {
    return this.deletedAt !== undefined;
  }

  // Mark entity as deleted
  softDelete(): void {
    if (this.isDeleted()) {
      throw new Error('Job profile is already deleted');
    }
    this.deletedAt = new Date();
    this.updatedAt = new Date();
  }

  // Restore deleted entity
  restore(): void {
    if (!this.isDeleted()) {
      throw new Error('Job profile is not deleted');
    }
    this.deletedAt = undefined;
    this.updatedAt = new Date();
  }

  // Prevent operations on deleted entities
  updateParsedData(data: UpdateData): void {
    if (this.isDeleted()) {
      throw new Error('Cannot update deleted job profile');
    }
    // ... update logic
  }

  getDeletedAt(): Date | undefined {
    return this.deletedAt;
  }
}
```

### Business Rules

- **Protection:** Business methods throw errors when called on deleted entities
- **Idempotence:** `softDelete()` and `restore()` validate current state
- **Timestamps:** Both operations update `updated_at` timestamp

---

## Repository Layer Implementation

### Repository Interface

```typescript
export interface IJobProfileRepository {
  save(jobProfile: JobProfile): Promise<void>;

  // includeDeleted parameter (default: false)
  findById(id: JobProfileId, includeDeleted?: boolean): Promise<JobProfile | null>;
  findByUserId(
    userId: UserId,
    limit?: number,
    offset?: number,
    includeDeleted?: boolean
  ): Promise<JobProfile[]>;
  countByUserId(userId: UserId, includeDeleted?: boolean): Promise<number>;

  // Dedicated soft delete operations
  softDelete(id: JobProfileId): Promise<void>;
  restore(id: JobProfileId): Promise<void>;
}
```

### Repository Implementation (Drizzle)

```typescript
@Injectable()
export class JobProfileRepository implements IJobProfileRepository {
  constructor(@Inject(DRIZZLE_DB) private readonly db: DrizzleDb) {}

  async findById(id: JobProfileId, includeDeleted = false): Promise<JobProfile | null> {
    const conditions = [eq(jobProfiles.id, id.getValue())];

    // By default, exclude soft-deleted records
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

### Query Best Practices

**Default Behavior:** Always exclude soft-deleted records

```typescript
// ✅ Good - Excludes deleted by default
const profiles = await repository.findByUserId(userId);

// ✅ Good - Explicit inclusion when needed
const allProfiles = await repository.findByUserId(userId, 10, 0, true);
```

**Performance Consideration:** Add partial indexes

```sql
-- Fast queries for active records
CREATE INDEX idx_table_user_id_active
ON table_name(user_id)
WHERE deleted_at IS NULL;
```

---

## Application Layer (CQRS)

### Delete Command

```typescript
// Command
export class SoftDeleteJobProfileCommand {
  constructor(
    public readonly jobProfileId: string,
    public readonly userId: string,
  ) {}
}

// Handler
@CommandHandler(SoftDeleteJobProfileCommand)
export class SoftDeleteJobProfileHandler
  implements ICommandHandler<SoftDeleteJobProfileCommand>
{
  constructor(
    @Inject(JOB_PROFILE_REPOSITORY)
    private readonly repository: IJobProfileRepository,
  ) {}

  async execute(command: SoftDeleteJobProfileCommand): Promise<void> {
    const id = JobProfileId.create(command.jobProfileId);

    // Load entity (throws if not found or already deleted)
    const profile = await this.repository.findById(id);
    if (!profile) {
      throw new NotFoundException('Job profile not found');
    }

    // Check authorization
    if (profile.getUserId().getValue() !== command.userId) {
      throw new ForbiddenException('Not authorized to delete this profile');
    }

    // Soft delete via domain method
    profile.softDelete();

    // Persist (could also use repository.softDelete() directly)
    await this.repository.softDelete(id);
  }
}
```

### Restore Command

```typescript
// Command
export class RestoreJobProfileCommand {
  constructor(
    public readonly jobProfileId: string,
    public readonly userId: string,
  ) {}
}

// Handler
@CommandHandler(RestoreJobProfileCommand)
export class RestoreJobProfileHandler
  implements ICommandHandler<RestoreJobProfileCommand>
{
  constructor(
    @Inject(JOB_PROFILE_REPOSITORY)
    private readonly repository: IJobProfileRepository,
  ) {}

  async execute(command: RestoreJobProfileCommand): Promise<void> {
    const id = JobProfileId.create(command.jobProfileId);

    // Load including deleted records
    const profile = await this.repository.findById(id, true);
    if (!profile) {
      throw new NotFoundException('Job profile not found');
    }

    if (!profile.isDeleted()) {
      throw new BadRequestException('Job profile is not deleted');
    }

    // Check authorization
    if (profile.getUserId().getValue() !== command.userId) {
      throw new ForbiddenException('Not authorized to restore this profile');
    }

    // Restore via domain method
    profile.restore();

    // Persist
    await this.repository.restore(id);
  }
}
```

---

## Presentation Layer (HTTP)

### DELETE Endpoint (Soft Delete)

```typescript
@Controller('api/v1/job-profiles')
@UseGuards(SupabaseGuard)
export class JobProfilesController {
  constructor(private readonly commandBus: CommandBus) {}

  @Delete(':id')
  @HttpCode(204)
  async delete(
    @Param('id') id: string,
    @CurrentUser() user: { id: string },
  ): Promise<void> {
    const command = new SoftDeleteJobProfileCommand(id, user.id);
    await this.commandBus.execute(command);
  }

  @Post(':id/restore')
  async restore(
    @Param('id') id: string,
    @CurrentUser() user: { id: string },
  ): Promise<void> {
    const command = new RestoreJobProfileCommand(id, user.id);
    await this.commandBus.execute(command);
  }
}
```

---

## Persistence Mapper

### Mapping Deleted Timestamp

```typescript
export class JobProfilePersistenceMapper {
  static toDomain(orm: JobProfileORM): JobProfile {
    return JobProfile.rehydrate({
      id: JobProfileId.create(orm.id),
      // ... other fields
      deletedAt: orm.deletedAt ?? undefined,
    });
  }

  static toOrmInsert(domain: JobProfile): JobProfileInsert {
    return {
      userId: domain.getUserId().getValue(),
      // ... other fields
      deletedAt: domain.getDeletedAt(),
    };
  }
}
```

---

## Testing

### Unit Tests - Domain Entity

```typescript
describe('JobProfile - Soft Delete', () => {
  it('should mark entity as deleted', () => {
    const profile = JobProfile.createNew({
      userId: UserId.create('user-123'),
      rawJD: 'Test JD',
    });

    expect(profile.isDeleted()).toBe(false);

    profile.softDelete();

    expect(profile.isDeleted()).toBe(true);
    expect(profile.getDeletedAt()).toBeDefined();
  });

  it('should restore deleted entity', () => {
    const profile = JobProfile.createNew({
      userId: UserId.create('user-123'),
      rawJD: 'Test JD',
    });

    profile.softDelete();
    expect(profile.isDeleted()).toBe(true);

    profile.restore();
    expect(profile.isDeleted()).toBe(false);
    expect(profile.getDeletedAt()).toBeUndefined();
  });

  it('should prevent updates on deleted entity', () => {
    const profile = JobProfile.createNew({
      userId: UserId.create('user-123'),
      rawJD: 'Test JD',
    });

    profile.softDelete();

    expect(() => {
      profile.updateParsedData({ jobTitle: 'New Title' });
    }).toThrow('Cannot update deleted job profile');
  });
});
```

### Integration Tests - Repository

```typescript
describe('JobProfileRepository - Soft Delete', () => {
  it('should exclude soft-deleted records by default', async () => {
    // Create and soft delete a profile
    const profile = JobProfile.createNew({
      userId: UserId.create('user-123'),
      rawJD: 'Test',
    });
    await repository.save(profile);
    await repository.softDelete(profile.getId());

    // Should not find deleted profile
    const found = await repository.findById(profile.getId());
    expect(found).toBeNull();

    // Should find when including deleted
    const foundWithDeleted = await repository.findById(profile.getId(), true);
    expect(foundWithDeleted).toBeDefined();
    expect(foundWithDeleted?.isDeleted()).toBe(true);
  });

  it('should restore soft-deleted record', async () => {
    const profile = JobProfile.createNew({
      userId: UserId.create('user-123'),
      rawJD: 'Test',
    });
    await repository.save(profile);
    await repository.softDelete(profile.getId());

    // Restore
    await repository.restore(profile.getId());

    // Should find restored profile
    const found = await repository.findById(profile.getId());
    expect(found).toBeDefined();
    expect(found?.isDeleted()).toBe(false);
  });
});
```

---

## Common Patterns

### Cascade Soft Delete

When deleting a parent entity, cascade to children:

```typescript
async deleteJobProfile(profileId: string): Promise<void> {
  // 1. Soft delete job profile
  await jobProfileRepository.softDelete(JobProfileId.create(profileId));

  // 2. Cascade to related interview sessions
  const sessions = await interviewRepository.findByJobProfileId(
    JobProfileId.create(profileId)
  );

  for (const session of sessions) {
    session.softDelete();
    await interviewRepository.softDelete(session.getId());
  }
}
```

### Permanent Deletion (Cleanup)

For GDPR compliance or data retention policies, create a background job:

```typescript
@Injectable()
export class DataCleanupService {
  async permanentlyDeleteOldRecords(): Promise<void> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 90); // 90 days retention

    // Find records soft-deleted before cutoff
    const oldRecords = await this.db
      .select()
      .from(jobProfiles)
      .where(
        and(
          isNotNull(jobProfiles.deletedAt),
          lt(jobProfiles.deletedAt, cutoffDate)
        )
      );

    // Physically delete
    await this.db
      .delete(jobProfiles)
      .where(
        and(
          isNotNull(jobProfiles.deletedAt),
          lt(jobProfiles.deletedAt, cutoffDate)
        )
      );
  }
}
```

---

## Summary

The soft delete pattern in MENTOR API:

✅ **Never physically deletes records**
✅ **Uses `deleted_at` timestamp for marking deletions**
✅ **Excludes soft-deleted records by default**
✅ **Supports restoration via `restore()` method**
✅ **Enforces business rules at domain level**
✅ **Provides clean repository interface**
✅ **Maintains referential integrity**
✅ **Enables data recovery and audit trails**

---

**Document Version:** 1.0
**Last Updated:** 2026-01-17
