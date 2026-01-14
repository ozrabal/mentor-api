/**
 * Database Test Utilities
 * 
 * Provides utilities for database testing including:
 * - Test database connection setup
 * - Transaction-based test isolation
 * - Database cleanup and seeding
 */

import { ConfigService } from '@nestjs/config';
import { drizzle, NodePgDatabase } from 'drizzle-orm/node-postgres';
import { Pool, PoolClient } from 'pg';
import * as schema from '@/database/schema';

export type TestDatabase = NodePgDatabase<typeof schema>;

export class DatabaseTestUtils {
  private static pool: Pool;
  private static db: TestDatabase;
  private static clients: Map<string, PoolClient> = new Map();

  static async setupTestDatabase(): Promise<TestDatabase> {
    if (this.db) {
      return this.db;
    }

    const testDatabaseUrl = process.env.TEST_DATABASE_URL || process.env.DATABASE_URL;
    
    if (!testDatabaseUrl) {
      throw new Error('TEST_DATABASE_URL or DATABASE_URL must be set for testing');
    }

    this.pool = new Pool({
      connectionString: testDatabaseUrl,
      max: 5, // Lower pool size for tests
    });

    this.db = drizzle(this.pool, { schema });
    return this.db;
  }

  static async getTestTransaction(testId: string): Promise<TestDatabase> {
    const client = await this.pool.connect();
    await client.query('BEGIN');
    
    this.clients.set(testId, client);
    
    // Return a database instance wrapped in transaction
    return drizzle(client, { schema });
  }

  static async rollbackTestTransaction(testId: string): Promise<void> {
    const client = this.clients.get(testId);
    if (client) {
      await client.query('ROLLBACK');
      client.release();
      this.clients.delete(testId);
    }
  }

  static async cleanupTestData(): Promise<void> {
    if (!this.db) return;

    // Clean up all tables in reverse dependency order
    await this.db.delete(schema.interviewReports);
    await this.db.delete(schema.interviewSessions);
    await this.db.delete(schema.jobProfiles);
    await this.db.delete(schema.questionPool);
    await this.db.delete(schema.users);
  }

  static async closeTestDatabase(): Promise<void> {
    // Close any remaining transactions
    for (const [testId, client] of this.clients.entries()) {
      try {
        await client.query('ROLLBACK');
        client.release();
      } catch (error) {
        console.warn(`Failed to rollback transaction for test ${testId}:`, error);
      }
    }
    this.clients.clear();

    if (this.pool) {
      await this.pool.end();
    }
  }

  static createConfigService(): ConfigService {
    return {
      get: (key: string) => {
        const env = {
          DATABASE_URL: process.env.TEST_DATABASE_URL || process.env.DATABASE_URL,
          NODE_ENV: 'test',
        };
        return env[key as keyof typeof env];
      },
    } as ConfigService;
  }
}