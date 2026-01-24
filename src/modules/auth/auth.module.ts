/**
 * Auth Module
 *
 * Module for authentication functionality using Supabase.
 * Provides registration, login, and JWT-based authentication guard.
 */

import { Module } from "@nestjs/common";
import { CqrsModule } from "@nestjs/cqrs";
import { PassportModule } from "@nestjs/passport";

import { DatabaseModule } from "@/database/database.module";

import { LoginHandler } from "./application/commands/handlers/login.handler";
import { RegisterHandler } from "./application/commands/handlers/register.handler";
import { GetCurrentUserHandler } from "./application/queries/handlers/get-current-user.handler";
import { AuthService } from "./auth.service";
import { USER_REPOSITORY } from "./domain/repositories/user.repository.interface";
import { SupabaseJwtGuard } from "./guards/supabase-jwt.guard";
import { UsersACLService } from "./infrastructure/acl/users.acl.service";
import { UserRepository } from "./infrastructure/persistence/repositories/user.repository";
import { AuthController } from "./presentation/http/controllers/auth.controller";
import { USERS_ACL } from "./public/acl/users.acl.tokens";
import { SupabaseJwtStrategy } from "./strategies/supabase-jwt.strategy";

@Module({
  controllers: [AuthController],
  exports: [SupabaseJwtGuard, SupabaseJwtStrategy, USERS_ACL],
  imports: [CqrsModule, PassportModule, DatabaseModule],
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
    // Repository
    {
      provide: USER_REPOSITORY,
      useClass: UserRepository,
    },
    // ACL
    {
      provide: USERS_ACL,
      useClass: UsersACLService,
    },
  ],
})
export class AuthModule {}
