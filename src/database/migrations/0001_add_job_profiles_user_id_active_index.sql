CREATE INDEX IF NOT EXISTS "idx_job_profiles_user_id_active"
ON "job_profiles" ("user_id")
WHERE "deleted_at" IS NULL;
