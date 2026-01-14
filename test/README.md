# Testing Guide for Mentor API

This document provides comprehensive guidance on testing the Mentor API modular monolith application.

## Overview

The testing strategy follows the application's modular monolith architecture with CQRS pattern. Tests are organized by layer and provide coverage for:

- **Domain Layer**: Business logic and rules
- **Application Layer**: Commands, queries, and handlers  
- **Infrastructure Layer**: Repository implementations and database integration
- **Presentation Layer**: Controllers and HTTP endpoints
- **E2E**: Full request-response cycles

## Test Structure

```
test/
├── setup/                    # Global test configuration
│   ├── unit-setup.ts         # Unit test setup
│   └── e2e-setup.ts          # E2E test setup  
├── database/                 # Database testing utilities
│   ├── database-test-utils.ts
│   ├── test-data-factory.ts
│   └── test-database.module.ts
├── utils/                    # Testing utilities
│   ├── cqrs-testing.utils.ts
│   ├── repository-mock.utils.ts
│   ├── e2e-app-factory.ts
│   ├── e2e-test.utils.ts
│   ├── test-matchers.ts
│   └── index.ts
├── *.e2e-spec.ts            # E2E tests
└── sample-integration.spec.ts
```

## Running Tests

### Unit Tests
```bash
npm test                     # Run all unit tests
npm test -- --watch         # Run tests in watch mode  
npm test -- --coverage      # Run tests with coverage report
npm test -- health          # Run tests matching "health"
```

### E2E Tests
```bash
npm run test:e2e            # Run all e2e tests
npm run test:e2e -- health  # Run specific e2e test
```

### Test Environment Setup

1. Copy environment configuration:
```bash
cp .env.test.example .env.test
```

2. Set up test database (Docker):
```bash
npm run docker:up
# Create test database
psql $DATABASE_URL -c "CREATE DATABASE mentor_test_db;"
```

3. Run database migrations for test database:
```bash
TEST_DATABASE_URL="postgresql://postgres:postgres@localhost:5432/mentor_test_db" npm run db:push
```

## Writing Tests

### Unit Tests

Unit tests are co-located with source files using `.spec.ts` extension.

#### Testing Domain Entities
```typescript
// user.entity.spec.ts
describe('User', () => {
  it('should create user with valid data', () => {
    const user = User.createNew('test@example.com', 'identity-123');
    expect(user.email).toBe('test@example.com');
  });
});
```

#### Testing Application Handlers
```typescript
// create-user.handler.spec.ts
describe('CreateUserHandler', () => {
  let handler: CreateUserHandler;
  let mockRepository: MockRepository<User>;

  beforeEach(() => {
    mockRepository = createMockRepository<User>();
    handler = new CreateUserHandler(mockRepository);
  });

  it('should create user successfully', async () => {
    // Test implementation
  });
});
```

#### Testing Controllers  
```typescript
// users.controller.spec.ts
describe('UsersController', () => {
  let controller: UsersController;
  let mockCommandBus: MockCommandBus;

  beforeEach(async () => {
    const testSetup = await ControllerTestHelper.createTestingModule(
      UsersController,
      { commandBus: true }
    );
    
    controller = testSetup.controller;
    mockCommandBus = testSetup.commandBus!;
  });
});
```

### Integration Tests

Integration tests verify components working together, especially with database.

```typescript
// user-repository.integration.spec.ts
describe('UserRepository (Integration)', () => {
  let repository: UserRepository;
  let db: TestDatabase;
  let testId: string;

  beforeEach(async () => {
    testId = `test-${Date.now()}`;
    db = await DatabaseTestUtils.getTestTransaction(testId);
  });

  afterEach(async () => {
    await DatabaseTestUtils.rollbackTestTransaction(testId);
  });
});
```

### E2E Tests

E2E tests verify complete HTTP request-response cycles.

```typescript
// users.e2e-spec.ts
describe('Users (e2e)', () => {
  let app: INestApplication;
  let apiClient: ApiTestClient;

  beforeAll(async () => {
    app = await E2ETestAppFactory.createWithDatabase({
      imports: [UsersModule],
    });
    apiClient = new ApiTestClient(app);
  });

  it('should create user via POST /users', async () => {
    const response = await apiClient.post('/users', {
      email: 'test@example.com',
      name: 'Test User',
    });

    ResponseValidator.expectSuccess(response, 201);
  });
});
```

## Testing Utilities

### CQRS Testing
- `createMockCommandBus()` - Mock command bus
- `createMockQueryBus()` - Mock query bus  
- `CQRSTestingModuleBuilder` - Fluent test module builder
- `CommandHandlerTestBase` - Base class for command handler tests
- `QueryHandlerTestBase` - Base class for query handler tests

### Repository Testing
- `createMockRepository<T>()` - Create repository mocks
- `RepositoryTestHelper<T>` - Repository testing utilities

### Database Testing  
- `DatabaseTestUtils` - Database connection and transaction management
- `UserFactory`, `JobProfileFactory` - Test data factories
- `TestDatabaseModule` - Test database module

### E2E Testing
- `E2ETestAppFactory` - Application factory for e2e tests
- `ApiTestClient` - HTTP client wrapper  
- `ResponseValidator` - Response validation utilities

### Custom Matchers
- `toBeValidUUID()` - Validate UUID format
- `toBeRecentTimestamp()` - Validate recent timestamps
- `toHaveRequiredProperties()` - Validate object properties
- `toBeISOString()` - Validate ISO date strings

## Best Practices

### General
- One assertion per test when possible
- Use descriptive test names: "should [expected behavior] when [condition]"
- Follow AAA pattern: Arrange, Act, Assert
- Use test data factories instead of hardcoded values

### Unit Tests  
- Test business logic in domain entities
- Mock external dependencies
- Focus on single units of behavior
- Test edge cases and error conditions

### Integration Tests
- Use database transactions for isolation
- Test repository implementations with real database
- Verify mapping between layers
- Test cross-module interactions via ACL

### E2E Tests
- Test complete user workflows
- Use realistic test data
- Test error scenarios (400, 404, 500)
- Keep tests independent and idempotent

### Performance
- Use `maxWorkers: 1` for e2e tests to avoid database conflicts
- Clean up test data properly
- Use `beforeAll/afterAll` for expensive setup
- Mock external services in unit tests

## Common Patterns

### Testing Domain Rules
```typescript
it('should throw error when email is invalid', () => {
  expect(() => User.createNew('invalid-email', 'id')).toThrow();
});
```

### Testing Command Handlers
```typescript
it('should save user and return dto', async () => {
  // Arrange
  mockRepository.save.mockResolvedValue();
  const command = new CreateUserCommand('test@example.com', 'id');
  
  // Act
  const result = await handler.execute(command);
  
  // Assert
  expect(mockRepository.save).toHaveBeenCalled();
  expect(result).toBeInstanceOf(UserDto);
});
```

### Testing API Endpoints
```typescript
it('should return 400 for invalid request', async () => {
  const response = await apiClient.post('/users', { invalidData: true });
  ResponseValidator.expectError(response, 400);
});
```

## Coverage Targets

- **Domain**: 90%+ (critical business logic)
- **Application**: 80%+ (handlers and use cases)
- **Infrastructure**: 70%+ (repository implementations)  
- **Presentation**: 70%+ (controllers and mappers)
- **Overall**: 80%+

## Troubleshooting

### Common Issues

1. **Database connection errors**: Ensure test database is running and environment variables are set
2. **Transaction conflicts**: Use `maxWorkers: 1` for e2e tests
3. **Memory leaks**: Close applications and database connections in `afterAll`
4. **Timeout errors**: Increase `testTimeout` for slow operations

### Debugging
```bash
# Run with debug output
TEST_DEBUG=true npm test

# Run single test file
npm test -- user.spec.ts

# Run tests in watch mode with coverage
npm test -- --watch --coverage
```