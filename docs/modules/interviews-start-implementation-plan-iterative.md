# FR-INT-001: Start Interview Session - Iterative Implementation Plan

**Module:** `interviews`
**Feature:** Start Interview Session
**Version:** 1.0 (Iterative)
**Date:** 2026-02-03
**Status:** Ready for Implementation

---

## Quick Start Guide

### Key Files to Create/Modify

1. **Application**: `src/modules/interviews/application/commands/impl/start-interview.command.ts`
2. **Application**: `src/modules/interviews/application/commands/handlers/start-interview.handler.ts`
3. **Application**: `src/modules/interviews/application/dto/interview-session.dto.ts`
4. **Application**: `src/modules/interviews/application/dto/question.dto.ts`
5. **Application**: `src/modules/interviews/application/mappers/interview-session.mapper.ts`
6. **Domain**: `src/modules/interviews/domain/entities/interview-session.entity.ts`
7. **Domain**: `src/modules/interviews/domain/value-objects/session-id.vo.ts`
8. **Domain**: `src/modules/interviews/domain/value-objects/interview-type.vo.ts`
9. **Domain**: `src/modules/interviews/domain/repositories/interview-session.repository.interface.ts`
10. **Domain**: `src/modules/interviews/domain/services/question-selector.service.interface.ts`
11. **Infrastructure**: `src/modules/interviews/infrastructure/persistence/repositories/interview-session.repository.ts`
12. **Infrastructure**: `src/modules/interviews/infrastructure/persistence/mappers/interview-session-persistence.mapper.ts`
13. **Infrastructure**: `src/modules/interviews/infrastructure/services/question-selector.service.ts`
14. **Presentation**: `src/modules/interviews/presentation/http/dto/start-interview-request.dto.ts`
15. **Presentation**: `src/modules/interviews/presentation/http/dto/start-interview-response.dto.ts`
16. **Presentation**: `src/modules/interviews/presentation/http/mappers/start-interview.mapper.ts`
17. **Presentation**: Update `src/modules/interviews/presentation/http/controllers/interviews.controller.ts`
18. **Module**: Update `src/modules/interviews/interviews.module.ts`

### Implementation Strategy

Follow steps 1-4 sequentially. After each step, the endpoint should work and return a response.

---

## Overview

This implementation plan follows the **iterative and incremental** methodology for building the `POST /api/v1/interviews/start` endpoint. The endpoint creates a new interview session for a specific job profile and returns the first question.

### Key Principles

1. **Endpoint First**: Create working endpoint in Step 1 with placeholder data
2. **Incremental Enhancement**: Each step adds real functionality
3. **Continuous Testing**: Test after every step
4. **Minimal Viable Slices**: Complete vertical slices through all layers

### Architecture Alignment

- **CQRS Pattern**: Uses `CommandBus` with `StartInterviewCommand`
- **Domain-Driven Design**: Rich domain entity `InterviewSession` with business logic
- **Clean Architecture**: Clear layer separation (presentation → application → domain ← infrastructure)
- **ACL Pattern**: Uses `IJobProfilesACL` for cross-module communication (not direct repository access)

---

## Implementation Steps Overview

| Step | What Gets Added | Endpoint Returns |
| ---- | --------------- | ---------------- |
| 1 | Basic endpoint structure + placeholder | Mock session with placeholder question |
| 2 | Repository + ACL + question selection | Real session with real question from DB |
| 3 | Swagger documentation | Fully documented API |
| 4 | Tests + documentation | Production ready |

---

## Step 1: Basic Endpoint Structure (Placeholder)

**Goal:** Working endpoint that returns 200 with mock data

### What to Create

#### 1.1 Application Layer - Command

**File:** `src/modules/interviews/application/commands/impl/start-interview.command.ts`

```typescript
export class StartInterviewCommand {
  constructor(
    public readonly jobProfileId: string,
    public readonly userId: string,
    public readonly interviewType?: 'behavioral' | 'technical' | 'mixed',
  ) {}
}
```

#### 1.2 Application Layer - DTOs

**File:** `src/modules/interviews/application/dto/question.dto.ts`

```typescript
export class QuestionDto {
  id: string;
  text: string;
  category: string;
  difficulty: number;
}
```

**File:** `src/modules/interviews/application/dto/interview-session.dto.ts`

```typescript
import { QuestionDto } from './question.dto';

export class InterviewSessionDto {
  sessionId: string;
  question: QuestionDto;
  sessionToken: string;
}
```

#### 1.3 Application Layer - Command Handler (Placeholder)

**File:** `src/modules/interviews/application/commands/handlers/start-interview.handler.ts`

```typescript
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { StartInterviewCommand } from '../impl/start-interview.command';
import { InterviewSessionDto } from '../../dto/interview-session.dto';

@CommandHandler(StartInterviewCommand)
export class StartInterviewHandler implements ICommandHandler<StartInterviewCommand> {
  async execute(command: StartInterviewCommand): Promise<InterviewSessionDto> {
    // TODO: Step 1 - Placeholder implementation
    const sessionId = crypto.randomUUID();

    return {
      sessionId,
      question: {
        id: crypto.randomUUID(),
        text: 'Tell me about a time when you faced a challenging situation at work.',
        category: 'behavioral',
        difficulty: 5,
      },
      sessionToken: `session_${sessionId}`,
    };
  }
}
```

#### 1.4 Presentation Layer - Request DTO

**File:** `src/modules/interviews/presentation/http/dto/start-interview-request.dto.ts`

```typescript
import { IsString, IsOptional, IsEnum } from 'class-validator';

export class StartInterviewRequestDto {
  @IsString()
  jobProfileId: string;

  @IsOptional()
  @IsEnum(['behavioral', 'technical', 'mixed'])
  interviewType?: 'behavioral' | 'technical' | 'mixed';
}
```

#### 1.5 Presentation Layer - Response DTO

**File:** `src/modules/interviews/presentation/http/dto/start-interview-response.dto.ts`

```typescript
export class QuestionResponseDto {
  id: string;
  text: string;
  category: string;
  difficulty: number;
}

export class StartInterviewResponseDto {
  sessionId: string;
  question: QuestionResponseDto;
  sessionToken: string;
}
```

#### 1.6 Presentation Layer - Mapper

**File:** `src/modules/interviews/presentation/http/mappers/start-interview.mapper.ts`

```typescript
import { StartInterviewCommand } from '@modules/interviews/application/commands/impl/start-interview.command';
import { InterviewSessionDto } from '@modules/interviews/application/dto/interview-session.dto';
import { StartInterviewRequestDto } from '../dto/start-interview-request.dto';
import { StartInterviewResponseDto } from '../dto/start-interview-response.dto';

export class StartInterviewMapper {
  static toCommand(
    dto: StartInterviewRequestDto,
    userId: string,
  ): StartInterviewCommand {
    return new StartInterviewCommand(
      dto.jobProfileId,
      userId,
      dto.interviewType,
    );
  }

  static toResponseDto(
    sessionDto: InterviewSessionDto,
  ): StartInterviewResponseDto {
    return {
      sessionId: sessionDto.sessionId,
      question: {
        id: sessionDto.question.id,
        text: sessionDto.question.text,
        category: sessionDto.question.category,
        difficulty: sessionDto.question.difficulty,
      },
      sessionToken: sessionDto.sessionToken,
    };
  }
}
```

#### 1.7 Presentation Layer - Controller Method

**File:** `src/modules/interviews/presentation/http/controllers/interviews.controller.ts`

```typescript
import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { SupabaseGuard } from '@modules/auth/infrastructure/guards/supabase.guard';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { StartInterviewRequestDto } from '../dto/start-interview-request.dto';
import { StartInterviewResponseDto } from '../dto/start-interview-response.dto';
import { StartInterviewMapper } from '../mappers/start-interview.mapper';

@Controller('interviews')
@UseGuards(SupabaseGuard)
export class InterviewsController {
  constructor(private readonly commandBus: CommandBus) {}

  @Post('start')
  async startInterview(
    @Body() dto: StartInterviewRequestDto,
    @CurrentUser() user: { id: string },
  ): Promise<StartInterviewResponseDto> {
    const command = StartInterviewMapper.toCommand(dto, user.id);
    const result = await this.commandBus.execute(command);
    return StartInterviewMapper.toResponseDto(result);
  }
}
```

#### 1.8 Module Registration

**File:** `src/modules/interviews/interviews.module.ts`

```typescript
import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { InterviewsController } from './presentation/http/controllers/interviews.controller';
import { StartInterviewHandler } from './application/commands/handlers/start-interview.handler';

const CommandHandlers = [StartInterviewHandler];

@Module({
  imports: [CqrsModule],
  controllers: [InterviewsController],
  providers: [...CommandHandlers],
})
export class InterviewsModule {}
```

### Expected State After Step 1

- ✅ Endpoint responds with 200
- ✅ Returns placeholder session with mock question
- ✅ Authentication works (Supabase JWT)
- ✅ Validation works (DTO validation)
- ✅ Can test with curl/Postman
- ✅ `npm run build` succeeds

### Verification Commands for Step 1

```bash
# Start dev server
npm run dev

# Test endpoint (replace TOKEN with real Supabase JWT)
curl -X POST http://localhost:3000/api/v1/interviews/start \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN" \
  -d '{
    "jobProfileId": "123e4567-e89b-12d3-a456-426614174000",
    "interviewType": "mixed"
  }'

# Expected response (200):
# {
#   "sessionId": "uuid-here",
#   "question": {
#     "id": "uuid-here",
#     "text": "Tell me about a time when you faced a challenging situation at work.",
#     "category": "behavioral",
#     "difficulty": 5
#   },
#   "sessionToken": "session_uuid-here"
# }

# Test validation error
curl -X POST http://localhost:3000/api/v1/interviews/start \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN" \
  -d '{}'

# Expected response (400):
# {
#   "statusCode": 400,
#   "message": ["jobProfileId must be a string"],
#   "error": "Bad Request"
# }

# Test authentication error
curl -X POST http://localhost:3000/api/v1/interviews/start \
  -H "Content-Type: application/json" \
  -d '{
    "jobProfileId": "123e4567-e89b-12d3-a456-426614174000"
  }'

# Expected response (401):
# {
#   "statusCode": 401,
#   "message": "Unauthorized"
# }
```

---

## Step 2: Real Implementation (Repository + Business Logic)

**Goal:** Replace placeholder with real database operations and question selection

### What to Do

#### 2.1 Domain Layer - Value Objects

**File:** `src/modules/interviews/domain/value-objects/session-id.vo.ts`

```typescript
import { randomUUID } from 'crypto';

export class SessionId {
  private constructor(private readonly value: string) {
    if (!value || value.trim().length === 0) {
      throw new Error('SessionId cannot be empty');
    }
  }

  static create(value: string): SessionId {
    return new SessionId(value);
  }

  static generate(): SessionId {
    return new SessionId(randomUUID());
  }

  getValue(): string {
    return this.value;
  }

  equals(other: SessionId): boolean {
    return this.value === other.value;
  }
}
```

**File:** `src/modules/interviews/domain/value-objects/interview-type.vo.ts`

```typescript
export type InterviewTypeValue = 'behavioral' | 'technical' | 'mixed';

export class InterviewType {
  private constructor(private readonly value: InterviewTypeValue) {}

  static create(value?: InterviewTypeValue): InterviewType {
    return new InterviewType(value ?? 'mixed');
  }

  getValue(): InterviewTypeValue {
    return this.value;
  }

  equals(other: InterviewType): boolean {
    return this.value === other.value;
  }
}
```

#### 2.2 Domain Layer - Entity

**File:** `src/modules/interviews/domain/entities/interview-session.entity.ts`

```typescript
import { SessionId } from '../value-objects/session-id.vo';
import { InterviewType } from '../value-objects/interview-type.vo';

export interface Question {
  id: string;
  text: string;
  category: string;
  difficulty: number;
}

export class InterviewSession {
  private constructor(
    private readonly id: SessionId,
    private readonly userId: string,
    private readonly jobProfileId: string,
    private readonly interviewType: InterviewType,
    private status: 'in_progress' | 'completed',
    private questionsAsked: Question[],
    private responses: any[],
    private clarityScores: number[],
    private completenessScores: number[],
    private relevanceScores: number[],
    private confidenceScores: number[],
    private overallScores: number[],
    private readonly createdAt: Date,
    private completedAt: Date | null,
  ) {}

  static createNew(
    userId: string,
    jobProfileId: string,
    interviewType: InterviewType,
    question: Question,
  ): InterviewSession {
    return new InterviewSession(
      SessionId.generate(),
      userId,
      jobProfileId,
      interviewType,
      'in_progress',
      [question],
      [],
      [],
      [],
      [],
      [],
      [],
      new Date(),
      null,
    );
  }

  static rehydrate(snapshot: {
    id: string;
    userId: string;
    jobProfileId: string;
    interviewType: InterviewTypeValue;
    status: 'in_progress' | 'completed';
    questionsAsked: Question[];
    responses: any[];
    clarityScores: number[];
    completenessScores: number[];
    relevanceScores: number[];
    confidenceScores: number[];
    overallScores: number[];
    createdAt: Date;
    completedAt: Date | null;
  }): InterviewSession {
    return new InterviewSession(
      SessionId.create(snapshot.id),
      snapshot.userId,
      snapshot.jobProfileId,
      InterviewType.create(snapshot.interviewType),
      snapshot.status,
      snapshot.questionsAsked,
      snapshot.responses,
      snapshot.clarityScores,
      snapshot.completenessScores,
      snapshot.relevanceScores,
      snapshot.confidenceScores,
      snapshot.overallScores,
      snapshot.createdAt,
      snapshot.completedAt,
    );
  }

  // Getters
  getId(): SessionId {
    return this.id;
  }

  getUserId(): string {
    return this.userId;
  }

  getJobProfileId(): string {
    return this.jobProfileId;
  }

  getInterviewType(): InterviewType {
    return this.interviewType;
  }

  getStatus(): 'in_progress' | 'completed' {
    return this.status;
  }

  getQuestionsAsked(): Question[] {
    return [...this.questionsAsked];
  }

  getQuestion(): Question | null {
    return this.questionsAsked[0] ?? null;
  }

  getCreatedAt(): Date {
    return this.createdAt;
  }
}
```

#### 2.3 Domain Layer - Repository Interface

**File:** `src/modules/interviews/domain/repositories/interview-session.repository.interface.ts`

```typescript
import { InterviewSession } from '../entities/interview-session.entity';
import { SessionId } from '../value-objects/session-id.vo';

export interface IInterviewSessionRepository {
  save(session: InterviewSession): Promise<void>;
  findById(id: SessionId): Promise<InterviewSession | null>;
}

export const INTERVIEW_SESSION_REPOSITORY = Symbol('INTERVIEW_SESSION_REPOSITORY');
```

#### 2.4 Domain Layer - Question Selector Service Interface

**File:** `src/modules/interviews/domain/services/question-selector.service.interface.ts`

```typescript
import { Question } from '../entities/interview-session.entity';

export interface IQuestionSelectorService {
  selectQuestion(
    jobProfileCompetencies: Array<{ name: string; weight: number; depth: number }>,
    interviewDifficultyLevel: number,
    interviewType: 'behavioral' | 'technical' | 'mixed',
  ): Promise<Question>;
}

export const QUESTION_SELECTOR_SERVICE = Symbol('QUESTION_SELECTOR_SERVICE');
```

#### 2.5 Public ACL Interface for Job Profiles

**File:** `src/modules/job-profiles/public/acl/job-profiles.acl.interface.ts`

```typescript
export interface JobProfileInfoDto {
  id: string;
  userId: string;
  jobTitle: string;
  competencies: Array<{ name: string; weight: number; depth: number }>;
  interviewDifficultyLevel: number;
}

export interface IJobProfilesACL {
  getJobProfileInfo(jobProfileId: string): Promise<JobProfileInfoDto | null>;
}
```

**File:** `src/modules/job-profiles/public/acl/job-profiles.acl.tokens.ts`

```typescript
export const JOB_PROFILES_ACL = Symbol('JOB_PROFILES_ACL');
```

**File:** `src/modules/job-profiles/public/index.ts`

```typescript
export * from './acl/job-profiles.acl.interface';
export * from './acl/job-profiles.acl.tokens';
```

#### 2.6 Infrastructure Layer - ACL Implementation (in job-profiles module)

**File:** `src/modules/job-profiles/infrastructure/acl/job-profiles.acl.service.ts`

```typescript
import { Injectable, Inject } from '@nestjs/common';
import { IJobProfilesACL, JobProfileInfoDto } from '../../public';
import { JOB_PROFILE_REPOSITORY } from '../../domain/repositories/job-profile.repository.interface';
import { IJobProfileRepository } from '../../domain/repositories/job-profile.repository.interface';
import { JobProfileId } from '../../domain/value-objects/job-profile-id.vo';

@Injectable()
export class JobProfilesACLService implements IJobProfilesACL {
  constructor(
    @Inject(JOB_PROFILE_REPOSITORY)
    private readonly repository: IJobProfileRepository,
  ) {}

  async getJobProfileInfo(jobProfileId: string): Promise<JobProfileInfoDto | null> {
    const profile = await this.repository.findById(JobProfileId.create(jobProfileId));

    if (!profile || profile.isDeleted()) {
      return null;
    }

    return {
      id: profile.getId().getValue(),
      userId: profile.getUserId(),
      jobTitle: profile.getJobTitle(),
      competencies: profile.getCompetencies(),
      interviewDifficultyLevel: profile.getInterviewDifficultyLevel(),
    };
  }
}
```

**Update:** `src/modules/job-profiles/job-profiles.module.ts`

```typescript
import { JOB_PROFILES_ACL } from './public';
import { JobProfilesACLService } from './infrastructure/acl/job-profiles.acl.service';

@Module({
  // ... existing code
  providers: [
    // ... existing providers
    {
      provide: JOB_PROFILES_ACL,
      useClass: JobProfilesACLService,
    },
  ],
  exports: [JOB_PROFILES_ACL], // Export ACL token
})
export class JobProfilesModule {}
```

#### 2.7 Infrastructure Layer - Question Selector Service

**File:** `src/modules/interviews/infrastructure/services/question-selector.service.ts`

```typescript
import { Injectable, Inject } from '@nestjs/common';
import { eq, and, between, notInArray, sql } from 'drizzle-orm';
import { IQuestionSelectorService } from '../../domain/services/question-selector.service.interface';
import { Question } from '../../domain/entities/interview-session.entity';
import { DRIZZLE_DB, DrizzleDb } from '@/database/database.module';
import { questionPool } from '@/database/schema';

@Injectable()
export class QuestionSelectorService implements IQuestionSelectorService {
  constructor(@Inject(DRIZZLE_DB) private readonly db: DrizzleDb) {}

  async selectQuestion(
    jobProfileCompetencies: Array<{ name: string; weight: number; depth: number }>,
    interviewDifficultyLevel: number,
    interviewType: 'behavioral' | 'technical' | 'mixed',
  ): Promise<Question> {
    // Select competency with highest weight
    const topCompetency = jobProfileCompetencies.reduce(
      (max, comp) => (comp.weight > max.weight ? comp : max),
      jobProfileCompetencies[0],
    );

    const targetDifficulty = Math.round(interviewDifficultyLevel);
    const minDifficulty = Math.max(1, targetDifficulty - 1);
    const maxDifficulty = Math.min(10, targetDifficulty + 1);

    // Query question pool
    let query = this.db
      .select()
      .from(questionPool)
      .where(
        and(
          eq(questionPool.competency, topCompetency.name),
          between(questionPool.difficulty, minDifficulty, maxDifficulty),
          sql`${questionPool.deleted_at} IS NULL`,
        ),
      );

    // Filter by interview type
    if (interviewType !== 'mixed') {
      query = query.where(eq(questionPool.type, interviewType));
    }

    const questions = await query.orderBy(sql`RANDOM()`).limit(1);

    // Fallback: if no question found, get any random question
    if (questions.length === 0) {
      const fallbackQuestions = await this.db
        .select()
        .from(questionPool)
        .where(sql`${questionPool.deleted_at} IS NULL`)
        .orderBy(sql`RANDOM()`)
        .limit(1);

      if (fallbackQuestions.length === 0) {
        throw new Error('No questions available in question pool');
      }

      const fallback = fallbackQuestions[0];
      return {
        id: fallback.id,
        text: fallback.text,
        category: fallback.competency,
        difficulty: fallback.difficulty,
      };
    }

    const selected = questions[0];
    return {
      id: selected.id,
      text: selected.text,
      category: selected.competency,
      difficulty: selected.difficulty,
    };
  }
}
```

#### 2.8 Infrastructure Layer - Persistence Mapper

**File:** `src/modules/interviews/infrastructure/persistence/mappers/interview-session-persistence.mapper.ts`

```typescript
import { InterviewSession } from '@modules/interviews/domain/entities/interview-session.entity';

export class InterviewSessionPersistenceMapper {
  static toOrmEntity(session: InterviewSession): {
    id: string;
    user_id: string;
    job_profile_id: string;
    interview_type: 'behavioral' | 'technical' | 'mixed';
    status: 'in_progress' | 'completed';
    questions_asked: any;
    responses: any;
    clarity_scores: any;
    completeness_scores: any;
    relevance_scores: any;
    confidence_scores: any;
    overall_scores: any;
    session_overall_score: number | null;
    created_at: Date;
    completed_at: Date | null;
  } {
    return {
      id: session.getId().getValue(),
      user_id: session.getUserId(),
      job_profile_id: session.getJobProfileId(),
      interview_type: session.getInterviewType().getValue(),
      status: session.getStatus(),
      questions_asked: session.getQuestionsAsked(),
      responses: [],
      clarity_scores: [],
      completeness_scores: [],
      relevance_scores: [],
      confidence_scores: [],
      overall_scores: [],
      session_overall_score: null,
      created_at: session.getCreatedAt(),
      completed_at: null,
    };
  }

  static toDomain(ormEntity: any): InterviewSession {
    return InterviewSession.rehydrate({
      id: ormEntity.id,
      userId: ormEntity.user_id,
      jobProfileId: ormEntity.job_profile_id,
      interviewType: ormEntity.interview_type,
      status: ormEntity.status,
      questionsAsked: ormEntity.questions_asked ?? [],
      responses: ormEntity.responses ?? [],
      clarityScores: ormEntity.clarity_scores ?? [],
      completenessScores: ormEntity.completeness_scores ?? [],
      relevanceScores: ormEntity.relevance_scores ?? [],
      confidenceScores: ormEntity.confidence_scores ?? [],
      overallScores: ormEntity.overall_scores ?? [],
      createdAt: ormEntity.created_at,
      completedAt: ormEntity.completed_at,
    });
  }
}
```

#### 2.9 Infrastructure Layer - Repository Implementation

**File:** `src/modules/interviews/infrastructure/persistence/repositories/interview-session.repository.ts`

```typescript
import { Injectable, Inject } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { IInterviewSessionRepository } from '@modules/interviews/domain/repositories/interview-session.repository.interface';
import { InterviewSession } from '@modules/interviews/domain/entities/interview-session.entity';
import { SessionId } from '@modules/interviews/domain/value-objects/session-id.vo';
import { DRIZZLE_DB, DrizzleDb } from '@/database/database.module';
import { interviewSessions } from '@/database/schema';
import { InterviewSessionPersistenceMapper } from '../mappers/interview-session-persistence.mapper';

@Injectable()
export class InterviewSessionRepository implements IInterviewSessionRepository {
  constructor(@Inject(DRIZZLE_DB) private readonly db: DrizzleDb) {}

  async save(session: InterviewSession): Promise<void> {
    const ormEntity = InterviewSessionPersistenceMapper.toOrmEntity(session);

    await this.db
      .insert(interviewSessions)
      .values(ormEntity)
      .onConflictDoUpdate({
        target: interviewSessions.id,
        set: {
          status: ormEntity.status,
          questions_asked: ormEntity.questions_asked,
          responses: ormEntity.responses,
          clarity_scores: ormEntity.clarity_scores,
          completeness_scores: ormEntity.completeness_scores,
          relevance_scores: ormEntity.relevance_scores,
          confidence_scores: ormEntity.confidence_scores,
          overall_scores: ormEntity.overall_scores,
          session_overall_score: ormEntity.session_overall_score,
          completed_at: ormEntity.completed_at,
        },
      });
  }

  async findById(id: SessionId): Promise<InterviewSession | null> {
    const result = await this.db
      .select()
      .from(interviewSessions)
      .where(eq(interviewSessions.id, id.getValue()))
      .limit(1);

    if (result.length === 0) {
      return null;
    }

    return InterviewSessionPersistenceMapper.toDomain(result[0]);
  }
}
```

#### 2.10 Application Layer - Mapper

**File:** `src/modules/interviews/application/mappers/interview-session.mapper.ts`

```typescript
import { InterviewSession } from '@modules/interviews/domain/entities/interview-session.entity';
import { InterviewSessionDto } from '../dto/interview-session.dto';

export class InterviewSessionMapper {
  static toDto(session: InterviewSession): InterviewSessionDto {
    const question = session.getQuestion();

    if (!question) {
      throw new Error('Interview session must have at least one question');
    }

    return {
      sessionId: session.getId().getValue(),
      question: {
        id: question.id,
        text: question.text,
        category: question.category,
        difficulty: question.difficulty,
      },
      sessionToken: `session_${session.getId().getValue()}`,
    };
  }
}
```

#### 2.11 Application Layer - Updated Command Handler

**File:** `src/modules/interviews/application/commands/handlers/start-interview.handler.ts`

```typescript
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject, NotFoundException, ForbiddenException } from '@nestjs/common';
import { StartInterviewCommand } from '../impl/start-interview.command';
import { InterviewSessionDto } from '../../dto/interview-session.dto';
import { InterviewSessionMapper } from '../../mappers/interview-session.mapper';
import { INTERVIEW_SESSION_REPOSITORY } from '@modules/interviews/domain/repositories/interview-session.repository.interface';
import { IInterviewSessionRepository } from '@modules/interviews/domain/repositories/interview-session.repository.interface';
import { QUESTION_SELECTOR_SERVICE } from '@modules/interviews/domain/services/question-selector.service.interface';
import { IQuestionSelectorService } from '@modules/interviews/domain/services/question-selector.service.interface';
import { InterviewSession } from '@modules/interviews/domain/entities/interview-session.entity';
import { InterviewType } from '@modules/interviews/domain/value-objects/interview-type.vo';
import { IJobProfilesACL, JOB_PROFILES_ACL } from '@modules/job-profiles/public';

@CommandHandler(StartInterviewCommand)
export class StartInterviewHandler implements ICommandHandler<StartInterviewCommand> {
  constructor(
    @Inject(INTERVIEW_SESSION_REPOSITORY)
    private readonly sessionRepository: IInterviewSessionRepository,
    @Inject(QUESTION_SELECTOR_SERVICE)
    private readonly questionSelector: IQuestionSelectorService,
    @Inject(JOB_PROFILES_ACL)
    private readonly jobProfilesACL: IJobProfilesACL,
  ) {}

  async execute(command: StartInterviewCommand): Promise<InterviewSessionDto> {
    // 1. Validate job profile exists and belongs to user
    const jobProfile = await this.jobProfilesACL.getJobProfileInfo(command.jobProfileId);

    if (!jobProfile) {
      throw new NotFoundException('Job profile not found');
    }

    if (jobProfile.userId !== command.userId) {
      throw new ForbiddenException('You do not have access to this job profile');
    }

    // 2. Select first question based on job profile competencies
    const question = await this.questionSelector.selectQuestion(
      jobProfile.competencies,
      jobProfile.interviewDifficultyLevel,
      command.interviewType ?? 'mixed',
    );

    // 3. Create interview session domain entity
    const session = InterviewSession.createNew(
      command.userId,
      command.jobProfileId,
      InterviewType.create(command.interviewType),
      question,
    );

    // 4. Persist session
    await this.sessionRepository.save(session);

    // 5. Map to DTO
    return InterviewSessionMapper.toDto(session);
  }
}
```

#### 2.12 Module Registration (Updated)

**File:** `src/modules/interviews/interviews.module.ts`

```typescript
import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { InterviewsController } from './presentation/http/controllers/interviews.controller';
import { StartInterviewHandler } from './application/commands/handlers/start-interview.handler';
import { INTERVIEW_SESSION_REPOSITORY } from './domain/repositories/interview-session.repository.interface';
import { InterviewSessionRepository } from './infrastructure/persistence/repositories/interview-session.repository';
import { QUESTION_SELECTOR_SERVICE } from './domain/services/question-selector.service.interface';
import { QuestionSelectorService } from './infrastructure/services/question-selector.service';
import { JobProfilesModule } from '@modules/job-profiles/job-profiles.module';

const CommandHandlers = [StartInterviewHandler];

@Module({
  imports: [
    CqrsModule,
    JobProfilesModule, // Import to access JOB_PROFILES_ACL
  ],
  controllers: [InterviewsController],
  providers: [
    ...CommandHandlers,
    {
      provide: INTERVIEW_SESSION_REPOSITORY,
      useClass: InterviewSessionRepository,
    },
    {
      provide: QUESTION_SELECTOR_SERVICE,
      useClass: QuestionSelectorService,
    },
  ],
})
export class InterviewsModule {}
```

### Expected State After Step 2

- ✅ Returns real interview session from database
- ✅ Returns real question from question pool
- ✅ Validates job profile exists (404 if not found)
- ✅ Validates job profile belongs to user (403 if unauthorized)
- ✅ Question selection based on competencies and difficulty
- ✅ Session persisted to database
- ✅ All error codes work (404, 403, 500)

### Verification Command

```bash
# Start dev server
npm run dev

# Test with real job profile (replace with actual job profile ID)
curl -X POST http://localhost:3000/api/v1/interviews/start \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN" \
  -d '{
    "jobProfileId": "REAL_JOB_PROFILE_ID",
    "interviewType": "mixed"
  }'

# Expected response (200):
# {
#   "sessionId": "real-uuid-from-db",
#   "question": {
#     "id": "question-uuid-from-db",
#     "text": "Real question text from question_pool table",
#     "category": "leadership",
#     "difficulty": 6
#   },
#   "sessionToken": "session_real-uuid-from-db"
# }

# Test 404 - job profile not found
curl -X POST http://localhost:3000/api/v1/interviews/start \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN" \
  -d '{
    "jobProfileId": "00000000-0000-0000-0000-000000000000"
  }'

# Expected response (404):
# {
#   "statusCode": 404,
#   "message": "Job profile not found",
#   "error": "Not Found"
# }

# Test 403 - job profile belongs to another user
curl -X POST http://localhost:3000/api/v1/interviews/start \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN_USER_A" \
  -d '{
    "jobProfileId": "JOB_PROFILE_ID_OF_USER_B"
  }'

# Expected response (403):
# {
#   "statusCode": 403,
#   "message": "You do not have access to this job profile",
#   "error": "Forbidden"
# }

# Verify session in database
npm run db:studio
# Check interview_sessions table for new record
```

---

## Step 3: Documentation (Swagger/OpenAPI)

**Goal:** Complete API documentation with Swagger decorators

### What to Add

#### 3.1 Update Request DTO

**File:** `src/modules/interviews/presentation/http/dto/start-interview-request.dto.ts`

```typescript
import { IsString, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class StartInterviewRequestDto {
  @ApiProperty({
    description: 'Job profile ID to create interview for',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsString()
  jobProfileId: string;

  @ApiPropertyOptional({
    description: 'Type of interview to conduct',
    enum: ['behavioral', 'technical', 'mixed'],
    default: 'mixed',
    example: 'mixed',
  })
  @IsOptional()
  @IsEnum(['behavioral', 'technical', 'mixed'])
  interviewType?: 'behavioral' | 'technical' | 'mixed';
}
```

#### 3.2 Update Response DTO

**File:** `src/modules/interviews/presentation/http/dto/start-interview-response.dto.ts`

```typescript
import { ApiProperty } from '@nestjs/swagger';

export class QuestionResponseDto {
  @ApiProperty({
    description: 'Unique question identifier',
    example: '987e6543-e21b-12d3-a456-426614174999',
  })
  id: string;

  @ApiProperty({
    description: 'Question text',
    example: 'Tell me about a time when you led a team through a challenging project.',
  })
  text: string;

  @ApiProperty({
    description: 'Competency category',
    example: 'leadership',
  })
  category: string;

  @ApiProperty({
    description: 'Question difficulty level (1-10)',
    example: 6,
    minimum: 1,
    maximum: 10,
  })
  difficulty: number;
}

export class StartInterviewResponseDto {
  @ApiProperty({
    description: 'Interview session ID',
    example: '123e4567-e89b-12d3-a456-426614174001',
  })
  sessionId: string;

  @ApiProperty({
    description: 'First question in the interview',
    type: QuestionResponseDto,
  })
  question: QuestionResponseDto;

  @ApiProperty({
    description: 'Session token for subsequent requests',
    example: 'session_123e4567-e89b-12d3-a456-426614174001',
  })
  sessionToken: string;
}
```

#### 3.3 Update Controller

**File:** `src/modules/interviews/presentation/http/controllers/interviews.controller.ts`

```typescript
import { Controller, Post, Body, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { CommandBus } from '@nestjs/cqrs';
import { SupabaseGuard } from '@modules/auth/infrastructure/guards/supabase.guard';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { StartInterviewRequestDto } from '../dto/start-interview-request.dto';
import { StartInterviewResponseDto } from '../dto/start-interview-response.dto';
import { StartInterviewMapper } from '../mappers/start-interview.mapper';

@ApiTags('Interviews')
@Controller('interviews')
@UseGuards(SupabaseGuard)
@ApiBearerAuth()
export class InterviewsController {
  constructor(private readonly commandBus: CommandBus) {}

  @Post('start')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Start a new interview session',
    description:
      'Creates a new interview session for a specific job profile. Validates that the job profile exists and belongs to the authenticated user, then selects the first question based on job profile competencies and difficulty level.',
  })
  @ApiResponse({
    status: 200,
    description: 'Interview session successfully created',
    type: StartInterviewResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Validation error - invalid request body',
    schema: {
      example: {
        statusCode: 400,
        message: ['jobProfileId must be a string'],
        error: 'Bad Request',
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - missing or invalid JWT token',
    schema: {
      example: {
        statusCode: 401,
        message: 'Unauthorized',
      },
    },
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - job profile does not belong to the user',
    schema: {
      example: {
        statusCode: 403,
        message: 'You do not have access to this job profile',
        error: 'Forbidden',
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Not Found - job profile does not exist',
    schema: {
      example: {
        statusCode: 404,
        message: 'Job profile not found',
        error: 'Not Found',
      },
    },
  })
  @ApiResponse({
    status: 500,
    description: 'Internal Server Error',
    schema: {
      example: {
        statusCode: 500,
        message: 'Internal server error',
        error: 'Internal Server Error',
      },
    },
  })
  async startInterview(
    @Body() dto: StartInterviewRequestDto,
    @CurrentUser() user: { id: string },
  ): Promise<StartInterviewResponseDto> {
    const command = StartInterviewMapper.toCommand(dto, user.id);
    const result = await this.commandBus.execute(command);
    return StartInterviewMapper.toResponseDto(result);
  }
}
```

### Expected State After Step 3

- ✅ Full Swagger documentation
- ✅ All fields documented with examples
- ✅ All status codes documented (200, 400, 401, 403, 404, 500)
- ✅ Visible in Swagger UI at `/api`
- ✅ Request/response schemas complete

### Verification Commands

```bash
# Start dev server
npm run dev

# Open Swagger UI
open http://localhost:3000/api

# Verify:
# 1. "Interviews" tag exists
# 2. "POST /interviews/start" endpoint is documented
# 3. Request body schema shows jobProfileId and interviewType
# 4. Response schema shows sessionId, question, sessionToken
# 5. All status codes (200, 400, 401, 403, 404, 500) are documented
# 6. Examples are visible for all fields
```

---

## Step 4: Tests + Final Documentation

**Goal:** Production ready with comprehensive tests

### What to Add for Tests

#### 4.1 Command Handler Unit Tests

**File:** `src/modules/interviews/application/commands/handlers/start-interview.handler.spec.ts`

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { StartInterviewHandler } from './start-interview.handler';
import { StartInterviewCommand } from '../impl/start-interview.command';
import { INTERVIEW_SESSION_REPOSITORY } from '@modules/interviews/domain/repositories/interview-session.repository.interface';
import { QUESTION_SELECTOR_SERVICE } from '@modules/interviews/domain/services/question-selector.service.interface';
import { JOB_PROFILES_ACL } from '@modules/job-profiles/public';

describe('StartInterviewHandler', () => {
  let handler: StartInterviewHandler;
  let mockSessionRepository: any;
  let mockQuestionSelector: any;
  let mockJobProfilesACL: any;

  beforeEach(async () => {
    mockSessionRepository = {
      save: jest.fn(),
    };

    mockQuestionSelector = {
      selectQuestion: jest.fn(),
    };

    mockJobProfilesACL = {
      getJobProfileInfo: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StartInterviewHandler,
        {
          provide: INTERVIEW_SESSION_REPOSITORY,
          useValue: mockSessionRepository,
        },
        {
          provide: QUESTION_SELECTOR_SERVICE,
          useValue: mockQuestionSelector,
        },
        {
          provide: JOB_PROFILES_ACL,
          useValue: mockJobProfilesACL,
        },
      ],
    }).compile();

    handler = module.get<StartInterviewHandler>(StartInterviewHandler);
  });

  it('should be defined', () => {
    expect(handler).toBeDefined();
  });

  it('should create interview session with first question', async () => {
    // Arrange
    const command = new StartInterviewCommand(
      'job-profile-id',
      'user-id',
      'mixed',
    );

    mockJobProfilesACL.getJobProfileInfo.mockResolvedValue({
      id: 'job-profile-id',
      userId: 'user-id',
      jobTitle: 'Senior Software Engineer',
      competencies: [
        { name: 'leadership', weight: 0.8, depth: 3 },
        { name: 'communication', weight: 0.6, depth: 2 },
      ],
      interviewDifficultyLevel: 7,
    });

    mockQuestionSelector.selectQuestion.mockResolvedValue({
      id: 'question-id',
      text: 'Tell me about a time...',
      category: 'leadership',
      difficulty: 7,
    });

    // Act
    const result = await handler.execute(command);

    // Assert
    expect(result).toHaveProperty('sessionId');
    expect(result.question).toEqual({
      id: 'question-id',
      text: 'Tell me about a time...',
      category: 'leadership',
      difficulty: 7,
    });
    expect(result.sessionToken).toContain('session_');
    expect(mockSessionRepository.save).toHaveBeenCalledTimes(1);
  });

  it('should throw NotFoundException when job profile not found', async () => {
    // Arrange
    const command = new StartInterviewCommand(
      'non-existent-id',
      'user-id',
      'mixed',
    );

    mockJobProfilesACL.getJobProfileInfo.mockResolvedValue(null);

    // Act & Assert
    await expect(handler.execute(command)).rejects.toThrow(NotFoundException);
    expect(mockSessionRepository.save).not.toHaveBeenCalled();
  });

  it('should throw ForbiddenException when job profile belongs to another user', async () => {
    // Arrange
    const command = new StartInterviewCommand(
      'job-profile-id',
      'user-a',
      'mixed',
    );

    mockJobProfilesACL.getJobProfileInfo.mockResolvedValue({
      id: 'job-profile-id',
      userId: 'user-b', // Different user
      jobTitle: 'Senior Software Engineer',
      competencies: [],
      interviewDifficultyLevel: 7,
    });

    // Act & Assert
    await expect(handler.execute(command)).rejects.toThrow(ForbiddenException);
    expect(mockSessionRepository.save).not.toHaveBeenCalled();
  });

  it('should use default interview type when not provided', async () => {
    // Arrange
    const command = new StartInterviewCommand(
      'job-profile-id',
      'user-id',
      undefined, // No interview type
    );

    mockJobProfilesACL.getJobProfileInfo.mockResolvedValue({
      id: 'job-profile-id',
      userId: 'user-id',
      jobTitle: 'Senior Software Engineer',
      competencies: [{ name: 'leadership', weight: 0.8, depth: 3 }],
      interviewDifficultyLevel: 7,
    });

    mockQuestionSelector.selectQuestion.mockResolvedValue({
      id: 'question-id',
      text: 'Question text',
      category: 'leadership',
      difficulty: 7,
    });

    // Act
    await handler.execute(command);

    // Assert
    expect(mockQuestionSelector.selectQuestion).toHaveBeenCalledWith(
      expect.anything(),
      7,
      'mixed', // Should default to 'mixed'
    );
  });
});
```

#### 4.2 Controller Unit Tests

**File:** `src/modules/interviews/presentation/http/controllers/interviews.controller.spec.ts`

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { CommandBus } from '@nestjs/cqrs';
import { InterviewsController } from './interviews.controller';
import { StartInterviewRequestDto } from '../dto/start-interview-request.dto';

describe('InterviewsController', () => {
  let controller: InterviewsController;
  let commandBus: CommandBus;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [InterviewsController],
      providers: [
        {
          provide: CommandBus,
          useValue: {
            execute: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<InterviewsController>(InterviewsController);
    commandBus = module.get<CommandBus>(CommandBus);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should start interview and return session', async () => {
    // Arrange
    const dto: StartInterviewRequestDto = {
      jobProfileId: 'job-profile-id',
      interviewType: 'mixed',
    };

    const user = { id: 'user-id' };

    const mockResult = {
      sessionId: 'session-id',
      question: {
        id: 'question-id',
        text: 'Question text',
        category: 'leadership',
        difficulty: 7,
      },
      sessionToken: 'session_session-id',
    };

    jest.spyOn(commandBus, 'execute').mockResolvedValue(mockResult);

    // Act
    const result = await controller.startInterview(dto, user);

    // Assert
    expect(result).toEqual({
      sessionId: 'session-id',
      question: {
        id: 'question-id',
        text: 'Question text',
        category: 'leadership',
        difficulty: 7,
      },
      sessionToken: 'session_session-id',
    });
    expect(commandBus.execute).toHaveBeenCalledTimes(1);
  });
});
```

#### 4.3 E2E Test

**File:** `test/interviews/start-interview.e2e-spec.ts`

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '@/app.module';

describe('Start Interview (e2e)', () => {
  let app: INestApplication;
  let authToken: string;
  let jobProfileId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();

    // TODO: Setup test user and get auth token
    // TODO: Create test job profile
  });

  afterAll(async () => {
    await app.close();
  });

  it('POST /interviews/start - should create interview session', () => {
    return request(app.getHttpServer())
      .post('/interviews/start')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        jobProfileId,
        interviewType: 'mixed',
      })
      .expect(200)
      .expect((res) => {
        expect(res.body).toHaveProperty('sessionId');
        expect(res.body).toHaveProperty('question');
        expect(res.body.question).toHaveProperty('id');
        expect(res.body.question).toHaveProperty('text');
        expect(res.body.question).toHaveProperty('category');
        expect(res.body.question).toHaveProperty('difficulty');
        expect(res.body).toHaveProperty('sessionToken');
      });
  });

  it('POST /interviews/start - should return 401 without auth', () => {
    return request(app.getHttpServer())
      .post('/interviews/start')
      .send({
        jobProfileId,
      })
      .expect(401);
  });

  it('POST /interviews/start - should return 400 for invalid request', () => {
    return request(app.getHttpServer())
      .post('/interviews/start')
      .set('Authorization', `Bearer ${authToken}`)
      .send({})
      .expect(400);
  });

  it('POST /interviews/start - should return 404 for non-existent job profile', () => {
    return request(app.getHttpServer())
      .post('/interviews/start')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        jobProfileId: '00000000-0000-0000-0000-000000000000',
      })
      .expect(404);
  });
});
```

#### 4.4 Update README

**File:** `README.md` (add to API Endpoints section)

```markdown
### Start Interview Session

**POST** `/api/v1/interviews/start`

Creates a new interview session for a specific job profile.

**Authentication:** Required (JWT Bearer token)

**Request Body:**

```json
{
  "jobProfileId": "123e4567-e89b-12d3-a456-426614174000",
  "interviewType": "mixed" // Optional: "behavioral" | "technical" | "mixed"
}
```

**Response (200):**

```json
{
  "sessionId": "987e6543-e21b-12d3-a456-426614174001",
  "question": {
    "id": "question-uuid",
    "text": "Tell me about a time when you led a team through a challenging project.",
    "category": "leadership",
    "difficulty": 7
  },
  "sessionToken": "session_987e6543-e21b-12d3-a456-426614174001"
}
```

**Error Responses:**

- `400` - Validation error
- `401` - Unauthorized (missing/invalid JWT)
- `403` - Forbidden (job profile belongs to another user)
- `404` - Not Found (job profile does not exist)
- `500` - Internal Server Error

**Example:**

```bash
curl -X POST http://localhost:3000/api/v1/interviews/start \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "jobProfileId": "123e4567-e89b-12d3-a456-426614174000",
    "interviewType": "mixed"
  }'
```

### Expected State After Step 4

- ✅ All unit tests passing
- ✅ All E2E tests passing
- ✅ Code coverage > 80%
- ✅ Linter passes
- ✅ Build succeeds
- ✅ README updated
- ✅ **PRODUCTION READY**

### Verification Commands for Step 4

```bash
# Run all tests
npm test

# Run with coverage
npm run test:cov

# Run E2E tests
npm run test:e2e

# Lint
npm run lint

# Build
npm run build

# All should succeed
```

---

## Summary

### Complete File Checklist

**Domain Layer:**

- [x] `domain/value-objects/session-id.vo.ts`
- [x] `domain/value-objects/interview-type.vo.ts`
- [x] `domain/entities/interview-session.entity.ts`
- [x] `domain/repositories/interview-session.repository.interface.ts`
- [x] `domain/services/question-selector.service.interface.ts`

**Application Layer:**

- [x] `application/commands/impl/start-interview.command.ts`
- [x] `application/commands/handlers/start-interview.handler.ts`
- [x] `application/dto/question.dto.ts`
- [x] `application/dto/interview-session.dto.ts`
- [x] `application/mappers/interview-session.mapper.ts`

**Infrastructure Layer:**

- [x] `infrastructure/persistence/repositories/interview-session.repository.ts`
- [x] `infrastructure/persistence/mappers/interview-session-persistence.mapper.ts`
- [x] `infrastructure/services/question-selector.service.ts`

**Presentation Layer:**

- [x] `presentation/http/dto/start-interview-request.dto.ts`
- [x] `presentation/http/dto/start-interview-response.dto.ts`
- [x] `presentation/http/mappers/start-interview.mapper.ts`
- [x] `presentation/http/controllers/interviews.controller.ts`

**Cross-Module (Job Profiles):**

- [x] `job-profiles/public/acl/job-profiles.acl.interface.ts`
- [x] `job-profiles/public/acl/job-profiles.acl.tokens.ts`
- [x] `job-profiles/public/index.ts`
- [x] `job-profiles/infrastructure/acl/job-profiles.acl.service.ts`
- [x] Update `job-profiles/job-profiles.module.ts`

**Module:**

- [x] Update `interviews/interviews.module.ts`

**Tests:**

- [x] `application/commands/handlers/start-interview.handler.spec.ts`
- [x] `presentation/http/controllers/interviews.controller.spec.ts`
- [x] `test/interviews/start-interview.e2e-spec.ts`

**Documentation:**

- [x] Update `README.md`

### Step Summary Table

| Step | Description | Endpoint Status | Database | Tests |
| ------ | ------------- | ---------------- | ---------- | ------- |
| 1 | Basic endpoint structure | ✅ Returns placeholder | ❌ Not used | ❌ None |
| 2 | Real implementation | ✅ Returns real data | ✅ Persists session | ❌ None |
| 3 | Swagger documentation | ✅ Fully documented | ✅ Works | ❌ None |
| 4 | Tests + final docs | ✅ Production ready | ✅ Works | ✅ >80% coverage |

### Architectural Compliance

- ✅ **CQRS Pattern**: Uses `CommandBus` with `StartInterviewCommand`
- ✅ **Clean Architecture**: Clear layer separation (presentation → application → domain ← infrastructure)
- ✅ **Domain-Driven Design**: Rich `InterviewSession` entity with value objects
- ✅ **ACL Pattern**: Uses `IJobProfilesACL` for cross-module communication
- ✅ **Repository Pattern**: Domain repository interface + infrastructure implementation
- ✅ **Dependency Injection**: All dependencies injected via constructor
- ✅ **Explicit Mapping**: Mappers at every boundary (HTTP ↔ Application ↔ Domain ↔ Persistence)
- ✅ **Iterative Implementation**: 4-step methodology with continuous testing

---

## Notes

1. **Question Pool**: Ensure the `question_pool` table is seeded with questions before testing. If empty, the endpoint will throw "No questions available in question pool" error.

2. **Session Token**: The `sessionToken` is currently a simple concatenation (`session_${sessionId}`). For production, consider using JWT or encrypted tokens.

3. **Interview Type Default**: If `interviewType` is not provided, it defaults to `'mixed'` as per PRD specifications.

4. **Competency Selection**: The question selector picks the competency with the highest weight for the first question. Subsequent questions will use adaptive logic (implemented in future endpoints).

5. **Difficulty Adjustment**: The first question uses the job profile's `interview_difficulty_level` ± 1 to find suitable questions.

6. **Error Handling**: All errors are handled by the global exception filter defined in `src/common/filters/http-exception.filter.ts`.

---

**Implementation Status:** ✅ Ready for Development
**Last Updated:** 2026-02-03
**Follows:** Iterative Endpoint Implementation Methodology
