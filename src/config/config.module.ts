import { Module } from "@nestjs/common";
import { ConfigModule as NestConfigModule } from "@nestjs/config";
import { z } from "zod";

const envSchema = z.object({
  // Claude API
  CLAUDE_API_KEY: z.string().min(1),
  // Database
  DATABASE_URL: z.string().min(1),
  JWT_SECRET: z.string().min(32).optional(),

  // Application
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),

  PORT: z.string().regex(/^\d+$/).transform(Number).default("3000"),

  SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  // Supabase
  SUPABASE_URL: z.string().url(),
});

export type Env = z.infer<typeof envSchema>;

function validate(config: Record<string, unknown>): Env {
  const result = envSchema.safeParse(config);

  if (!result.success) {
    const errors = result.error.errors.map((err) => ({
      message: err.message,
      path: err.path.join("."),
    }));

    throw new Error(
      `Environment validation failed:\n${errors.map((e) => `  - ${e.path}: ${e.message}`).join("\n")}`,
    );
  }

  return result.data;
}

@Module({
  imports: [
    NestConfigModule.forRoot({
      envFilePath: ".env",
      isGlobal: true,
      validate,
    }),
  ],
})
export class ConfigModule {}
