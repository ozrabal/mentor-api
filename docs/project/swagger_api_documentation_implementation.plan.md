---
name: Swagger API Documentation Implementation
overview: Implement Swagger/OpenAPI documentation for the NestJS Mentor API, including setup, decorators for existing controllers/DTOs, and configuration aligned with the Clean Architecture pattern.
todos:
  - id: install-swagger
    content: Install @nestjs/swagger package via npm
    status: pending
  - id: configure-main
    content: Configure Swagger in main.ts with DocumentBuilder, environment checks, and mount at /api/docs
    status: pending
  - id: document-health-controller
    content: Add Swagger decorators (@ApiTags, @ApiOperation, @ApiResponse) to health.controller.ts
    status: pending
  - id: document-health-dto
    content: Add @ApiProperty decorators to health-response.dto.ts with examples
    status: pending
  - id: test-swagger
    content: Verify Swagger UI accessibility and documentation accuracy
    status: pending
---

# Swagger API Documentation Implementation Plan

## Overview

This plan implements Swagger/OpenAPI documentation for the Mentor API using `@nestjs/swagger`. The implementation will integrate seamlessly with the existing Clean Architecture, CQRS pattern, and DDD principles.

## Current State

- **Framework**: NestJS with Express
- **Architecture**: Clean Architecture with CQRS
- **Current Endpoints**: `/health` (GET)
- **Planned Endpoints**: Auth, Job Profiles, Interviews, Reports (from PRD)
- **Validation**: class-validator already in use
- **Path Aliases**: `@/*` and `@modules/*` configured

## Implementation Steps

### 1. Install Dependencies

Add `@nestjs/swagger` to the project:

```bash
npm install --save @nestjs/swagger
```

### 2. Configure Swagger in Main Application

**File**: `src/main.ts`

- Import `SwaggerModule` and `DocumentBuilder` from `@nestjs/swagger`
- Create Swagger document configuration with:
  - API title: "Mentor API"
  - Description: Based on PRD requirements
  - Version: "1.0.0"
  - Server URL: Environment-based (default localhost:3000)
  - Tags: Organize endpoints by module (health, auth, job-profiles, interviews, reports)
  - Bearer token authentication scheme for JWT
- Initialize Swagger only in non-production environments (check NODE_ENV)
- Mount Swagger UI at `/api/docs` endpoint
- Mount JSON spec at `/api/docs-json`

**Configuration Details**:

- Use `ConfigService` to get environment variables
- Add JWT Bearer auth configuration for protected endpoints
- Set up proper CORS if needed for Swagger UI

### 3. Document Health Module

**File**: `src/modules/health/presentation/http/controllers/health.controller.ts`

- Add `@ApiTags('health')` decorator to controller
- Add `@ApiOperation()` with description for GET endpoint
- Add `@ApiResponse()` decorators for:
  - 200: Success response with schema
  - 500: Error response (if applicable)

**File**: `src/modules/health/presentation/http/dto/health-response.dto.ts`

- Add `@ApiProperty()` decorators to all properties:
  - `status`: string, example: "ok"
  - `timestamp`: string (ISO 8601), example: "2026-01-15T10:30:00.000Z"
- Add `@ApiPropertyOptional()` if any optional fields exist
- Consider adding class description with `@ApiProperty()` on the class

### 4. Create Swagger Configuration Module (Optional)

**File**: `src/config/swagger.config.ts` (new file)

- Extract Swagger configuration logic from `main.ts`
- Create a function that returns `DocumentBuilder` configuration
- Makes it easier to maintain and test

### 5. Environment-Based Configuration

- Only enable Swagger in development/staging environments
- Use `ConfigService` to check `NODE_ENV` or `ENABLE_SWAGGER` flag
- In production, Swagger endpoints should return 404 or be disabled

### 6. Authentication Documentation

Prepare for future auth endpoints:

- Configure Bearer token authentication in Swagger setup
- Create reusable decorator `@ApiBearerAuth()` for protected endpoints
- Document JWT token format and how to obtain it

### 7. Documentation Standards

**For Controllers**:

- Use `@ApiTags()` to group endpoints by module
- Use `@ApiOperation()` for endpoint descriptions
- Use `@ApiResponse()` for all possible HTTP status codes
- Use `@ApiParam()` for path parameters
- Use `@ApiQuery()` for query parameters
- Use `@ApiBody()` for request bodies (if needed, class-validator DTOs usually auto-detect)

**For DTOs**:

- Use `@ApiProperty()` for required fields
- Use `@ApiPropertyOptional()` for optional fields
- Provide `example` values for better documentation
- Use `description` for field documentation
- Consider `enum` for constrained values
- Use `@ApiProperty({ type: [OtherDto] })` for arrays

### 8. Future Module Preparation

When implementing new modules (auth, job-profiles, etc.):

- Follow the same pattern established in health module
- Use appropriate tags for each module
- Document all request/response DTOs
- Include authentication requirements where applicable

## Files to Modify

1. **package.json**: Add `@nestjs/swagger` dependency
2. **src/main.ts**: Add Swagger initialization and configuration
3. **src/modules/health/presentation/http/controllers/health.controller.ts**: Add Swagger decorators
4. **src/modules/health/presentation/http/dto/health-response.dto.ts**: Add Swagger decorators

## Files to Create (Optional)

1. **src/config/swagger.config.ts**: Extract Swagger configuration (optional, for better organization)

## Configuration Example

```typescript
// main.ts snippet
const config = new DocumentBuilder()
  .setTitle('Mentor API')
  .setDescription('API for mentor interview preparation platform')
  .setVersion('1.0.0')
  .addServer('http://localhost:3000', 'Development')
  .addBearerAuth(
    {
      type: 'http',
      scheme: 'bearer',
      bearerFormat: 'JWT',
      name: 'JWT',
      description: 'Enter JWT token',
      in: 'header',
    },
    'JWT-auth',
  )
  .addTag('health', 'Health check endpoints')
  .addTag('auth', 'Authentication endpoints')
  .addTag('job-profiles', 'Job profile management')
  .addTag('interviews', 'Interview session management')
  .addTag('reports', 'Interview reports')
  .build();
```

## Testing

- Verify Swagger UI is accessible at `/api/docs`
- Verify JSON spec is accessible at `/api/docs-json`
- Test that all documented endpoints show correct schemas
- Verify environment-based enabling/disabling works
- Test with future authentication endpoints

## Notes

- Swagger decorators work seamlessly with class-validator decorators
- The existing DTO structure aligns well with Swagger documentation
- No changes needed to CQRS handlers or domain layer
- Documentation stays at the presentation layer (controllers and HTTP DTOs)
- Follows the existing architecture principles (no framework dependencies in domain)

## Future Enhancements

- Add request/response examples
- Add error response schemas
- Document authentication flow
- Add API versioning documentation
- Consider OpenAPI 3.1 features (webhooks, etc.)