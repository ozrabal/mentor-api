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

import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';
import { DatabaseService, DRIZZLE_DB, DRIZZLE_POOL } from './database.service';

@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: DRIZZLE_POOL,
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const connectionString = configService.get<string>('DATABASE_URL');

        if (!connectionString) {
          throw new Error('DATABASE_URL is not defined');
        }

        return new Pool({
          connectionString,
        });
      },
    },
    {
      provide: DRIZZLE_DB,
      inject: [DRIZZLE_POOL],
      useFactory: (pool: Pool) =>
        drizzle(pool, {
          schema,
        }),
    },
    DatabaseService,
  ],
  exports: [DatabaseService, DRIZZLE_DB],
})
export class DatabaseModule {}


