/**
 * Auth Module
 *
 * Module for authentication functionality using Supabase.
 * Provides registration, login, and JWT-based authentication guard.
 */

import { Module } from "@nestjs/common";
import { CqrsModule } from "@nestjs/cqrs";
import { PassportModule } from "@nestjs/passport";

import { LoginHandler } from "./application/commands/handlers/login.handler";
import { RegisterHandler } from "./application/commands/handlers/register.handler";
import { GetCurrentUserHandler } from "./application/queries/handlers/get-current-user.handler";
import { AuthService } from "./auth.service";
import { SupabaseJwtGuard } from "./guards/supabase-jwt.guard";
import { AuthController } from "./presentation/http/controllers/auth.controller";
import { SupabaseJwtStrategy } from "./strategies/supabase-jwt.strategy";

@Module({
  controllers: [AuthController],
  exports: [SupabaseJwtGuard, SupabaseJwtStrategy],
  imports: [CqrsModule, PassportModule],
  providers: [
    // Service
    AuthService,
    // Command Handlers
    RegisterHandler,
    LoginHandler,
    // Query Handlers
    GetCurrentUserHandler,
    // Auth Strategy & Guard
    SupabaseJwtStrategy,
    SupabaseJwtGuard,
  ],
})
export class AuthModule {}
