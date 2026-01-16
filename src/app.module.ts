import { Module } from "@nestjs/common";
import { CqrsModule } from "@nestjs/cqrs";
import { PassportModule } from "@nestjs/passport";

import { ConfigModule } from "./config/config.module";
import { DatabaseModule } from "./database/database.module";
import { AuthModule } from "./modules/auth/auth.module";
import { HealthModule } from "./modules/health/health.module";

@Module({
  imports: [
    CqrsModule, // Global CQRS module for Commands/Queries pattern
    PassportModule,
    ConfigModule,
    DatabaseModule,
    AuthModule,
    HealthModule,
  ],
})
export class AppModule {}
