/**
 * Database Schema Definitions
 *
 * NOTE: This file is temporary and will be refactored in Phase 2+.
 * Schema definitions will be moved to module-specific ORM entities:
 * - src/modules/users/infrastructure/persistence/orm-entities/
 * - src/modules/job-profiles/infrastructure/persistence/orm-entities/
 * - src/modules/interview-sessions/infrastructure/persistence/orm-entities/
 * - src/modules/interview-reports/infrastructure/persistence/orm-entities/
 * - src/modules/question-pool/infrastructure/persistence/orm-entities/
 *
 * The database module will then aggregate schemas from all modules.
 */

import {
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
  integer,
  real,
} from 'drizzle-orm/pg-core';

// users
export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  identityId: varchar('identity_id', { length: 255 }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: false })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: false })
    .defaultNow()
    .notNull(),
});

// job_profiles
export const jobProfiles = pgTable('job_profiles', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id),
  jobTitle: varchar('job_title', { length: 255 }),
  companyName: varchar('company_name', { length: 255 }),
  jobUrl: text('job_url'),
  rawJd: text('raw_jd'),
  competencies: jsonb('competencies').$type<
    Array<{ name: string; weight: number; depth: number }>
  >(),
  softSkills: jsonb('soft_skills').$type<string[]>(),
  hardSkills: jsonb('hard_skills').$type<string[]>(),
  seniorityLevel: integer('seniority_level'),
  interviewDifficultyLevel: real('interview_difficulty_level'),
  createdAt: timestamp('created_at', { withTimezone: false })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: false })
    .defaultNow()
    .notNull(),
});

// interview_sessions
export const interviewSessions = pgTable('interview_sessions', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id),
  jobProfileId: uuid('job_profile_id').references(() => jobProfiles.id),
  interviewType: varchar('interview_type', { length: 50 }), // 'behavioral' | 'technical' | 'mixed'
  status: varchar('status', { length: 50 }), // 'in_progress' | 'completed'
  questionsAsked: jsonb('questions_asked').$type<
    Array<{ id: string; text: string; category: string; difficulty: number }>
  >(),
  responses: jsonb('responses').$type<
    Array<{ question_id: string; answer_text: string; timestamp: string }>
  >(),
  clarityScores: jsonb('clarity_scores').$type<number[]>(),
  completenessScores: jsonb('completeness_scores').$type<number[]>(),
  relevanceScores: jsonb('relevance_scores').$type<number[]>(),
  confidenceScores: jsonb('confidence_scores').$type<number[]>(),
  overallScores: jsonb('overall_scores').$type<number[]>(),
  sessionOverallScore: real('session_overall_score'),
  createdAt: timestamp('created_at', { withTimezone: false })
    .defaultNow()
    .notNull(),
  completedAt: timestamp('completed_at', { withTimezone: false }),
});

// interview_reports
export const interviewReports = pgTable('interview_reports', {
  id: uuid('id').defaultRandom().primaryKey(),
  interviewSessionId: uuid('interview_session_id')
    .notNull()
    .unique()
    .references(() => interviewSessions.id),
  competencyBreakdown: jsonb('competency_breakdown').$type<
    Record<
      string,
      {
        score: number;
        gap: number;
        comment: string;
      }
    >
  >(),
  successProbability: real('success_probability'),
  feedbackSummary: text('feedback_summary'),
  topGaps: jsonb('top_gaps').$type<
    Array<{
      gap: string;
      priority: 'HIGH' | 'MEDIUM' | 'LOW';
      action: string;
    }>
  >(),
  strengths: jsonb('strengths').$type<string[]>(),
  createdAt: timestamp('created_at', { withTimezone: false })
    .defaultNow()
    .notNull(),
});

// question_pool
export const questionPool = pgTable('question_pool', {
  id: uuid('id').defaultRandom().primaryKey(),
  text: text('text').notNull(),
  competency: varchar('competency', { length: 100 }).notNull(),
  difficulty: integer('difficulty').notNull(), // 1-10
  type: varchar('type', { length: 50 }).notNull(), // 'behavioral' | 'technical' | 'culture'
  language: varchar('language', { length: 10 }).default('en'),
});


