/**
 * Health Module
 *
 * Module for health check functionality.
 * This is a simple module that follows the modular monolith architecture.
 */

import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { HealthController } from './presentation/http/controllers/health.controller';
import { GetHealthHandler } from './application/queries/handlers/get-health.handler';

@Module({
  imports: [CqrsModule],
  controllers: [HealthController],
  providers: [
    // Query Handlers
    GetHealthHandler,
  ],
  exports: [], // No public contracts exported (health check is internal)
})
export class HealthModule {}
