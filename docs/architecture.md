# Mentor API Architecture Documentation

**Version:** 1.0  
**Last Updated:** 2026  
**Status:** Active

---

## Table of Contents

1. [Overview](#overview)
2. [Architectural Principles](#architectural-principles)
3. [Module Structure](#module-structure)
4. [Layer Responsibilities](#layer-responsibilities)
5. [CQRS Pattern](#cqrs-pattern)
6. [Cross-Module Communication](#cross-module-communication)
7. [Domain-Driven Design](#domain-driven-design)
8. [Development Guidelines](#development-guidelines)
9. [Code Examples](#code-examples)
10. [Common Patterns](#common-patterns)
11. [Best Practices](#best-practices)
12. [Anti-Patterns to Avoid](#anti-patterns-to-avoid)

---

## Overview

The Mentor API follows a **Modular Monolith** architecture, combining:
- **Domain-Driven Design (DDD)** - Rich domain models with business logic
- **Clean Architecture** - Clear layer separation and dependency rules
- **CQRS (Command Query Responsibility Segregation)** - Separate read and write operations

Each module is a self-contained "mini-application" with:
- Clear boundaries
- Clean layers
- Explicit public contracts (ACL)
- Mapping at every boundary

---

## Architectural Principles

### 1. Module Boundaries

**Rule:** Modules MUST NOT import internals from other modules.

✅ **Allowed:**
```typescript
// Import from public contract only
import { IUsersACL, USERS_ACL } from '@modules/users/public';
```

❌ **Forbidden:**
```typescript
// ❌ Direct import of internals
import { User } from '@modules/users/domain/entities/user.entity';
import { UserRepository } from '@modules/users/infrastructure/persistence/repositories/user.repository';
```

### 2. Layer Dependencies

Dependencies flow **downward only**:

```
presentation → application → domain
infrastructure → application + domain
```

**Rules:**
- Domain MUST NOT depend on NestJS, ORM, HTTP, or frameworks
- Application MUST NOT depend on ORM entities or HTTP DTOs
- Presentation MUST NOT call repositories directly
- Infrastructure MUST NOT leak into other modules

### 3. DTOs and Mapping

**Rule:** Use DTOs at every boundary and map explicitly.

- HTTP Request/Response DTOs (presentation)
- ACL DTOs (public contract)
- Application DTOs (application layer)
- Persistence entities/models (infrastructure)

**Mapping required:**
- HTTP DTO ↔ Application DTO
- Application DTO ↔ Domain
- Domain ↔ Persistence model

---

## Module Structure

### Standard Module Template

All modules follow this structure:

```
src/modules/<module-name>/
├── public/                           # ✅ ONLY cross-module imports allowed from here
│   ├── acl/
│   │   ├── <module>.acl.interface.ts # Interface (port)
│   │   ├── <module>.acl.dto.ts       # DTOs returned/accepted by ACL
│   │   └── <module>.acl.tokens.ts    # DI token constants (Symbol/const)
│   ├── events/
│   │   └── <event>.ts                # Public integration events (if needed)
│   └── index.ts                      # Re-export public contract
├── domain/
│   ├── entities/                     # Domain entities with business logic
│   ├── value-objects/                 # Immutable value objects
│   ├── events/                        # Internal domain events (not exported)
│   ├── repositories/                  # Repository interfaces (ports)
│   └── errors/                        # Domain-specific errors
├── application/
│   ├── commands/
│   │   ├── impl/                      # Command classes
│   │   └── handlers/                  # Command handlers
│   ├── queries/
│   │   ├── impl/                      # Query classes
│   │   └── handlers/                  # Query handlers
│   ├── dto/                           # Application DTOs
│   └── mappers/                       # Application mappers
├── infrastructure/
│   ├── persistence/
│   │   ├── orm-entities/              # Drizzle/ORM models
│   │   ├── repositories/               # Repository implementations
│   │   └── mappers/                    # Persistence mappers
│   ├── acl/                           # ACL implementation (NOT imported by others)
│   └── messaging/                     # Event publishing/subscribing adapters
├── presentation/
│   └── http/
│       ├── controllers/               # HTTP controllers
│       ├── dto/                       # HTTP DTOs
│       └── mappers/                   # Presentation mappers
├── <module>.module.ts                 # NestJS module definition
└── index.ts                           # Local barrel (avoid exporting internals globally)
```

### Example: Health Module

See `src/modules/health/` for a reference implementation.

---

## Layer Responsibilities

### Domain Layer

**Purpose:** Pure business logic, no framework dependencies.

**Contains:**
- **Entities**: Rich domain models with business rules
- **Value Objects**: Immutable, self-validating objects
- **Repository Interfaces**: Ports (interfaces only, no implementations)
- **Domain Events**: Internal events (not shared across modules)
- **Domain Errors**: Business-specific exceptions

**Rules:**
- ✅ Business logic lives here
- ✅ Entities protect invariants (no public setters)
- ✅ Value Objects are immutable
- ❌ No NestJS decorators
- ❌ No ORM annotations
- ❌ No HTTP dependencies

**Example:**
```typescript
// domain/entities/user.entity.ts
export class User {
  private constructor(
    private readonly id: UserId,
    private email: Email,
    private readonly identityId: IdentityId,
  ) {}

  static createNew(email: string, identityId: string): User {
    // Validation and business rules
    return new User(
      UserId.generate(),
      Email.create(email),
      IdentityId.create(identityId),
    );
  }

  changeEmail(newEmail: string): void {
    // Business rule: email must be valid
    this.email = Email.create(newEmail);
  }
}
```

### Application Layer

**Purpose:** Use cases (Commands/Queries), orchestration.

**Contains:**
- **Commands**: Write operations (Create, Update, Delete)
- **Queries**: Read operations (Get, List, Search)
- **Handlers**: Command/Query handlers
- **Application DTOs**: Data transfer objects for application layer
- **Mappers**: Map between Application DTOs and Domain

**Rules:**
- ✅ Every write = Command + Handler
- ✅ Every read = Query + Handler
- ✅ Handlers use repository interfaces (not implementations)
- ✅ Queries return read DTOs (not domain entities)
- ✅ Explicit mapping

**Example:**
```typescript
// application/commands/impl/create-user.command.ts
export class CreateUserCommand {
  constructor(
    public readonly email: string,
    public readonly identityId: string,
  ) {}
}

// application/commands/handlers/create-user.handler.ts
@CommandHandler(CreateUserCommand)
export class CreateUserHandler implements ICommandHandler<CreateUserCommand> {
  constructor(
    private readonly userRepository: IUserRepository,
  ) {}

  async execute(command: CreateUserCommand): Promise<UserDto> {
    const user = User.createNew(command.email, command.identityId);
    await this.userRepository.save(user);
    return UserMapper.toDto(user);
  }
}
```

### Infrastructure Layer

**Purpose:** Technical implementations, external integrations.

**Contains:**
- **ORM Entities**: Database models (Drizzle schemas)
- **Repository Implementations**: Concrete repository implementations
- **Persistence Mappers**: Map Domain ↔ ORM Entity
- **ACL Implementations**: Anti-Corruption Layer services
- **Event Handlers**: Publish/subscribe to events

**Rules:**
- ✅ ORM models isolated in `infrastructure/persistence/orm-entities`
- ✅ Repository implementations map Domain ↔ ORM
- ✅ ACL implementations in `infrastructure/acl`
- ❌ No exports except via `public/` contracts

**Example:**
```typescript
// infrastructure/persistence/repositories/user.repository.ts
@Injectable()
export class UserRepository implements IUserRepository {
  constructor(@Inject(DRIZZLE_DB) private readonly db: DrizzleDb) {}

  async save(user: User): Promise<void> {
    const ormEntity = UserMapper.toOrmEntity(user);
    await this.db.insert(users).values(ormEntity);
  }

  async findById(id: UserId): Promise<User | null> {
    const result = await this.db.select().from(users).where(eq(users.id, id.value));
    return result[0] ? UserMapper.toDomain(result[0]) : null;
  }
}
```

### Presentation Layer

**Purpose:** HTTP endpoints, request/response handling.

**Contains:**
- **Controllers**: HTTP controllers (thin, orchestration only)
- **HTTP DTOs**: Request/Response DTOs
- **Mappers**: Map HTTP DTO ↔ Application DTO

**Rules:**
- ✅ Controllers are thin (orchestration + mapping)
- ✅ Use CommandBus/QueryBus
- ✅ Validation in HTTP DTOs (class-validator)
- ✅ Never return domain entities
- ❌ No business logic

**Example:**
```typescript
// presentation/http/controllers/users.controller.ts
@Controller('users')
export class UsersController {
  constructor(private readonly commandBus: CommandBus) {}

  @Post()
  async create(@Body() dto: CreateUserRequestDto): Promise<CreateUserResponseDto> {
    const command = UserMapper.toCommand(dto);
    const result = await this.commandBus.execute(command);
    return UserMapper.toResponseDto(result);
  }
}
```

---

## CQRS Pattern

### Commands (Writes)

**Purpose:** Change state, perform actions.

**Structure:**
```typescript
// Command
export class CreateUserCommand {
  constructor(
    public readonly email: string,
    public readonly identityId: string,
  ) {}
}

// Handler
@CommandHandler(CreateUserCommand)
export class CreateUserHandler implements ICommandHandler<CreateUserCommand> {
  async execute(command: CreateUserCommand): Promise<UserDto> {
    // 1. Validate intent (light)
    // 2. Load aggregates via repository
    // 3. Call domain methods (business logic)
    // 4. Persist
    // 5. Publish events (if needed)
  }
}
```

### Queries (Reads)

**Purpose:** Retrieve data, no side effects.

**Structure:**
```typescript
// Query
export class GetUserByIdQuery {
  constructor(public readonly userId: string) {}
}

// Handler
@QueryHandler(GetUserByIdQuery)
export class GetUserByIdHandler implements IQueryHandler<GetUserByIdQuery> {
  async execute(query: GetUserByIdQuery): Promise<UserDto> {
    // 1. Load via repository
    // 2. Map to read DTO
    // 3. Return DTO (not domain entity)
  }
}
```

### Controller Usage

```typescript
@Controller('users')
export class UsersController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Post()
  async create(@Body() dto: CreateUserDto) {
    const command = new CreateUserCommand(dto.email, dto.identityId);
    return this.commandBus.execute(command);
  }

  @Get(':id')
  async getById(@Param('id') id: string) {
    const query = new GetUserByIdQuery(id);
    return this.queryBus.execute(query);
  }
}
```

---

## Cross-Module Communication

### Anti-Corruption Layer (ACL)

**Purpose:** Synchronous cross-module communication.

**Pattern:**
1. Define interface in `public/acl/`
2. Implement in `infrastructure/acl/`
3. Export token from module
4. Inject in consuming module

**Example:**

```typescript
// modules/users/public/acl/users.acl.interface.ts
export interface IUsersACL {
  getUserInfo(userId: string): Promise<UserInfoDto>;
}

// modules/users/public/acl/users.acl.tokens.ts
export const USERS_ACL = Symbol('USERS_ACL');

// modules/users/infrastructure/acl/users.acl.service.ts
@Injectable()
export class UsersACLService implements IUsersACL {
  constructor(private readonly queryBus: QueryBus) {}

  async getUserInfo(userId: string): Promise<UserInfoDto> {
    const user = await this.queryBus.execute(new GetUserByIdQuery(userId));
    return UserACLMapper.toInfoDto(user);
  }
}

// modules/users/users.module.ts
@Module({
  providers: [
    {
      provide: USERS_ACL,
      useClass: UsersACLService,
    },
  ],
  exports: [USERS_ACL], // ✅ Export only the token
})
export class UsersModule {}

// modules/job-profiles/application/services/...
@Injectable()
export class CreateJobProfileService {
  constructor(@Inject(USERS_ACL) private readonly usersACL: IUsersACL) {}

  async create(userId: string) {
    const userInfo = await this.usersACL.getUserInfo(userId);
    // Use userInfo (DTO, not domain entity)
  }
}
```

### Public Integration Events

**Purpose:** Asynchronous, decoupled communication.

**Pattern:**
1. Define event in `public/events/`
2. Publish from application/infrastructure boundary
3. Subscribe in consuming module

**Example:**
```typescript
// modules/users/public/events/user-created.event.ts
export class UserCreatedEvent {
  constructor(
    public readonly userId: string,
    public readonly email: string,
  ) {}
}

// modules/users/application/commands/handlers/create-user.handler.ts
@CommandHandler(CreateUserCommand)
export class CreateUserHandler {
  constructor(
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: CreateUserCommand) {
    // ... create user ...
    this.eventBus.publish(new UserCreatedEvent(user.id, user.email));
  }
}
```

---

## Domain-Driven Design

### Entities

**Characteristics:**
- Have identity (ID)
- Protect invariants (business rules)
- Expose methods, not setters
- Rich behavior, not anemic

**Example:**
```typescript
export class Order {
  private constructor(
    private readonly id: OrderId,
    private status: OrderStatus,
    private items: OrderItem[],
  ) {}

  static createNew(items: OrderItem[]): Order {
    if (items.length === 0) {
      throw new Error('Order must have at least one item');
    }
    return new Order(OrderId.generate(), OrderStatus.PENDING, items);
  }

  pay(paymentId: PaymentId): void {
    if (this.status !== OrderStatus.PENDING) {
      throw new Error('Only pending orders can be paid');
    }
    this.status = OrderStatus.PAID;
    // Emit domain event if needed
  }

  // ❌ Don't expose setters
  // setStatus(status: OrderStatus) { ... }
}
```

### Value Objects

**Characteristics:**
- Immutable
- Self-validating
- Equality by value
- No identity

**Example:**
```typescript
export class Email {
  private constructor(private readonly value: string) {
    if (!this.isValid(value)) {
      throw new Error('Invalid email address');
    }
  }

  static create(value: string): Email {
    return new Email(value);
  }

  getValue(): string {
    return this.value;
  }

  equals(other: Email): boolean {
    return this.value === other.value;
  }

  private isValid(email: string): boolean {
    // Validation logic
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }
}
```

### Repository Interfaces (Ports)

**Location:** `domain/repositories/`

**Rules:**
- Define interfaces only (no implementations)
- Use domain entities, not ORM entities
- Return domain objects, not DTOs

**Example:**
```typescript
// domain/repositories/user.repository.interface.ts
export interface IUserRepository {
  save(user: User): Promise<void>;
  findById(id: UserId): Promise<User | null>;
  findByEmail(email: Email): Promise<User | null>;
}
```

### Rehydration Pattern

**Important:** When loading from persistence, use a separate factory that doesn't emit events.

```typescript
export class Order {
  static createNew(items: OrderItem[]): Order {
    const order = new Order(/* ... */);
    // Emit OrderCreatedEvent
    return order;
  }

  static rehydrate(snapshot: OrderSnapshot): Order {
    // No events emitted
    return new Order(
      OrderId.from(snapshot.id),
      OrderStatus.from(snapshot.status),
      snapshot.items.map(OrderItem.rehydrate),
    );
  }
}
```

---

## Development Guidelines

### Creating a New Module

1. **Create directory structure**
   ```bash
   mkdir -p src/modules/<module-name>/{public/acl,domain/{entities,value-objects,repositories,errors},application/{commands/{impl,handlers},queries/{impl,handlers},dto,mappers},infrastructure/{persistence/{orm-entities,repositories,mappers},acl},presentation/http/{controllers,dto,mappers}}
   ```

2. **Start with Domain**
   - Define entities and value objects
   - Define repository interfaces
   - Write unit tests

3. **Implement Application Layer**
   - Create Commands/Queries
   - Implement handlers
   - Create application DTOs and mappers

4. **Implement Infrastructure**
   - Create ORM entities
   - Implement repositories
   - Create persistence mappers

5. **Implement Presentation**
   - Create controllers
   - Create HTTP DTOs
   - Create presentation mappers

6. **Define Public Contract**
   - Create ACL interface (if needed)
   - Export from module

7. **Wire Module**
   - Create `<module>.module.ts`
   - Register providers
   - Export public contracts
   - Import in `AppModule`

### Adding a New Feature

1. **Model the domain** (entity/value object + rules)
2. Add/adjust domain repository interface if needed
3. Implement **Command/Query** + handlers
4. Implement repository in infrastructure + persistence mapper
5. Add/adjust ACL contract if other modules need access
6. Add controller endpoint + HTTP DTO + mapper
7. Tests: domain → application → integration → e2e
8. Update module docs if behavior/contract changed

### TypeScript Path Aliases

Use path aliases for imports:

```typescript
// ✅ Good
import { IUsersACL } from '@modules/users/public';
import { User } from '@modules/users/domain/entities/user.entity';

// ❌ Bad (relative paths)
import { User } from '../../../domain/entities/user.entity';
```

**Configured aliases:**
- `@/*` → `src/*`
- `@modules/*` → `src/modules/*`

---

## Code Examples

### Complete Example: Health Module

See `src/modules/health/` for a complete reference implementation:

- **Query**: `application/queries/impl/get-health.query.ts`
- **Handler**: `application/queries/handlers/get-health.handler.ts`
- **Application DTO**: `application/dto/health.dto.ts`
- **Controller**: `presentation/http/controllers/health.controller.ts`
- **HTTP DTO**: `presentation/http/dto/health-response.dto.ts`
- **Mapper**: `presentation/http/mappers/health.mapper.ts`
- **Module**: `health.module.ts`

### Example: Command Pattern

```typescript
// application/commands/impl/create-order.command.ts
export class CreateOrderCommand {
  constructor(
    public readonly userId: string,
    public readonly items: OrderItemDto[],
  ) {}
}

// application/commands/handlers/create-order.handler.ts
@CommandHandler(CreateOrderCommand)
export class CreateOrderHandler implements ICommandHandler<CreateOrderCommand> {
  constructor(
    private readonly orderRepository: IOrderRepository,
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: CreateOrderCommand): Promise<OrderDto> {
    // 1. Map DTO to domain
    const items = command.items.map(OrderItemMapper.toDomain);
    
    // 2. Create domain entity
    const order = Order.createNew(items);
    
    // 3. Persist
    await this.orderRepository.save(order);
    
    // 4. Map to DTO
    return OrderMapper.toDto(order);
  }
}
```

---

## Common Patterns

### Pattern 1: Command Handler with Validation

```typescript
@CommandHandler(CreateUserCommand)
export class CreateUserHandler {
  async execute(command: CreateUserCommand): Promise<UserDto> {
    // Light validation
    if (!command.email || !command.identityId) {
      throw new BadRequestException('Email and identityId are required');
    }

    // Domain validation happens in entity
    const user = User.createNew(command.email, command.identityId);
    await this.userRepository.save(user);
    return UserMapper.toDto(user);
  }
}
```

### Pattern 2: Query Handler with Read DTO

```typescript
@QueryHandler(GetUserByIdQuery)
export class GetUserByIdHandler {
  async execute(query: GetUserByIdQuery): Promise<UserDto> {
    const user = await this.userRepository.findById(UserId.from(query.userId));
    
    if (!user) {
      throw new NotFoundException('User not found');
    }
    
    // Return DTO, not domain entity
    return UserMapper.toDto(user);
  }
}
```

### Pattern 3: ACL Implementation

```typescript
@Injectable()
export class UsersACLService implements IUsersACL {
  constructor(private readonly queryBus: QueryBus) {}

  async getUserInfo(userId: string): Promise<UserInfoDto> {
    const user = await this.queryBus.execute(new GetUserByIdQuery(userId));
    
    // Return limited DTO (not full domain entity)
    return {
      id: user.id,
      email: user.email,
      // Only expose what's needed
    };
  }
}
```

---

## Best Practices

### ✅ DO

1. **Keep controllers thin**
   - Only orchestration and mapping
   - Delegate to CommandBus/QueryBus

2. **Use explicit mapping**
   - Don't use auto-mappers
   - Create mapper classes for each boundary

3. **Protect domain invariants**
   - Use methods, not setters
   - Validate in domain entities

4. **Return DTOs from queries**
   - Never return domain entities from controllers
   - Use read DTOs optimized for the use case

5. **Use ACL for cross-module calls**
   - Never import domain entities from other modules
   - Always use ACL interface

6. **Write tests at each layer**
   - Unit tests for domain
   - Unit tests for handlers
   - Integration tests for repositories
   - E2E tests for controllers

### ❌ DON'T

1. **Don't import internals**
   ```typescript
   // ❌ Bad
   import { User } from '@modules/users/domain/entities/user.entity';
   ```

2. **Don't return domain entities**
   ```typescript
   // ❌ Bad
   @Get(':id')
   get() {
     return this.queryBus.execute(new GetUserQuery(...)); // Returns User entity
   }
   ```

3. **Don't use setters everywhere**
   ```typescript
   // ❌ Bad
   order.status = 'PAID';
   order.total = 0;
   ```

4. **Don't export repositories**
   ```typescript
   // ❌ Bad
   @Module({
     exports: [USER_REPOSITORY]
   })
   ```

5. **Don't skip DTOs**
   ```typescript
   // ❌ Bad - no DTOs, direct domain usage
   ```

---

## Anti-Patterns to Avoid

### 1. Anemic Domain Model

❌ **Bad:**
```typescript
export class Order {
  status: OrderStatus;
  total: number;
  
  // No behavior, just data
}
```

✅ **Good:**
```typescript
export class Order {
  private status: OrderStatus;
  private total: Money;
  
  pay(paymentId: PaymentId): void {
    // Business logic here
  }
}
```

### 2. Service Layer Anti-Pattern

❌ **Bad:**
```typescript
@Injectable()
export class OrdersService {
  async createOrder(...) { ... }
  async updateOrder(...) { ... }
  async getOrder(...) { ... }
  // Mixes reads and writes, grows without boundaries
}
```

✅ **Good:**
```typescript
// Separate Commands and Queries
@CommandHandler(CreateOrderCommand)
export class CreateOrderHandler { ... }

@QueryHandler(GetOrderQuery)
export class GetOrderHandler { ... }
```

### 3. Direct Cross-Module Repository Access

❌ **Bad:**
```typescript
// In job-profiles module
import { UserRepository } from '@modules/users/infrastructure/...';
```

✅ **Good:**
```typescript
// In job-profiles module
import { IUsersACL } from '@modules/users/public';
```

### 4. Framework Dependencies in Domain

❌ **Bad:**
```typescript
import { Injectable } from '@nestjs/common';

@Injectable()
export class User {
  // Domain entity with framework decorator
}
```

✅ **Good:**
```typescript
export class User {
  // Pure TypeScript class, no decorators
}
```

---

## Testing Strategy

### Domain Tests
- Test business rules
- Test invariants
- Test value object validation

### Application Tests
- Test command handlers
- Test query handlers
- Mock repositories

### Infrastructure Tests
- Test repository implementations
- Test mappers
- Integration tests with database

### Presentation Tests
- Test controllers
- Test HTTP DTOs
- E2E tests

---

## Module Checklist

Before committing a module, verify:

### Domain
- [ ] Business logic in domain methods
- [ ] Value Objects immutable + self-validating
- [ ] Repository interface defined
- [ ] No NestJS/ORM/HTTP imports
- [ ] Unit tests for domain rules

### Application
- [ ] Each write = Command + Handler
- [ ] Each read = Query + Handler
- [ ] Handlers use repository interfaces
- [ ] Query returns read DTO
- [ ] Mapping is explicit

### Infrastructure
- [ ] ORM models isolated
- [ ] Repository implementation maps to/from domain
- [ ] No exports except `public/` contracts

### Presentation
- [ ] Request/response DTOs exist
- [ ] Validation at the edge
- [ ] Controllers remain thin

### Cross-Module
- [ ] Only imports from `@modules/<module>/public`
- [ ] ACL returns DTOs (no entities)
- [ ] Public events used where needed

---

## References

- **Refactoring Plan**: `docs/project/mentor-refactoring-plan.md`
- **Architecture Guidelines**: Based on `agents.md` principles
- **Example Module**: `src/modules/health/` (reference implementation)

---

**Remember:** Consistency over cleverness. Follow the established patterns.

---
