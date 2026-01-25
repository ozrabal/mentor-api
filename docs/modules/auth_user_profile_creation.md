# User Profile Creation and Persistence Plan

**Module:** Auth
**Goal:** Extend auth module to create and persist user profiles in the database after successful Supabase registration
**Version:** 1.0
**Date:** 2026-01-23

---

## Overview

Currently, the `RegisterHandler` only creates a Supabase identity and returns auth tokens. This plan extends the registration flow to create a corresponding user record in our PostgreSQL database (via the `users` table) to enable cross-module relationships and maintain user data within our system.

**Architecture Alignment:**

- Follows CQRS pattern with CommandBus
- Implements Clean Architecture with layered separation
- Uses Domain-Driven Design with entities, value objects, and repositories
- Mirrors job-profiles module structure for consistency

---

## Current State Analysis

### Existing Flow

```
RegisterCommand → RegisterHandler → AuthService.register() → Supabase signUp → AuthResultDto
```

### Database Schema (from schema.ts)

```typescript
users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  identityId: varchar("identity_id", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  deletedAt: timestamp("deleted_at"), // Soft delete
});
```

### Current Issues

1. No user record created in PostgreSQL after Supabase registration
2. Cannot establish foreign key relationships (job_profiles.userId → users.id)
3. No domain model for User entity
4. No repository pattern for user persistence
5. Auth module lacks infrastructure layer

---

## Implementation Steps

### Step 1: Define Domain Layer

Create domain entities, value objects, and repository interfaces following DDD principles.

#### 1.1 Create User Value Objects

**File:** `src/modules/auth/domain/value-objects/user-id.ts`

```typescript
import { randomUUID } from "crypto";

export class UserId {
  private constructor(private readonly value: string) {
    if (!value || value.trim().length === 0) {
      throw new Error("UserId cannot be empty");
    }
    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(value)) {
      throw new Error("UserId must be a valid UUID");
    }
  }

  static create(value: string): UserId {
    return new UserId(value);
  }

  static generate(): UserId {
    return new UserId(randomUUID());
  }

  getValue(): string {
    return this.value;
  }

  equals(other: UserId): boolean {
    return this.value === other.value;
  }
}
```

**File:** `src/modules/auth/domain/value-objects/identity-id.ts`

```typescript
export class IdentityId {
  private constructor(private readonly value: string) {
    if (!value || value.trim().length === 0) {
      throw new Error("IdentityId cannot be empty");
    }
    // Supabase identity IDs are UUIDs
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(value)) {
      throw new Error("IdentityId must be a valid UUID");
    }
  }

  static create(value: string): IdentityId {
    return new IdentityId(value);
  }

  getValue(): string {
    return this.value;
  }

  equals(other: IdentityId): boolean {
    return this.value === other.value;
  }
}
```

**File:** `src/modules/auth/domain/value-objects/email.ts`

```typescript
export class Email {
  private constructor(private readonly value: string) {
    if (!this.isValid(value)) {
      throw new Error("Invalid email address");
    }
  }

  static create(value: string): Email {
    return new Email(value);
  }

  getValue(): string {
    return this.value;
  }

  equals(other: Email): boolean {
    return this.value.toLowerCase() === other.value.toLowerCase();
  }

  private isValid(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email) && email.length <= 255;
  }
}
```

#### 1.2 Create User Domain Entity

**File:** `src/modules/auth/domain/entities/user.entity.ts`

```typescript
import { Email } from "../value-objects/email";
import { IdentityId } from "../value-objects/identity-id";
import { UserId } from "../value-objects/user-id";

export interface UserProps {
  createdAt?: Date;
  deletedAt?: Date;
  email: Email;
  id?: UserId;
  identityId: IdentityId;
  updatedAt?: Date;
}

export class User {
  private constructor(
    private readonly id: UserId,
    private email: Email,
    private readonly identityId: IdentityId,
    private readonly createdAt: Date = new Date(),
    private updatedAt: Date = new Date(),
    private deletedAt?: Date,
  ) {}

  /**
   * Factory method for creating new user instances (registration flow)
   */
  static createNew(email: string, identityId: string): User {
    return new User(
      UserId.generate(),
      Email.create(email),
      IdentityId.create(identityId),
    );
  }

  /**
   * Factory method for rehydrating user from persistence
   * Does not emit domain events
   */
  static rehydrate(props: {
    createdAt: Date;
    deletedAt?: Date;
    email: Email;
    id: UserId;
    identityId: IdentityId;
    updatedAt: Date;
  }): User {
    return new User(
      props.id,
      props.email,
      props.identityId,
      props.createdAt,
      props.updatedAt,
      props.deletedAt,
    );
  }

  // Getters
  getId(): UserId {
    return this.id;
  }

  getEmail(): Email {
    return this.email;
  }

  getIdentityId(): IdentityId {
    return this.identityId;
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
  changeEmail(newEmail: string): void {
    if (this.isDeleted()) {
      throw new Error("Cannot change email of deleted user");
    }
    this.email = Email.create(newEmail);
    this.updatedAt = new Date();
  }

  softDelete(): void {
    if (this.isDeleted()) {
      throw new Error("User is already deleted");
    }
    this.deletedAt = new Date();
    this.updatedAt = new Date();
  }

  restore(): void {
    if (!this.isDeleted()) {
      throw new Error("User is not deleted");
    }
    this.deletedAt = undefined;
    this.updatedAt = new Date();
  }
}
```

#### 1.3 Create Domain Errors

**File:** `src/modules/auth/domain/errors/user.errors.ts`

```typescript
export class UserAlreadyExistsError extends Error {
  constructor(email: string) {
    super(`User with email ${email} already exists`);
    this.name = "UserAlreadyExistsError";
  }
}

export class UserNotFoundError extends Error {
  constructor(identifier: string) {
    super(`User not found: ${identifier}`);
    this.name = "UserNotFoundError";
  }
}
```

#### 1.4 Create Repository Interface

**File:** `src/modules/auth/domain/repositories/user.repository.interface.ts`

```typescript
import { User } from "../entities/user.entity";
import { Email } from "../value-objects/email";
import { IdentityId } from "../value-objects/identity-id";
import { UserId } from "../value-objects/user-id";

export interface IUserRepository {
  save(user: User): Promise<void>;
  findById(id: UserId, includeDeleted?: boolean): Promise<User | null>;
  findByEmail(email: Email, includeDeleted?: boolean): Promise<User | null>;
  findByIdentityId(identityId: IdentityId, includeDeleted?: boolean): Promise<User | null>;
  softDelete(id: UserId): Promise<void>;
  restore(id: UserId): Promise<void>;
}

// DI token
export const USER_REPOSITORY = Symbol("USER_REPOSITORY");
```

---

### Step 2: Implement Infrastructure Layer

Create ORM entities, repository implementations, and persistence mappers.

#### 2.1 Create Persistence Mapper

**File:** `src/modules/auth/infrastructure/persistence/mappers/user-persistence.mapper.ts`

```typescript
import { User as UserORM } from "@/database/schema";

import { User } from "../../../domain/entities/user.entity";
import { Email } from "../../../domain/value-objects/email";
import { IdentityId } from "../../../domain/value-objects/identity-id";
import { UserId } from "../../../domain/value-objects/user-id";

export class UserPersistenceMapper {
  static toDomain(orm: UserORM): User {
    return User.rehydrate({
      createdAt: orm.createdAt,
      deletedAt: orm.deletedAt as Date | undefined,
      email: Email.create(orm.email),
      id: UserId.create(orm.id),
      identityId: IdentityId.create(orm.identityId),
      updatedAt: orm.updatedAt,
    });
  }

  static toOrmInsert(domain: User): {
    email: string;
    id: string;
    identityId: string;
  } {
    return {
      email: domain.getEmail().getValue(),
      id: domain.getId().getValue(),
      identityId: domain.getIdentityId().getValue(),
    };
  }
}
```

#### 2.2 Create Repository Implementation

**File:** `src/modules/auth/infrastructure/persistence/repositories/user.repository.ts`

```typescript
import { Inject, Injectable } from "@nestjs/common";
import { and, eq, isNull } from "drizzle-orm";

import { DRIZZLE_DB, DrizzleDb } from "@/database/database.service";
import { users } from "@/database/schema";

import { User } from "../../../domain/entities/user.entity";
import { IUserRepository } from "../../../domain/repositories/user.repository.interface";
import { Email } from "../../../domain/value-objects/email";
import { IdentityId } from "../../../domain/value-objects/identity-id";
import { UserId } from "../../../domain/value-objects/user-id";
import { UserPersistenceMapper } from "../mappers/user-persistence.mapper";

@Injectable()
export class UserRepository implements IUserRepository {
  constructor(@Inject(DRIZZLE_DB) private readonly db: DrizzleDb) {}

  async save(user: User): Promise<void> {
    const ormEntity = UserPersistenceMapper.toOrmInsert(user);
    await this.db.insert(users).values(ormEntity);
  }

  async findById(
    id: UserId,
    includeDeleted = false,
  ): Promise<User | null> {
    const conditions = [eq(users.id, id.getValue())];

    if (!includeDeleted) {
      conditions.push(isNull(users.deletedAt));
    }

    const result = await this.db
      .select()
      .from(users)
      .where(and(...conditions))
      .limit(1);

    if (!result[0]) return null;
    return UserPersistenceMapper.toDomain(result[0]);
  }

  async findByEmail(
    email: Email,
    includeDeleted = false,
  ): Promise<User | null> {
    const conditions = [eq(users.email, email.getValue())];

    if (!includeDeleted) {
      conditions.push(isNull(users.deletedAt));
    }

    const result = await this.db
      .select()
      .from(users)
      .where(and(...conditions))
      .limit(1);

    if (!result[0]) return null;
    return UserPersistenceMapper.toDomain(result[0]);
  }

  async findByIdentityId(
    identityId: IdentityId,
    includeDeleted = false,
  ): Promise<User | null> {
    const conditions = [eq(users.identityId, identityId.getValue())];

    if (!includeDeleted) {
      conditions.push(isNull(users.deletedAt));
    }

    const result = await this.db
      .select()
      .from(users)
      .where(and(...conditions))
      .limit(1);

    if (!result[0]) return null;
    return UserPersistenceMapper.toDomain(result[0]);
  }

  async softDelete(id: UserId): Promise<void> {
    await this.db
      .update(users)
      .set({
        deletedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(users.id, id.getValue()));
  }

  async restore(id: UserId): Promise<void> {
    await this.db
      .update(users)
      .set({
        deletedAt: null,
        updatedAt: new Date(),
      })
      .where(eq(users.id, id.getValue()));
  }
}
```

---

### Step 3: Update Application Layer

Modify the RegisterHandler to persist user after Supabase registration.

#### 3.1 Update RegisterHandler

**File:** `src/modules/auth/application/commands/handlers/register.handler.ts`

```typescript
import { Inject } from "@nestjs/common";
import { CommandHandler, ICommandHandler } from "@nestjs/cqrs";

import { AuthService } from "../../../auth.service";
import { User } from "../../../domain/entities/user.entity";
import {
  IUserRepository,
  USER_REPOSITORY,
} from "../../../domain/repositories/user.repository.interface";
import { AuthResultDto } from "../../dto/auth-result.dto";
import { RegisterCommand } from "../impl/register.command";

@CommandHandler(RegisterCommand)
export class RegisterHandler implements ICommandHandler<RegisterCommand> {
  constructor(
    private readonly authService: AuthService,
    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
  ) {}

  async execute(command: RegisterCommand): Promise<AuthResultDto> {
    // 1. Register with Supabase (creates identity)
    const authResult = await this.authService.register(
      command.email,
      command.password,
    );

    // 2. Create domain entity
    const user = User.createNew(authResult.email, authResult.userId);

    // 3. Persist to database
    await this.userRepository.save(user);

    // 4. Return auth result with our internal user ID
    return {
      ...authResult,
      // Optionally include internal user ID if needed
      // internalUserId: user.getId().getValue(),
    };
  }
}
```

**Note:** Consider if `AuthResultDto` should include the internal database user ID alongside the Supabase identity ID. Current implementation uses Supabase `userId` as `identityId` in domain model.

---

### Step 4: Update Module Wiring

Register new providers in the auth module.

#### 4.1 Update AuthModule

**File:** `src/modules/auth/auth.module.ts`

```typescript
import { Module } from "@nestjs/common";
import { CqrsModule } from "@nestjs/cqrs";
import { PassportModule } from "@nestjs/passport";

import { DatabaseModule } from "@/database/database.module";

import { LoginHandler } from "./application/commands/handlers/login.handler";
import { RegisterHandler } from "./application/commands/handlers/register.handler";
import { GetCurrentUserHandler } from "./application/queries/handlers/get-current-user.handler";
import { AuthService } from "./auth.service";
import { USER_REPOSITORY } from "./domain/repositories/user.repository.interface";
import { SupabaseJwtGuard } from "./guards/supabase-jwt.guard";
import { UserRepository } from "./infrastructure/persistence/repositories/user.repository";
import { AuthController } from "./presentation/http/controllers/auth.controller";
import { SupabaseJwtStrategy } from "./strategies/supabase-jwt.strategy";

@Module({
  controllers: [AuthController],
  exports: [SupabaseJwtGuard, SupabaseJwtStrategy],
  imports: [CqrsModule, PassportModule, DatabaseModule], // Add DatabaseModule
  providers: [
    // Service
    AuthService,
    // Command Handlers
    RegisterHandler,
    LoginHandler,
    // Query Handlers
    GetCurrentUserHandler,
    // Auth Strategy & Guard
    SupabaseJwtStrategy,
    SupabaseJwtGuard,
    // Repository
    {
      provide: USER_REPOSITORY,
      useClass: UserRepository,
    },
  ],
})
export class AuthModule {}
```

---

### Step 5: Error Handling and Validation

Add proper error handling for edge cases.

#### 5.1 Handle Duplicate User Creation

Update `RegisterHandler` to handle cases where user already exists:

```typescript
import { ConflictException, Inject } from "@nestjs/common";
import { CommandHandler, ICommandHandler } from "@nestjs/cqrs";

import { AuthService } from "../../../auth.service";
import { User } from "../../../domain/entities/user.entity";
import { UserAlreadyExistsError } from "../../../domain/errors/user.errors";
import {
  IUserRepository,
  USER_REPOSITORY,
} from "../../../domain/repositories/user.repository.interface";
import { Email } from "../../../domain/value-objects/email";
import { AuthResultDto } from "../../dto/auth-result.dto";
import { RegisterCommand } from "../impl/register.command";

@CommandHandler(RegisterCommand)
export class RegisterHandler implements ICommandHandler<RegisterCommand> {
  constructor(
    private readonly authService: AuthService,
    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
  ) {}

  async execute(command: RegisterCommand): Promise<AuthResultDto> {
    // 0. Check if user already exists (defensive check)
    const existingUser = await this.userRepository.findByEmail(
      Email.create(command.email),
    );
    if (existingUser) {
      throw new ConflictException("User with this email already exists");
    }

    // 1. Register with Supabase (creates identity)
    const authResult = await this.authService.register(
      command.email,
      command.password,
    );

    // 2. Create domain entity
    const user = User.createNew(authResult.email, authResult.userId);

    // 3. Persist to database
    try {
      await this.userRepository.save(user);
    } catch (error) {
      // TODO: Implement compensation logic to delete Supabase user if DB save fails
      // This requires adding a delete method to AuthService
      throw error;
    }

    // 4. Return auth result
    return authResult;
  }
}
```

**Important:** Consider implementing **compensating transaction** if database save fails after Supabase registration. This requires adding a `deleteUser(userId: string)` method to `AuthService`.

---

### Step 6: Update Public Contracts (Optional)

If other modules need access to user information, create ACL.

#### 6.1 Create ACL Interface

**File:** `src/modules/auth/public/acl/users.acl.interface.ts`

```typescript
export interface UserInfoDto {
  createdAt: Date;
  email: string;
  id: string;
  identityId: string;
}

export interface IUsersACL {
  getUserInfo(userId: string): Promise<UserInfoDto | null>;
  getUserByIdentityId(identityId: string): Promise<UserInfoDto | null>;
}
```

**File:** `src/modules/auth/public/acl/users.acl.tokens.ts`

```typescript
export const USERS_ACL = Symbol("USERS_ACL");
```

#### 6.2 Implement ACL Service

**File:** `src/modules/auth/infrastructure/acl/users.acl.service.ts`

```typescript
import { Inject, Injectable } from "@nestjs/common";

import { IUsersACL, UserInfoDto } from "../../public/acl/users.acl.interface";
import {
  IUserRepository,
  USER_REPOSITORY,
} from "../../domain/repositories/user.repository.interface";
import { UserId } from "../../domain/value-objects/user-id";
import { IdentityId } from "../../domain/value-objects/identity-id";

@Injectable()
export class UsersACLService implements IUsersACL {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
  ) {}

  async getUserInfo(userId: string): Promise<UserInfoDto | null> {
    const user = await this.userRepository.findById(UserId.create(userId));
    if (!user) return null;

    return {
      createdAt: user.getCreatedAt(),
      email: user.getEmail().getValue(),
      id: user.getId().getValue(),
      identityId: user.getIdentityId().getValue(),
    };
  }

  async getUserByIdentityId(identityId: string): Promise<UserInfoDto | null> {
    const user = await this.userRepository.findByIdentityId(
      IdentityId.create(identityId),
    );
    if (!user) return null;

    return {
      createdAt: user.getCreatedAt(),
      email: user.getEmail().getValue(),
      id: user.getId().getValue(),
      identityId: user.getIdentityId().getValue(),
    };
  }
}
```

#### 6.3 Export ACL from Module

Update `auth.module.ts`:

```typescript
import { USERS_ACL } from "./public/acl/users.acl.tokens";
import { UsersACLService } from "./infrastructure/acl/users.acl.service";

@Module({
  // ... existing config
  providers: [
    // ... existing providers
    {
      provide: USERS_ACL,
      useClass: UsersACLService,
    },
  ],
  exports: [
    SupabaseJwtGuard,
    SupabaseJwtStrategy,
    USERS_ACL, // Export ACL
  ],
})
export class AuthModule {}
```

#### 6.4 Update Public Index

**File:** `src/modules/auth/public/index.ts`

```typescript
// Export ACL interface and token
export * from "./acl/users.acl.interface";
export * from "./acl/users.acl.tokens";
```

---

### Step 7: Testing Strategy

Implement tests at each layer.

#### 7.1 Domain Tests

**File:** `src/modules/auth/domain/entities/user.entity.spec.ts`

Test:

- `createNew()` generates valid user with UUID
- `changeEmail()` updates email and timestamp
- `softDelete()` sets deletedAt
- `restore()` clears deletedAt
- Business rule validation (cannot change email of deleted user, etc.)

#### 7.2 Repository Tests

**File:** `src/modules/auth/infrastructure/persistence/repositories/user.repository.spec.ts`

Test:

- `save()` inserts user into database
- `findById()` retrieves user by ID
- `findByEmail()` retrieves user by email
- `findByIdentityId()` retrieves user by Supabase identity
- Soft delete functionality
- `includeDeleted` parameter behavior

#### 7.3 Handler Tests

**File:** `src/modules/auth/application/commands/handlers/register.handler.spec.ts`

Test:

- Successful registration creates user in DB
- Duplicate email throws ConflictException
- Supabase error propagates correctly
- Database error is handled

#### 7.4 Integration Tests

**File:** `src/modules/auth/auth.e2e.spec.ts`

Test:

- POST `/auth/register` creates user in both Supabase and database
- Verify user can be retrieved via repository after registration
- Verify foreign key relationships work (create job profile with userId)

---

## Implementation Checklist

### Domain Layer

- [ ] Create `UserId` value object
- [ ] Create `IdentityId` value object
- [ ] Create `Email` value object
- [ ] Create `User` entity with `createNew()` and `rehydrate()` methods
- [ ] Create domain errors (`UserAlreadyExistsError`, `UserNotFoundError`)
- [ ] Create `IUserRepository` interface
- [ ] Unit tests for value objects
- [ ] Unit tests for User entity

### Infrastructure Layer

- [ ] Create `UserPersistenceMapper`
- [ ] Create `UserRepository` implementation
- [ ] Inject `DRIZZLE_DB` via DatabaseModule
- [ ] Integration tests for repository

### Application Layer

- [ ] Update `RegisterHandler` to persist user
- [ ] Add duplicate check in `RegisterHandler`
- [ ] Add error handling for DB failures
- [ ] Unit tests for updated handler
- [ ] Consider compensating transaction for Supabase rollback

### Module Wiring

- [ ] Import `DatabaseModule` in `AuthModule`
- [ ] Register `USER_REPOSITORY` provider
- [ ] Verify all dependencies are injected correctly

### Public Contracts (Optional)

- [ ] Create `IUsersACL` interface
- [ ] Create ACL tokens
- [ ] Implement `UsersACLService`
- [ ] Export ACL from module
- [ ] Update `public/index.ts`

### Testing

- [ ] Domain unit tests
- [ ] Repository integration tests
- [ ] Handler unit tests
- [ ] E2E tests for registration flow
- [ ] Test foreign key relationships with other modules

### Documentation

- [ ] Update module README (if exists)
- [ ] Document ACL contract for other modules
- [ ] Add inline code comments for complex logic

---

## Migration Considerations

### Existing Users

If there are existing Supabase users without corresponding database records:

1. Create a migration script to sync Supabase identities to database
2. Query Supabase auth.users table
3. Insert records into our `users` table with matching `identityId`

### Rollback Plan

If issues occur:

1. Remove user persistence from `RegisterHandler` (revert to original)
2. Keep domain/infrastructure layers for future use
3. Existing Supabase auth continues to work

---

## Future Enhancements

1. **Email Verification**: Link email verification status from Supabase
2. **User Profiles**: Extend user entity with profile fields (name, bio, avatar)
3. **Audit Logging**: Log user creation events
4. **Bulk Operations**: Add methods for batch user queries
5. **Caching**: Cache frequently accessed user data
6. **Events**: Publish `UserRegisteredEvent` for other modules to react

---

## Cross-Module Usage Example

Once ACL is implemented, other modules can access user information:

```typescript
// In job-profiles module
import { IUsersACL, USERS_ACL } from "@modules/auth/public";

@Injectable()
export class SomeService {
  constructor(
    @Inject(USERS_ACL) private readonly usersACL: IUsersACL,
  ) {}

  async doSomething(identityId: string) {
    const user = await this.usersACL.getUserByIdentityId(identityId);
    // Use user.id for foreign key relationships
    await this.createJobProfile(user.id);
  }
}
```

---

## References

- **Architecture Doc**: `docs/architecture.md`
- **Auth Module Plan**: `docs/modules/auth.module.plan.md`
- **Database Schema**: `src/database/schema.ts`
- **Job Profiles Module**: Reference implementation for DDD patterns
- **NestJS CQRS**: <https://docs.nestjs.com/recipes/cqrs>

---

**Status:** Ready for implementation
**Estimated Effort:** 4-6 hours
**Priority:** High (required for foreign key relationships)
