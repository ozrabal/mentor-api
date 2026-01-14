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
  integer,
  jsonb,
  pgTable,
  real,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

// users
export const users = pgTable("users", {
  createdAt: timestamp("created_at", { withTimezone: false })
    .defaultNow()
    .notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  id: uuid("id").defaultRandom().primaryKey(),
  identityId: varchar("identity_id", { length: 255 }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: false })
    .defaultNow()
    .notNull(),
});

// job_profiles
export const jobProfiles = pgTable("job_profiles", {
  companyName: varchar("company_name", { length: 255 }),
  competencies:
    jsonb("competencies").$type<
      Array<{ depth: number; name: string; weight: number }>
    >(),
  createdAt: timestamp("created_at", { withTimezone: false })
    .defaultNow()
    .notNull(),
  hardSkills: jsonb("hard_skills").$type<string[]>(),
  id: uuid("id").defaultRandom().primaryKey(),
  interviewDifficultyLevel: real("interview_difficulty_level"),
  jobTitle: varchar("job_title", { length: 255 }),
  jobUrl: text("job_url"),
  rawJd: text("raw_jd"),
  seniorityLevel: integer("seniority_level"),
  softSkills: jsonb("soft_skills").$type<string[]>(),
  updatedAt: timestamp("updated_at", { withTimezone: false })
    .defaultNow()
    .notNull(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id),
});

// interview_sessions
export const interviewSessions = pgTable("interview_sessions", {
  clarityScores: jsonb("clarity_scores").$type<number[]>(),
  completedAt: timestamp("completed_at", { withTimezone: false }),
  completenessScores: jsonb("completeness_scores").$type<number[]>(),
  confidenceScores: jsonb("confidence_scores").$type<number[]>(),
  createdAt: timestamp("created_at", { withTimezone: false })
    .defaultNow()
    .notNull(),
  id: uuid("id").defaultRandom().primaryKey(),
  interviewType: varchar("interview_type", { length: 50 }), // 'behavioral' | 'technical' | 'mixed'
  jobProfileId: uuid("job_profile_id").references(() => jobProfiles.id),
  overallScores: jsonb("overall_scores").$type<number[]>(),
  questionsAsked:
    jsonb("questions_asked").$type<
      Array<{ category: string; difficulty: number; id: string; text: string }>
    >(),
  relevanceScores: jsonb("relevance_scores").$type<number[]>(),
  responses:
    jsonb("responses").$type<
      Array<{ answer_text: string; question_id: string; timestamp: string }>
    >(),
  sessionOverallScore: real("session_overall_score"),
  status: varchar("status", { length: 50 }), // 'in_progress' | 'completed'
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id),
});

// interview_reports
export const interviewReports = pgTable("interview_reports", {
  competencyBreakdown: jsonb("competency_breakdown").$type<
    Record<
      string,
      {
        comment: string;
        gap: number;
        score: number;
      }
    >
  >(),
  createdAt: timestamp("created_at", { withTimezone: false })
    .defaultNow()
    .notNull(),
  feedbackSummary: text("feedback_summary"),
  id: uuid("id").defaultRandom().primaryKey(),
  interviewSessionId: uuid("interview_session_id")
    .notNull()
    .unique()
    .references(() => interviewSessions.id),
  strengths: jsonb("strengths").$type<string[]>(),
  successProbability: real("success_probability"),
  topGaps: jsonb("top_gaps").$type<
    Array<{
      action: string;
      gap: string;
      priority: "HIGH" | "LOW" | "MEDIUM";
    }>
  >(),
});

// question_pool
export const questionPool = pgTable("question_pool", {
  competency: varchar("competency", { length: 100 }).notNull(),
  difficulty: integer("difficulty").notNull(), // 1-10
  id: uuid("id").defaultRandom().primaryKey(),
  language: varchar("language", { length: 10 }).default("en"),
  text: text("text").notNull(),
  type: varchar("type", { length: 50 }).notNull(), // 'behavioral' | 'technical' | 'culture'
});
