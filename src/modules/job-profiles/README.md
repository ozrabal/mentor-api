# Job Profiles Module

## Overview

The Job Profiles module parses job descriptions using AI (via Vercel AI SDK) to extract structured competency data. It features a model-agnostic design that supports OpenAI, Anthropic Claude, Google Gemini, and other AI providers.

## Features

- **Parse Job Description** (FR-JP-001)
  - Accept raw text or job URL
  - Extract competencies with weights and depth
  - Identify hard/soft skills
  - Estimate seniority and interview difficulty
  - Model-agnostic AI parsing (initially configured with Google Gemini)

- **Get Job Profile** (FR-JP-002)
  - Retrieve job profile by ID
  - User authorization (can only access own profiles)
  - Returns complete job profile data including raw JD

## Architecture

This module follows the **Modular Monolith** architecture with:

- **Domain-Driven Design (DDD)** - Rich domain models with business logic
- **Clean Architecture** - Clear layer separation and dependency rules
- **CQRS Pattern** - Command handlers for write operations
- **Type-Safe Persistence** - Drizzle ORM with TypeScript

### Module Structure

```txt
src/modules/job-profiles/
├── domain/
│   ├── entities/              # JobProfile, Competency entities
│   ├── value-objects/         # JobProfileId, UserId, SeniorityLevel
│   ├── repositories/          # Repository interfaces
│   └── errors/                # Domain-specific errors
├── application/
│   ├── commands/              # Parse job description command/handler
│   ├── dto/                   # Application DTOs
│   └── mappers/               # Domain ↔ DTO mapping
├── infrastructure/
│   ├── services/              # AI parser, HTML fetcher, JD extractor
│   └── persistence/           # Repository implementation, ORM mapping
├── presentation/
│   └── http/                  # Controllers, HTTP DTOs, mappers
└── job-profiles.module.ts     # NestJS module
```

## API

### POST /api/v1/job-profiles/parse

Parse a job description from raw text or URL.

**Authentication:** Required (JWT Bearer token)

**Request Body:**

```json
{
  "jobUrl": "https://example.com/job",     // Optional
  "rawJD": "Job description text...",      // Optional
  "jobTitle": "Senior Engineer",           // Optional
  "seniority": 7                           // Optional (1-10)
}
```

**Note:** Either `jobUrl` or `rawJD` must be provided.

**Response (201 Created):**

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "jobTitle": "Senior Software Engineer",
  "companyName": "Tech Corp",
  "competencies": [
    {
      "name": "System Design",
      "weight": 0.3,
      "depth": 8
    },
    {
      "name": "API Development",
      "weight": 0.4,
      "depth": 7
    },
    {
      "name": "Database Design",
      "weight": 0.3,
      "depth": 6
    }
  ],
  "hardSkills": ["TypeScript", "NestJS", "PostgreSQL", "AWS"],
  "softSkills": ["Communication", "Leadership", "Mentoring"],
  "seniorityLevel": 7,
  "interviewDifficultyLevel": 7.5,
  "createdAt": "2026-01-27T10:00:00Z"
}
```

**Error Responses:**

- `400 Bad Request` - Invalid request body or missing required fields
- `401 Unauthorized` - Missing or invalid JWT token
- `500 Internal Server Error` - AI parsing or database error

### GET /api/v1/job-profiles/:jobProfileId

Retrieve a job profile by its ID.

**Authentication:** Required (JWT Bearer token)

**Path Parameters:**

- `jobProfileId` (string, required) - UUID of the job profile

**Response (200 OK):**

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "userId": "user-123",
  "jobTitle": "Senior Software Engineer",
  "companyName": "Tech Corp",
  "jobUrl": "https://example.com/job",
  "rawJD": "We are looking for...",
  "competencies": [
    {
      "name": "System Design",
      "weight": 0.3,
      "depth": 8
    }
  ],
  "hardSkills": ["TypeScript", "NestJS", "PostgreSQL"],
  "softSkills": ["Communication", "Leadership"],
  "seniorityLevel": 7,
  "interviewDifficultyLevel": 8,
  "createdAt": "2026-01-27T10:00:00Z",
  "updatedAt": "2026-01-27T10:00:00Z"
}
```

**Error Responses:**

- `401 Unauthorized` - Missing or invalid JWT token
- `403 Forbidden` - Job profile belongs to another user
- `404 Not Found` - Job profile not found or soft-deleted

**Example:**

```bash
curl -X GET http://localhost:3000/api/v1/job-profiles/550e8400-e29b-41d4-a716-446655440000 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## AI Configuration

### Environment Variables

Configure your AI provider in `.env`:

```bash
# Google Gemini (default)
GOOGLE_GENERATIVE_AI_API_KEY=your-google-api-key
AI_MODEL=gemini-1.5-pro  # Optional, defaults to gemini-1.5-pro

# Or use other providers:
# OPENAI_API_KEY=sk-your-openai-key
# ANTHROPIC_API_KEY=sk-ant-your-anthropic-key
```

### Switching AI Providers

The module uses the Vercel AI SDK, which makes switching providers straightforward.

**Current Configuration (Google Gemini):**

```typescript
// infrastructure/services/ai-parser.service.ts
import { google } from '@ai-sdk/google';
this.model = google('gemini-1.5-pro');
```

**Switch to OpenAI:**

```bash
# 1. Install provider
npm install @ai-sdk/openai
```

```typescript
// 2. Update ai-parser.service.ts
import { openai } from '@ai-sdk/openai';
this.model = openai('gpt-4o');
```

```bash
# 3. Update .env
OPENAI_API_KEY=sk-your-key
AI_MODEL=gpt-4o
```

**Switch to Anthropic Claude:**

```bash
# 1. Install provider
npm install @ai-sdk/anthropic
```

```typescript
// 2. Update ai-parser.service.ts
import { anthropic } from '@ai-sdk/anthropic';
this.model = anthropic('claude-3-5-sonnet-20241022');
```

```bash
# 3. Update .env
ANTHROPIC_API_KEY=sk-ant-your-key
AI_MODEL=claude-3-5-sonnet-20241022
```

## Dependencies

```json
{
  "ai": "^3.x",                    // Vercel AI SDK
  "@ai-sdk/google": "^0.x",        // Google Gemini provider
  "zod": "^3.x",                   // Schema validation
  "axios": "^1.x",                 // HTTP client for URL fetching
  "cheerio": "^1.x"                // HTML parsing
}
```

## Domain Model

### Entities

**JobProfile** - Aggregate root

- Manages parsed job description data
- Enforces business rules (e.g., cannot update deleted profiles)
- Supports soft delete/restore

**Competency** - Value entity

- Represents a skill/competency with weight and depth
- Self-validating (weight 0-1, depth 1-10)

### Value Objects

- **JobProfileId** - Unique identifier (UUID)
- **UserId** - Reference to user who created the profile
- **SeniorityLevel** - Integer 1-10 representing seniority

### Business Rules

1. Competency weights must sum to 1.0 (normalized by AI service)
2. Competency depth ranges from 1 (basic) to 10 (expert)
3. Seniority level ranges from 1 (junior) to 10 (principal/staff)
4. Deleted profiles cannot be updated
5. At least one input (rawJD or jobUrl) must be provided

## Usage Examples

### Parse from Raw Text

```bash
curl -X POST http://localhost:3000/api/v1/job-profiles/parse \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "rawJD": "We are seeking a Senior Software Engineer with 5+ years of experience in TypeScript, NestJS, and PostgreSQL. Strong system design and API development skills required. Must have excellent communication and leadership abilities."
  }'
```

### Parse from URL

```bash
curl -X POST http://localhost:3000/api/v1/job-profiles/parse \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "jobUrl": "https://careers.example.com/jobs/senior-engineer"
  }'
```

### Parse with Hints

```bash
curl -X POST http://localhost:3000/api/v1/job-profiles/parse \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "rawJD": "Job description text...",
    "jobTitle": "Lead Backend Engineer",
    "seniority": 8
  }'
```

## Testing

### Run Tests

```bash
# All tests
npm test

# Watch mode
npm test -- --watch

# Coverage
npm run test:cov

# Specific test file
npm test job-profile.entity.spec.ts
```

### Test Coverage

The module includes comprehensive tests:

- **Domain Tests** - Entity and value object validation
- **Service Tests** - HTML fetching, text extraction, normalization
- **Handler Tests** - Command handler with mocked dependencies
- **E2E Tests** - Controller integration tests

Expected coverage: > 80%

## Development

### Adding a New Feature

Follow the architecture guidelines in `docs/architecture.md`:

1. **Model the domain** - Add/update entities and value objects
2. **Define repository interface** - If persistence is needed
3. **Create command/query** - In application layer
4. **Implement handler** - Business logic orchestration
5. **Update repository** - Infrastructure layer
6. **Add controller endpoint** - Presentation layer
7. **Write tests** - All layers

### Common Tasks

**Add a new AI provider:**

1. Install provider package: `npm install @ai-sdk/{provider}`
2. Update `ai-parser.service.ts` with new model initialization
3. Add environment variable for API key
4. Update this README with configuration example

**Modify parsing logic:**

1. Update prompt in `AiParserService.buildPrompt()`
2. Adjust Zod schema if output format changes
3. Update domain entities if new fields are needed
4. Update tests to reflect changes

**Add validation rules:**

1. Update domain entities (e.g., `Competency.validate()`)
2. Add corresponding tests
3. Document business rules in this README

## Troubleshooting

### AI Parsing Errors

**Error:** `GOOGLE_GENERATIVE_AI_API_KEY is not configured`

- **Solution:** Add API key to `.env` file

**Error:** `Failed to parse job description`

- **Cause:** AI model returned invalid format or rate limit exceeded
- **Solution:** Check API quota, verify model availability, review logs

### HTML Fetching Errors

**Error:** `Failed to fetch job URL: timeout of 10000ms exceeded`

- **Cause:** URL is slow to respond or unreachable
- **Solution:** Check URL accessibility, increase timeout if needed

**Error:** `Failed to fetch job URL: 404`

- **Cause:** URL does not exist or requires authentication
- **Solution:** Verify URL is correct and publicly accessible

### Database Errors

**Error:** Database connection issues

- **Solution:** Check `DATABASE_URL` in `.env`, ensure PostgreSQL is running

## Future Enhancements

- [ ] Support for multiple languages
- [ ] Batch processing of job descriptions
- [ ] Job profile versioning/history
- [ ] Custom competency weights based on user preferences
- [ ] Integration with job boards APIs
- [ ] Caching of parsed results

## References

- **Implementation Plan:** `docs/modules/job-profiles-parse-implementation-plan-iterative.md`
- **Architecture Guidelines:** `docs/architecture.md`
- **Vercel AI SDK:** <https://sdk.vercel.ai/docs>
- **Google Gemini API:** <https://ai.google.dev/docs>

---

**Module Status:** ✅ Production Ready
**Last Updated:** 2026-01-27
**Maintainers:** MENTOR Development Team
