import { ValidationPipe } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { NestFactory } from "@nestjs/core";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";

import { AppModule } from "./app.module";
import { HttpExceptionFilter } from "./common/filters/http-exception.filter";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);
  const port = configService.get<number>("PORT") || 3000;

  // Global exception filter
  app.useGlobalFilters(new HttpExceptionFilter(configService));

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      forbidNonWhitelisted: true,
      transform: true,
      whitelist: true,
    }),
  );

  // CORS
  app.enableCors();

  // Swagger Documentation (only in non-production environments)
  const nodeEnv = configService.get<string>("NODE_ENV") || "development";
  if (nodeEnv !== "production") {
    const config = new DocumentBuilder()
      .setTitle("Mentor API")
      .setDescription(
        "API for AI-powered mock interview preparation. Parses job descriptions, generates tailored interviews, scores answers, and predicts interview success probability.",
      )
      .setVersion("1.0.0")
      .addServer(`http://localhost:${port}`, "Development")
      .addBearerAuth(
        {
          bearerFormat: "JWT",
          description: "Enter JWT token",
          in: "header",
          name: "JWT",
          scheme: "bearer",
          type: "http",
        },
        "JWT-auth",
      )
      .addTag("health", "Health check endpoints")
      .addTag("auth", "Authentication endpoints")
      .addTag("job-profiles", "Job profile management")
      .addTag("interviews", "Interview session management")
      .addTag("reports", "Interview reports")
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup("api/docs", app, document);

    console.log(
      `Swagger documentation available at: http://localhost:${port}/api/docs`,
    );
  }

  await app.listen(port);
  console.log(`Application is running on: http://localhost:${port}`);
}

void bootstrap();
