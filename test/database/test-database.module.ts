/**
 * Test Database Module
 * 
 * A specialized database module for testing that provides:
 * - Isolated test database connections
 * - Transaction-based test isolation
 * - Test data cleanup utilities
 */

import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from '@/database/schema';
import { DRIZZLE_DB, DRIZZLE_POOL } from '@/database/database.service';
import * as path from 'path';
import * as dotenv from 'dotenv';

// Load .env.test file directly
dotenv.config({ path: path.join(process.cwd(), '.env.test') });
dotenv.config({ path: path.join(process.cwd(), '.env') });

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: ['.env.test', '.env'],
      isGlobal: true,
    }),
  ],
  providers: [
    {
      provide: DRIZZLE_POOL,
      useFactory: () => {
        const testDatabaseUrl = 
          process.env.TEST_DATABASE_URL ||
          process.env.DATABASE_URL;

        if (!testDatabaseUrl) {
          throw new Error('TEST_DATABASE_URL or DATABASE_URL must be set for testing');
        }

        return new Pool({
          connectionString: testDatabaseUrl,
          max: 5, // Lower pool size for tests
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
  ],
  exports: [DRIZZLE_DB, DRIZZLE_POOL],
})
export class TestDatabaseModule {}