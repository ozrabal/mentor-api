/**
 * Database Module
 *
 * This module provides database connection setup only.
 * It exports:
 * - DRIZZLE_POOL: PostgreSQL connection pool
 * - DRIZZLE_DB: Drizzle database instance
 * - DatabaseService: Service for accessing the database
 *
 * NOTE: Schema definitions are currently in ./schema.ts but will be moved
 * to module-specific ORM entities in Phase 2+ of the refactoring.
 * Each module will define its own ORM entities in:
 * src/modules/<module-name>/infrastructure/persistence/orm-entities/
 */

import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import { DatabaseService, DRIZZLE_DB, DRIZZLE_POOL } from "./database.service";
import * as schema from "./schema";

@Module({
  exports: [DatabaseService, DRIZZLE_DB],
  imports: [ConfigModule],
  providers: [
    {
      inject: [ConfigService],
      provide: DRIZZLE_POOL,
      useFactory: (configService: ConfigService) => {
        const connectionString = configService.get<string>("DATABASE_URL");

        if (!connectionString) {
          throw new Error("DATABASE_URL is not defined");
        }

        return new Pool({
          connectionString,
        });
      },
    },
    {
      inject: [DRIZZLE_POOL],
      provide: DRIZZLE_DB,
      useFactory: (pool: Pool) =>
        drizzle(pool, {
          schema,
        }),
    },
    DatabaseService,
  ],
})
export class DatabaseModule {}
