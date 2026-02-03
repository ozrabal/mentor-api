# Job Profiles Soft-Delete Compliance Plan (Iterative)

**Module:** `job-profiles`
**Scope:** Soft-delete pattern compliance
**Date:** 2026-02-02
**Status:** Draft

---

## Goals

- Align `job-profiles` with `docs/patterns/soft-delete-pattern.md`.
- Preserve CQRS + modular monolith architecture.
- Keep endpoints functional after each step.

## Non-Goals

- Broader refactors outside `job-profiles`.
- Changing unrelated module behavior.

---

## Step 1: Restore Flow (Command + Handler)

**Outcome:** Restore is supported at the application layer and follows domain rules.

### 1.1 Command

**Create:** `src/modules/job-profiles/application/commands/impl/restore-job-profile.command.ts`

```ts
export class RestoreJobProfileCommand {
  constructor(
    public readonly userId: string,
    public readonly jobProfileId: string,
  ) {}
}
```

### 1.2 Handler

**Create:** `src/modules/job-profiles/application/commands/handlers/restore-job-profile.handler.ts`

Behavior per pattern:

- Load profile including deleted (`findById(id, true)`)
- 404 if not found
- 400 if not deleted
- 403 if not owner
- Call `profile.restore()`
- Persist with `repository.restore(id)`

### 1.3 Module Registration

**Update:** `src/modules/job-profiles/job-profiles.module.ts`

Add `RestoreJobProfileHandler` to `CommandHandlers` array.

### 1.4 Unit Test (Optional in this step)

If tests exist for commands, add a minimal handler spec in:
`src/modules/job-profiles/application/commands/handlers/restore-job-profile.handler.spec.ts`

---

## Step 2: Restore HTTP Endpoint

**Outcome:** Public API for restoring profiles, consistent with existing controller patterns.

### 2.1 Controller

**Update:** `src/modules/job-profiles/presentation/http/controllers/job-profiles.controller.ts`

Add:

- `POST /api/v1/job-profiles/:jobProfileId/restore`
- Auth guard already present
- Swagger annotations consistent with other endpoints

Use:

```ts
const command = new RestoreJobProfileCommand(user.id, jobProfileId);
await this.commandBus.execute(command);
```

### 2.2 DTOs

No DTOs needed (no body), return `void` with `200` or `204` depending on convention used in module.

---

## Step 3: Soft-Delete Handler Alignment

**Outcome:** Domain rules are enforced consistently with the pattern.

### 3.1 Update Handler

**Update:** `src/modules/job-profiles/application/commands/handlers/soft-delete-job-profile.handler.ts`

Change flow:

- Load profile (already done)
- Call `profile.softDelete()` to enforce domain rules
- Persist via `repository.softDelete(id)`

### 3.2 Tests

Update existing spec to expect domain method validation effects if required.

---

## Step 4: Persistence & Performance Enhancements

**Outcome:** Database behavior aligned with soft-delete best practices.

### 4.1 Partial Index

**Update:** `src/database/schema.ts`

Add partial index on `job_profiles` for `user_id` where `deleted_at IS NULL`.
Use Drizzle `index` with `where` clause (or add raw SQL migration if this codebase uses migrations). Match existing DB workflow.

### 4.2 Verify Repository Defaults

Confirm `findById`, `findByUserId`, `search`, and `count` exclude deleted by default; ensure no regressions.

---

## Step 5: Documentation Alignment

**Outcome:** Module docs reflect the implemented behavior.

- Update `src/modules/job-profiles/README.md` to include restore endpoint and behavior.
- Ensure examples mention restore flow and HTTP status codes.

---

## Acceptance Criteria

- Restore command + handler available and registered.
- `POST /job-profiles/:id/restore` works and enforces ownership + deleted state.
- Soft-delete handler invokes domain `softDelete()`.
- Active queries exclude deleted records by default.
- Index added (or documented with migration if schema-managed elsewhere).
- Documentation updated to reflect new endpoint and behavior.

---

## Verification Checklist

- `POST /job-profiles/:id/restore` returns 404 for non-existent, 400 for not-deleted, 403 for other user.
- `DELETE /job-profiles/:id` returns 404 if already deleted.
- `GET /job-profiles/:id` returns 404 for deleted profiles.
- Search/list endpoints exclude deleted profiles.
