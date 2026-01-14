// Global e2e test setup
import 'reflect-metadata';
import * as path from 'path';
import * as dotenv from 'dotenv';
import { DatabaseTestUtils } from '../database/database-test-utils';

// Load .env.test file directly before anything else
dotenv.config({ path: path.join(process.cwd(), '.env.test') });
dotenv.config({ path: path.join(process.cwd(), '.env') });

// Set test environment
process.env.NODE_ENV = 'test';

// Global test timeout for e2e tests
jest.setTimeout(30000);

// Global setup and teardown for e2e tests
beforeAll(async () => {
  await DatabaseTestUtils.setupTestDatabase();
});

afterAll(async () => {
  await DatabaseTestUtils.closeTestDatabase();
});