# Auth Module Plan (Supabase)

Goal: add an Auth module with Supabase integration, service, controller, and JWT guard (login + register only). Follow CQRS, thin controllers, and existing module structure.

## Steps

1) Define module structure
   - Create `src/modules/auth/` with `application/`, `presentation/http/`, `public/`, and `auth.module.ts`.
   - Mirror the Health module layout and use `@nestjs/cqrs` for all operations.

2) Add application-layer DTOs and command definitions
   - `application/dto/` for internal auth results (tokens + user identifiers).
   - `application/commands/impl/` for `RegisterCommand` and `LoginCommand`.

3) Implement command handlers
   - `application/commands/handlers/` for `RegisterHandler` and `LoginHandler`.
   - Each handler calls a Supabase-backed service and maps results to application DTOs.

4) Implement Supabase auth service
   - Add `AuthService` (or `SupabaseAuthService`) in the module layer.
   - Create Supabase client with `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` (service role for server-side auth).
   - Provide methods: `register(email, password)` and `login(email, password)` using Supabase SDK.

5) Build HTTP presentation layer
   - Request/response DTOs in `presentation/http/dto/`.
   - Mapper in `presentation/http/mappers/` to convert application DTOs to response DTOs.
   - Controller in `presentation/http/controllers/` with:
     - `POST /api/v1/auth/register`
     - `POST /api/v1/auth/login`
   - Use `CommandBus` only (no direct service calls in controllers).

6) Add JWT guard for protected endpoints
   - Implement `SupabaseJwtStrategy` and `SupabaseGuard` using `@nestjs/passport` and `passport-jwt`.
   - Validate JWTs against Supabase JWT secret/JWKS from config (align with existing config patterns).
   - Expose guard via `@UseGuards(SupabaseGuard)` for future protected routes.

7) Wire module providers and exports
   - Register command handlers, service, strategy, and guard in `auth.module.ts`.
   - Add `public/index.ts` export for the guard/strategy if needed by other modules.

8) Config and docs updates
   - Ensure `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` are referenced in configuration.
   - Update `docs/project/mentor-quickstart.md` or README with new auth endpoints and local Supabase flow if needed.

9) Tests (optional but recommended)
   - Unit tests for `AuthService` with Supabase mocked.
   - E2E tests for `/auth/register` and `/auth/login` with Supabase mocked or local Supabase.
