# Iterative Implementation - Quick Reference Card

## The 4-Step Pattern (MANDATORY)

```text
┌─────────────────────────────────────────────────────────────┐
│ Step 1: ENDPOINT FIRST (Placeholder)                        │
├─────────────────────────────────────────────────────────────┤
│ ✅ Create HTTP endpoint with mock data                      │
│ ✅ Test immediately: curl → 200 OK                          │
│ ✅ Auth works, validation works                             │
│ Time: ~30 minutes                                           │
└─────────────────────────────────────────────────────────────┘
         ↓
┌─────────────────────────────────────────────────────────────┐
│ Step 2: REPOSITORY (Real Data)                              │
├─────────────────────────────────────────────────────────────┤
│ ✅ Inject repository, query database                        │
│ ✅ Add authorization (404, 403)                             │
│ ✅ Business logic, domain entities                          │
│ Time: ~1 hour                                               │
└─────────────────────────────────────────────────────────────┘
         ↓
┌─────────────────────────────────────────────────────────────┐
│ Step 3: DOCUMENTATION (Swagger)                             │
├─────────────────────────────────────────────────────────────┤
│ ✅ Add @ApiOperation, @ApiResponse                          │
│ ✅ Document all fields with examples                        │
│ ✅ Visible in Swagger UI                                    │
│ Time: ~30 minutes                                           │
└─────────────────────────────────────────────────────────────┘
         ↓
┌─────────────────────────────────────────────────────────────┐
│ Step 4: TESTS (Production Ready)                            │
├─────────────────────────────────────────────────────────────┤
│ ✅ Unit tests, E2E tests                                    │
│ ✅ README updates                                           │
│ ✅ PRODUCTION READY 🚀                                      │
│ Time: ~1-2 hours                                            │
└─────────────────────────────────────────────────────────────┘
```

## Why This Works

| Traditional (Waterfall) | Iterative (Vertical Slices) |
| ------------------------ | ------------------------------ |
| ❌ Test at the end | ✅ Test after each step |
| ❌ Late integration issues | ✅ Early integration validation |
| ❌ Hard to debug | ✅ Easy to debug (small changes) |
| ❌ No progress until done | ✅ Working feature per step |
| ❌ 2-3 days | ✅ 3-4 hours |

## Quick Commands Per Step

### Step 1: Test Placeholder

```bash
npm run dev
curl http://localhost:3000/api/v1/endpoint \
  -H "Authorization: Bearer TOKEN"
# Expected: 200 with mock data
```

### Step 2: Test Real Data

```bash
# Success case
curl http://localhost:3000/api/v1/endpoint/REAL_ID \
  -H "Authorization: Bearer TOKEN"
# Expected: 200 with real data

# Error cases
curl http://localhost:3000/api/v1/endpoint/invalid  # 404
curl http://localhost:3000/api/v1/endpoint/other-user-id  # 403
```

### Step 3: Test Swagger

```bash
npm run dev
open http://localhost:3000/api
# Verify endpoint is documented
```

### Step 4: Test Everything

```bash
npm test                  # All tests pass
npm run test:cov          # Coverage > 80%
npm run lint              # No errors
npm run build             # Build succeeds
```

## File Creation Checklist

### Step 1

- [ ] `dto/request.dto.ts` (if POST/PUT)
- [ ] `dto/response.dto.ts`
- [ ] `queries/impl/query.ts` or `commands/impl/command.ts`
- [ ] `queries/handlers/handler.ts` or `commands/handlers/handler.ts`
- [ ] Update `controller.ts` (add endpoint method)
- [ ] Update `module.ts` (register handler)

### Step 2

- [ ] Update handler (inject repository)
- [ ] Add authorization checks
- [ ] Add error handling

### Step 3

- [ ] Add `@ApiOperation` to controller
- [ ] Add `@ApiResponse` (200, 401, 403, 404)
- [ ] Add `@ApiProperty` to DTOs
- [ ] Add example values

### Step 4

- [ ] `handler.spec.ts`
- [ ] Update `controller.spec.ts`
- [ ] Update `README.md`
- [ ] Add curl examples

## Common Mistakes to Avoid

| ❌ Don't Do This | ✅ Do This Instead |
| ----------------- | ------------------- |
| Build all layers first | Build one vertical slice |
| Skip placeholder step | Always start with placeholder |
| Test at the end | Test after each step |
| Mix multiple endpoints | One endpoint at a time |
| Skip documentation | Document in Step 3 |
| Skip tests | Add tests in Step 4 |

## When to Use

- ✅ **Always** - All new endpoints
- ✅ New features
- ✅ New modules
- ✅ Refactoring existing endpoints

Exception: Trivial endpoints (health checks) - can combine steps 1-2

## Full Documentation

- Complete Guide: `docs/rules/iterative-endpoint-implementation.md`
- Architecture: `docs/architecture.md`
- Examples:
  - `docs/modules/job-profiles-parse-implementation-plan-iterative.md`
  - `docs/modules/job-profiles-get-implementation-plan-iterative.md`

---

**Remember:** Endpoint First → Repository → Documentation → Tests

**Total Time:** 3-4 hours vs 2-3 days (waterfall)
