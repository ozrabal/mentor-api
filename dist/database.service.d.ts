import { OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';
export declare const DRIZZLE_POOL = "DRIZZLE_POOL";
export declare const DRIZZLE_DB = "DRIZZLE_DB";
export type DrizzleDb = ReturnType<typeof drizzle<typeof schema>>;
export declare class DatabaseService implements OnModuleDestroy {
    private readonly dbInstance;
    private readonly pool;
    private readonly configService;
    constructor(dbInstance: DrizzleDb, pool: Pool, configService: ConfigService);
    get db(): DrizzleDb;
    onModuleDestroy(): Promise<void>;
}
