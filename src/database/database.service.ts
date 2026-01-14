/**
 * Database Service
 *
 * Provides access to the Drizzle database instance and connection pool.
 * This service handles connection lifecycle management.
 */

import { Inject, Injectable, OnModuleDestroy } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import * as schema from "./schema";

export const DRIZZLE_POOL = "DRIZZLE_POOL";
export const DRIZZLE_DB = "DRIZZLE_DB";

export type DrizzleDb = ReturnType<typeof drizzle<typeof schema>>;

@Injectable()
export class DatabaseService implements OnModuleDestroy {
  constructor(
    @Inject(DRIZZLE_DB) private readonly dbInstance: DrizzleDb,
    @Inject(DRIZZLE_POOL) private readonly pool: Pool,
    private readonly configService: ConfigService,
  ) {}

  get db(): DrizzleDb {
    return this.dbInstance;
  }

  async onModuleDestroy(): Promise<void> {
    await this.pool.end();
  }
}
