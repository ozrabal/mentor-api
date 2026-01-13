# AGENTS.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

MENTOR is an API-only proof of concept for AI-powered mock interview preparation.

**Tech Stack:** NestJS + Drizzle ORM + PostgreSQL + Supabase (auth) + OpenAI API

## Common Commands

```bash
# Development
npm run dev              # Start dev server with watch mode
npm run build            # Build the project

# Testing
npm test                 # Run all tests
npm test -- --watch      # Run tests in watch mode
npm run test:cov         # Run tests with coverage
npm run test:e2e         # Run E2E tests

# Linting
npm run lint             # Run ESLint
npm run lint:fix         # Fix linting issues
npm run format           # Format with Prettier

# Database (Drizzle)
npm run docker:up        # Start PostgreSQL container
npm run docker:down      # Stop PostgreSQL container
npm run db:generate      # Generate Drizzle client
npm run db:push          # Push schema to DB
npm run db:studio        # Open Drizzle Studio

# Health check
npm run health           # curl localhost:3000/health
```

## Architecture

### Modular Monolith with CQRS

The codebase follows a modular monolith architecture with CQRS pattern using `@nestjs/cqrs`. Each module is structured as:

```txt
src/modules/{module-name}/
├── application/           # Use cases
│   ├── commands/          # Write operations
│   │   ├── handlers/      # Command handlers
│   │   └── impl/          # Command definitions
│   ├── queries/           # Read operations
│   │   ├── handlers/      # Query handlers
│   │   └── impl/          # Query definitions
│   └── dto/               # Internal DTOs
├── presentation/
│   └── http/
│       ├── controllers/   # HTTP endpoints (thin, orchestration only)
│       ├── dto/           # Request/Response DTOs
│       └── mappers/       # DTO transformations
├── public/
│   └── index.ts           # Public contracts for inter-module communication
└── {module-name}.module.ts
```

Controllers use `QueryBus` and `CommandBus` for all operations instead of directly calling services.

### Path Aliases

Configured in `tsconfig.json`:

- `@/*` → `src/*`
- `@modules/*` → `src/modules/*`

### Database Schema

Schema is defined in `src/database/schema.ts` using Drizzle ORM. Tables:

- `users` - User accounts (linked to Supabase identity)
- `job_profiles` - Parsed job descriptions with competencies
- `interview_sessions` - Interview session state and scores
- `interview_reports` - Generated reports with gaps/strengths
- `question_pool` - Question bank by competency/difficulty

### Environment Variables

Copy `.env.example` to `.env` and configure:

- `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` - Supabase auth
- `DATABASE_URL` - PostgreSQL connection string
- `CLAUDE_API_KEY` - Anthropic API key
- `JWT_SECRET` - Min 32 characters
- `PORT` - Default 3000

## Key Patterns

- **Global exception filter** in `src/common/filters/http-exception.filter.ts` handles all errors
- **CurrentUser decorator** in `src/common/decorators/current-user.decorator.ts` extracts user from JWT
- **Validation** uses `class-validator` with global `ValidationPipe` (whitelist, transform enabled)
- **TypeScript strict mode** is enabled with `strictNullChecks` and `noImplicitAny`
