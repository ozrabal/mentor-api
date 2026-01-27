# Iterative Endpoint Implementation Methodology

**Version:** 1.0
**Last Updated:** 2026-01-27
**Status:** Active

---

## Overview

All new endpoints in the MENTOR API MUST follow an **iterative and incremental** implementation approach. This methodology prioritizes having a **working endpoint from the start** that returns responses after each step, even if they're placeholder responses initially.

This is a **MANDATORY** rule for all endpoint implementations. No exceptions unless explicitly approved.

---

## Core Principles

### 1. Endpoint First (Vertical Slices)

✅ **DO**: Create the HTTP endpoint in Step 1 so it can be invoked immediately
❌ **DON'T**: Build layers in isolation (waterfall approach)

### 2. Incremental Enhancement

✅ **DO**: Each step adds real functionality while maintaining a working endpoint
❌ **DON'T**: Wait until all layers are complete before testing

### 3. Continuous Testing

✅ **DO**: Test the endpoint after every step
❌ **DON'T**: Save testing for the end

### 4. Minimal Viable Slices

✅ **DO**: Each step delivers a complete vertical slice through all layers
❌ **DON'T**: Complete entire layers before moving to the next

---

## Implementation Order (Vertical Slices)

### ❌ WRONG: Waterfall Approach

```txt
1. Domain entities
2. Repository interfaces
3. Repository implementations
4. Application DTOs
5. Application handlers
6. Presentation DTOs
7. Controller
8. Tests
```

**Problems:**

- Can't test until step 7
- Integration issues discovered late
- Hard to debug across many changes
- No working functionality until the end

### ✅ CORRECT: Iterative Approach

```txt
1. Endpoint → Placeholder → Test
2. Repository → Real Data → Test
3. Documentation → Complete API → Test
4. Tests → Production Ready → Ship
```

**Benefits:**

- Test immediately after step 1
- Working functionality after each step
- Early integration validation
- Easy to debug (small changes)
- Clear progress indicators

---

## Standard 4-Step Implementation Pattern

All endpoints MUST follow this exact pattern:

### Step 1: Basic Endpoint Structure (Placeholder)

**Goal:** Working endpoint with mock data

**What to create:**

1. HTTP DTO (request/response)
2. Application Query/Command
3. Handler with placeholder logic
4. Controller method
5. Register in module

**Expected State:**

- ✅ Endpoint responds with 200
- ✅ Returns placeholder/mock data
- ✅ Authentication works
- ✅ Validation works
- ✅ Can test with curl/Postman

**Verification:**

```bash
npm run dev
curl -X GET http://localhost:3000/api/v1/endpoint \
  -H "Authorization: Bearer TOKEN"
# Should return 200 with placeholder data
```

### Step 2: Real Implementation (Repository/Business Logic)

**Goal:** Replace placeholder with actual functionality

**What to add:**

1. Repository injection
2. Real database queries
3. Business logic/authorization
4. Error handling (404, 403, etc.)
5. Domain entity mapping

**Expected State:**

- ✅ Returns real data from database
- ✅ Proper error codes (404, 403, 500)
- ✅ Authorization enforced
- ✅ Business rules applied

**Verification:**

```bash
# Test with real data
curl -X GET http://localhost:3000/api/v1/endpoint/REAL_ID \
  -H "Authorization: Bearer TOKEN"

# Test error cases
curl -X GET http://localhost:3000/api/v1/endpoint/invalid-id  # 404
curl -X GET http://localhost:3000/api/v1/endpoint/other-user-id  # 403
```

### Step 3: Documentation (Swagger/OpenAPI)

**Goal:** Complete API documentation

**What to add:**

1. Swagger decorators (`@ApiOperation`, `@ApiResponse`)
2. DTO decorators (`@ApiProperty`)
3. Example values
4. Error response documentation
5. Request/response schemas

**Expected State:**

- ✅ Full Swagger documentation
- ✅ All fields documented with examples
- ✅ All status codes documented
- ✅ Visible in Swagger UI

**Verification:**

```bash
npm run dev
open http://localhost:3000/api
# Verify endpoint is fully documented
```

### Step 4: Tests + Final Documentation

**Goal:** Production ready

**What to add:**

1. Handler unit tests
2. Controller unit tests
3. E2E tests (if needed)
4. README updates
5. Example curl commands

**Expected State:**

- ✅ All tests passing
- ✅ Code coverage > 80%
- ✅ README updated
- ✅ **PRODUCTION READY**

**Verification:**

```bash
npm test
npm run test:cov
npm run lint
npm run build
```

---

## Template: Implementation Plan Structure

When creating a new implementation plan, use this structure:

```markdown
# FR-XXX-NNN: [Feature Name] - Iterative Implementation Plan

**Module:** `module-name`
**Feature:** Feature Name
**Version:** 1.0 (Iterative)
**Date:** YYYY-MM-DD
**Status:** Ready for Implementation

---

## Quick Start Guide

### Key Files to Create/Modify
1. **Application**: path/to/query-or-command.ts
2. **Application**: path/to/handler.ts
3. **Presentation**: path/to/dto.ts
4. **Presentation**: Update controller
5. **Module**: Update module

### Implementation Strategy
Follow steps 1-4 sequentially. After each step, the endpoint should work and return a response.

---

## Overview

[Brief description of the feature and iterative approach]

### Key Principles
1. **Endpoint First**: Create working endpoint in Step 1
2. **Incremental Enhancement**: Each step adds functionality
3. **Continuous Testing**: Test after every step
4. **Minimal Viable Slices**: Complete vertical slices

---

## Implementation Steps Overview

| Step | What Gets Added | Endpoint Returns |
| ---- | --------------- | ---------------- |
| 1 | Basic endpoint structure + placeholder | Mock/placeholder data |
| 2 | Repository + business logic | Real data from DB |
| 3 | Swagger documentation | Fully documented API |
| 4 | Tests + documentation | Production ready |

---

## Step 1: Basic Endpoint Structure
[Detailed implementation...]

## Step 2: Real Implementation
[Detailed implementation...]

## Step 3: Documentation
[Detailed implementation...]

## Step 4: Tests + Final Documentation
[Detailed implementation...]

---

## Summary

[Summary table and verification checklist]
```

---

## Examples

### ✅ Good Examples

- `docs/modules/job-profiles-parse-implementation-plan-iterative.md`
- `docs/modules/job-profiles-get-implementation-plan-iterative.md`

### ❌ Bad Examples (Do Not Follow)

- `docs/modules/job-profiles-parse-implementation-plan.md` (original waterfall)
- `docs/modules/job-profiles-get-implementation-plan.md` (original waterfall)

---

## Common Patterns by HTTP Method

### GET Endpoints (Read)

**Step 1**: Placeholder query handler

```typescript
@QueryHandler(GetSomethingQuery)
export class GetSomethingHandler {
  async execute(query: GetSomethingQuery): Promise<SomethingDto> {
    // TODO: Placeholder data
    return {
      id: query.id,
      name: 'Placeholder',
      // ...
    };
  }
}
```

**Step 2**: Real repository query

```typescript
@QueryHandler(GetSomethingQuery)
export class GetSomethingHandler {
  constructor(
    @Inject(REPOSITORY_TOKEN)
    private readonly repository: IRepository,
  ) {}

  async execute(query: GetSomethingQuery): Promise<SomethingDto> {
    const entity = await this.repository.findById(query.id);
    if (!entity) throw new NotFoundException();
    if (entity.ownerId !== query.userId) throw new ForbiddenException();
    return Mapper.toDto(entity);
  }
}
```

### POST Endpoints (Create)

**Step 1**: Placeholder command handler

```typescript
@CommandHandler(CreateSomethingCommand)
export class CreateSomethingHandler {
  async execute(command: CreateSomethingCommand): Promise<SomethingDto> {
    // TODO: Placeholder
    return {
      id: crypto.randomUUID(),
      name: command.name,
      createdAt: new Date(),
    };
  }
}
```

**Step 2**: Real domain entity creation

```typescript
@CommandHandler(CreateSomethingCommand)
export class CreateSomethingHandler {
  constructor(
    @Inject(REPOSITORY_TOKEN)
    private readonly repository: IRepository,
  ) {}

  async execute(command: CreateSomethingCommand): Promise<SomethingDto> {
    const entity = Something.createNew({
      name: command.name,
      userId: UserId.create(command.userId),
    });
    await this.repository.save(entity);
    return Mapper.toDto(entity);
  }
}
```

### PUT/PATCH Endpoints (Update)

**Step 1**: Placeholder update

```typescript
@CommandHandler(UpdateSomethingCommand)
export class UpdateSomethingHandler {
  async execute(command: UpdateSomethingCommand): Promise<SomethingDto> {
    // TODO: Placeholder
    return {
      id: command.id,
      name: command.name,
      updatedAt: new Date(),
    };
  }
}
```

**Step 2**: Real update with authorization

```typescript
@CommandHandler(UpdateSomethingCommand)
export class UpdateSomethingHandler {
  constructor(
    @Inject(REPOSITORY_TOKEN)
    private readonly repository: IRepository,
  ) {}

  async execute(command: UpdateSomethingCommand): Promise<SomethingDto> {
    const entity = await this.repository.findById(command.id);
    if (!entity) throw new NotFoundException();
    if (entity.ownerId !== command.userId) throw new ForbiddenException();

    entity.update(command.name);
    await this.repository.save(entity);
    return Mapper.toDto(entity);
  }
}
```

### DELETE Endpoints (Delete)

**Step 1**: Placeholder delete

```typescript
@CommandHandler(DeleteSomethingCommand)
export class DeleteSomethingHandler {
  async execute(command: DeleteSomethingCommand): Promise<void> {
    // TODO: Placeholder - just log
    console.log(`Would delete ${command.id}`);
  }
}
```

**Step 2**: Real soft delete with authorization

```typescript
@CommandHandler(DeleteSomethingCommand)
export class DeleteSomethingHandler {
  constructor(
    @Inject(REPOSITORY_TOKEN)
    private readonly repository: IRepository,
  ) {}

  async execute(command: DeleteSomethingCommand): Promise<void> {
    const entity = await this.repository.findById(command.id);
    if (!entity) throw new NotFoundException();
    if (entity.ownerId !== command.userId) throw new ForbiddenException();

    entity.softDelete();
    await this.repository.save(entity);
  }
}
```

---

## Checklist for Each Step

### Step 1 Checklist

- [ ] HTTP DTO created
- [ ] Application Query/Command created
- [ ] Handler created with placeholder logic
- [ ] Controller method added
- [ ] Handler registered in module
- [ ] Endpoint returns 200 with placeholder data
- [ ] Authentication works
- [ ] Validation works
- [ ] `npm run build` succeeds
- [ ] Can test with curl

### Step 2 Checklist

- [ ] Repository injected into handler
- [ ] Real database query implemented
- [ ] Authorization checks added
- [ ] Error handling implemented (404, 403)
- [ ] Business rules enforced
- [ ] Domain entities mapped correctly
- [ ] Returns real data from database
- [ ] All error cases tested
- [ ] `npm run build` succeeds

### Step 3 Checklist

- [ ] `@ApiOperation` added to controller
- [ ] `@ApiResponse` for success added
- [ ] `@ApiResponse` for errors added (401, 403, 404, 500)
- [ ] `@ApiProperty` on all DTO fields
- [ ] Example values provided
- [ ] Swagger UI shows complete documentation
- [ ] `npm run build` succeeds

### Step 4 Checklist

- [ ] Handler unit tests created
- [ ] Controller unit tests created
- [ ] E2E tests created (if needed)
- [ ] All tests passing (`npm test`)
- [ ] Code coverage > 80% (`npm run test:cov`)
- [ ] Linter passes (`npm run lint`)
- [ ] Build succeeds (`npm run build`)
- [ ] README updated with new endpoint
- [ ] Example curl commands added
- [ ] **PRODUCTION READY** ✅

---

## Anti-Patterns to Avoid

### ❌ Don't: Build Entire Layers First

```txt
1. Create all domain entities
2. Create all repositories
3. Create all handlers
4. Create all controllers
5. Test everything
```

**Problem:** Can't test until step 5, late integration issues

### ❌ Don't: Skip Placeholder Step

```txt
1. Create handler with full implementation
2. Add controller
3. Test
```

**Problem:** Too many changes at once, hard to debug

### ❌ Don't: Skip Testing Between Steps

```txt
1. Create endpoint
2. Add repository
3. Add documentation
4. Test everything at the end
```

**Problem:** Don't know which step broke if tests fail

### ❌ Don't: Mix Multiple Features

```txt
1. Create GET and POST endpoints together
2. Implement both
3. Test both
```

**Problem:** Too complex, unclear what broke if tests fail

### ✅ Do: One Endpoint at a Time

```txt
1. GET endpoint (steps 1-4)
2. POST endpoint (steps 1-4)
3. PUT endpoint (steps 1-4)
```

**Benefit:** Clear progress, easy debugging

---

## When to Deviate

This methodology is **MANDATORY** for all new endpoints. However, you may deviate ONLY in these cases:

1. **Trivial endpoints** - If endpoint is truly trivial (e.g., health check), steps 1-2 can be combined
2. **Urgent hotfixes** - For critical production bugs, documentation/tests can be added after
3. **Experimental features** - For POC/prototype work (but must follow before production)

**Important:** Deviation requires explicit approval in PR description with justification.

---

## Enforcement

1. **PR Reviews**: All PRs MUST reference the implementation plan
2. **CI/CD**: Automated checks verify step completion
3. **Documentation**: Each step must have verification section
4. **Testing**: Tests required at step 4 before merge

---

## References

- **Architecture**: `docs/architecture.md`
- **CQRS Pattern**: See architecture.md section on CQRS
- **Example Plans**:
  - Parse Job Description: `docs/modules/job-profiles-parse-implementation-plan-iterative.md`
  - Get Job Profile: `docs/modules/job-profiles-get-implementation-plan-iterative.md`

---

**Remember:**

- Endpoint First ✅
- Vertical Slices ✅
- Test After Each Step ✅
- Never Waterfall ❌

---

**Rule Status:** ✅ Active and Mandatory
**Last Updated:** 2026-01-27
**Applies To:** All new endpoint implementations
