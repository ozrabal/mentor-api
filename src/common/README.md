# Common Module

This module contains **shared utilities** that are used across the application but contain **no domain logic**.

## Purpose

The `common/` module provides:
- **Decorators**: Reusable parameter decorators (e.g., `@CurrentUser`)
- **Filters**: HTTP exception filters and other cross-cutting concerns
- **Utilities**: Framework-level helpers (NestJS, Express, etc.)

## Rules

✅ **DO:**
- Add framework-level utilities (decorators, filters, interceptors, guards)
- Keep utilities generic and reusable
- Ensure utilities are framework-aware (NestJS, HTTP, etc.)

❌ **DON'T:**
- Add domain logic (entities, value objects, business rules)
- Add application logic (commands, queries, handlers)
- Add module-specific code
- Import from module internals (domain, application, infrastructure)

## Structure

```
common/
├── decorators/          # Parameter decorators
├── filters/             # Exception filters
└── README.md           # This file
```

## Examples

### ✅ Good: Framework Utility
```typescript
// common/decorators/current-user.decorator.ts
export const CurrentUser = createParamDecorator(...)
```

### ❌ Bad: Domain Logic
```typescript
// ❌ DON'T DO THIS
export class User { ... }  // Domain entity belongs in modules/users/domain/
```

---

**Note**: If you need to share domain concepts across modules, use the **ACL (Anti-Corruption Layer)** pattern in each module's `public/` contract instead.
