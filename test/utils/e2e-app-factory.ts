/**
 * E2E Test Application Factory
 *
 * Factory for creating NestJS test applications for e2e testing.
 * Provides consistent setup across all e2e test suites.
 */

import { INestApplication, ValidationPipe } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { Test, TestingModule } from "@nestjs/testing";

import { HttpExceptionFilter } from "../../src/common/filters/http-exception.filter";

export interface E2ETestAppOptions {
  controllers?: any[];
  enableSwagger?: boolean;
  enableValidation?: boolean;
  imports?: any[];
  providers?: any[];
}

export class E2ETestAppFactory {
  /**
   * Creates a NestJS test application with standard configuration
   */
  static async create(
    options: E2ETestAppOptions = {},
  ): Promise<INestApplication> {
    const {
      controllers = [],
      enableSwagger = false,
      enableValidation = true,
      imports = [],
      providers = [],
    } = options;

    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers,
      imports: [
        ConfigModule.forRoot({
          envFilePath: [".env.test", ".env"],
          isGlobal: true,
        }),
        ...imports,
      ],
      providers,
    }).compile();

    const app = moduleFixture.createNestApplication();

    // Apply global pipes (validation)
    if (enableValidation) {
      app.useGlobalPipes(
        new ValidationPipe({
          forbidNonWhitelisted: true,
          transform: true,
          whitelist: true,
        }),
      );
    }

    // Apply global filters
    const configService = app.get(ConfigService);
    app.useGlobalFilters(new HttpExceptionFilter(configService));

    // Setup Swagger for API documentation testing
    if (enableSwagger) {
      const config = new DocumentBuilder()
        .setTitle("Mentor API Test")
        .setDescription("Test API documentation")
        .setVersion("1.0")
        .addBearerAuth()
        .build();

      const document = SwaggerModule.createDocument(app, config);
      SwaggerModule.setup("api-docs", app, document);
    }

    await app.init();
    return app;
  }

  /**
   * Creates a minimal test application for simple module testing
   */
  static async createMinimal(module: any): Promise<INestApplication> {
    return this.create({
      imports: [module],
    });
  }

  /**
   * Creates a test application with database support
   */
  static async createWithDatabase(
    options: E2ETestAppOptions = {},
  ): Promise<INestApplication> {
    const { TestDatabaseModule } =
      await import("../database/test-database.module");

    return this.create({
      ...options,
      imports: [TestDatabaseModule, ...(options.imports || [])],
    });
  }

  /**
   * Cleanup method for test applications
   */
  static async cleanup(app: INestApplication): Promise<void> {
    if (app) {
      await app.close();
    }
  }
}
