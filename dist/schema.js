"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.questionPool = exports.interviewReports = exports.interviewSessions = exports.jobProfiles = exports.users = void 0;
const pg_core_1 = require("drizzle-orm/pg-core");
exports.users = (0, pg_core_1.pgTable)('users', {
    id: (0, pg_core_1.uuid)('id').defaultRandom().primaryKey(),
    email: (0, pg_core_1.varchar)('email', { length: 255 }).notNull().unique(),
    identityId: (0, pg_core_1.varchar)('identity_id', { length: 255 }).notNull(),
    createdAt: (0, pg_core_1.timestamp)('created_at', { withTimezone: false })
        .defaultNow()
        .notNull(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at', { withTimezone: false })
        .defaultNow()
        .notNull(),
});
exports.jobProfiles = (0, pg_core_1.pgTable)('job_profiles', {
    id: (0, pg_core_1.uuid)('id').defaultRandom().primaryKey(),
    userId: (0, pg_core_1.uuid)('user_id')
        .notNull()
        .references(() => exports.users.id),
    jobTitle: (0, pg_core_1.varchar)('job_title', { length: 255 }),
    companyName: (0, pg_core_1.varchar)('company_name', { length: 255 }),
    jobUrl: (0, pg_core_1.text)('job_url'),
    rawJd: (0, pg_core_1.text)('raw_jd'),
    competencies: (0, pg_core_1.jsonb)('competencies').$type(),
    softSkills: (0, pg_core_1.jsonb)('soft_skills').$type(),
    hardSkills: (0, pg_core_1.jsonb)('hard_skills').$type(),
    seniorityLevel: (0, pg_core_1.integer)('seniority_level'),
    interviewDifficultyLevel: (0, pg_core_1.real)('interview_difficulty_level'),
    createdAt: (0, pg_core_1.timestamp)('created_at', { withTimezone: false })
        .defaultNow()
        .notNull(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at', { withTimezone: false })
        .defaultNow()
        .notNull(),
});
exports.interviewSessions = (0, pg_core_1.pgTable)('interview_sessions', {
    id: (0, pg_core_1.uuid)('id').defaultRandom().primaryKey(),
    userId: (0, pg_core_1.uuid)('user_id')
        .notNull()
        .references(() => exports.users.id),
    jobProfileId: (0, pg_core_1.uuid)('job_profile_id').references(() => exports.jobProfiles.id),
    interviewType: (0, pg_core_1.varchar)('interview_type', { length: 50 }),
    status: (0, pg_core_1.varchar)('status', { length: 50 }),
    questionsAsked: (0, pg_core_1.jsonb)('questions_asked').$type(),
    responses: (0, pg_core_1.jsonb)('responses').$type(),
    clarityScores: (0, pg_core_1.jsonb)('clarity_scores').$type(),
    completenessScores: (0, pg_core_1.jsonb)('completeness_scores').$type(),
    relevanceScores: (0, pg_core_1.jsonb)('relevance_scores').$type(),
    confidenceScores: (0, pg_core_1.jsonb)('confidence_scores').$type(),
    overallScores: (0, pg_core_1.jsonb)('overall_scores').$type(),
    sessionOverallScore: (0, pg_core_1.real)('session_overall_score'),
    createdAt: (0, pg_core_1.timestamp)('created_at', { withTimezone: false })
        .defaultNow()
        .notNull(),
    completedAt: (0, pg_core_1.timestamp)('completed_at', { withTimezone: false }),
});
exports.interviewReports = (0, pg_core_1.pgTable)('interview_reports', {
    id: (0, pg_core_1.uuid)('id').defaultRandom().primaryKey(),
    interviewSessionId: (0, pg_core_1.uuid)('interview_session_id')
        .notNull()
        .unique()
        .references(() => exports.interviewSessions.id),
    competencyBreakdown: (0, pg_core_1.jsonb)('competency_breakdown').$type(),
    successProbability: (0, pg_core_1.real)('success_probability'),
    feedbackSummary: (0, pg_core_1.text)('feedback_summary'),
    topGaps: (0, pg_core_1.jsonb)('top_gaps').$type(),
    strengths: (0, pg_core_1.jsonb)('strengths').$type(),
    createdAt: (0, pg_core_1.timestamp)('created_at', { withTimezone: false })
        .defaultNow()
        .notNull(),
});
exports.questionPool = (0, pg_core_1.pgTable)('question_pool', {
    id: (0, pg_core_1.uuid)('id').defaultRandom().primaryKey(),
    text: (0, pg_core_1.text)('text').notNull(),
    competency: (0, pg_core_1.varchar)('competency', { length: 100 }).notNull(),
    difficulty: (0, pg_core_1.integer)('difficulty').notNull(),
    type: (0, pg_core_1.varchar)('type', { length: 50 }).notNull(),
    language: (0, pg_core_1.varchar)('language', { length: 10 }).default('en'),
});
//# sourceMappingURL=schema.js.map