/**
 * Health Module
 *
 * Module for health check functionality.
 * This is a simple module that follows the modular monolith architecture.
 */

import { Module } from "@nestjs/common";
import { CqrsModule } from "@nestjs/cqrs";

import { AuthModule } from "../auth/auth.module";
import { GetHealthHandler } from "./application/queries/handlers/get-health.handler";
import { HealthController } from "./presentation/http/controllers/health.controller";

@Module({
  controllers: [HealthController],
  exports: [], // No public contracts exported (health check is internal)
  imports: [CqrsModule, AuthModule],
  providers: [
    // Query Handlers
    GetHealthHandler,
  ],
})
export class HealthModule {}
