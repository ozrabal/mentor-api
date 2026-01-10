import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { ConfigModule } from './config/config.module';
import { DatabaseModule } from './database/database.module';
import { HealthModule } from './modules/health/health.module';

@Module({
  imports: [
    CqrsModule, // Global CQRS module for Commands/Queries pattern
    ConfigModule,
    DatabaseModule,
    HealthModule,
  ],
})
export class AppModule {}

