import { google } from "@ai-sdk/google";
import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { generateObject } from "ai";
import { z } from "zod";

import { JobDescriptionParsingError } from "../../domain/errors/job-profile.errors";

// Zod schema for structured output validation
const ParsedJobDescriptionSchema = z.object({
  company_name: z.string().nullable().optional(),
  competencies: z
    .array(
      z.object({
        depth: z.number().min(1).max(10),
        name: z.string(),
        weight: z.number().min(0).max(1),
      }),
    )
    .min(3)
    .max(7),
  hard_skills: z.array(z.string()),
  interview_difficulty_level: z.number().min(1).max(10),
  job_title: z.string(),
  seniority_level: z.number().min(1).max(10),
  soft_skills: z.array(z.string()),
});

export interface ParsedJobDescription {
  company_name?: string;
  competencies: Array<{ depth: number; name: string; weight: number }>;
  hard_skills: string[];
  interview_difficulty_level: number;
  job_title: string;
  seniority_level: number;
  soft_skills: string[];
}

@Injectable()
export class AiParserService {
  private readonly logger = new Logger(AiParserService.name);
  private readonly model: any;

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>(
      "GOOGLE_GENERATIVE_AI_API_KEY",
    );
    if (!apiKey) {
      throw new Error("GOOGLE_GENERATIVE_AI_API_KEY is not configured");
    }

    // Initialize model - can be easily switched to other providers
    // Examples:
    // - openai('gpt-4-turbo') for OpenAI
    // - anthropic('claude-3-5-sonnet-20241022') for Anthropic
    // - google('gemini-1.5-pro') for Google
    const modelName =
      this.configService.get<string>("AI_MODEL") || "gemini-3-flash-preview";
    this.model = google(modelName);

    this.logger.log(`Initialized AI parser with model: ${modelName}`);
  }

  async parseJobDescription(jdText: string): Promise<ParsedJobDescription> {
    try {
      this.logger.log("Calling AI API to parse job description");

      const prompt = this.buildPrompt(jdText);

      // Use Vercel AI SDK's generateObject for structured output
      // Cast to any to avoid complex Zod type inference issues
      const result = await generateObject({
        model: this.model,
        prompt,
        schema: ParsedJobDescriptionSchema as any,
      });
      const { object } = result;

      this.logger.log("Successfully parsed job description with AI");

      // Normalize competency weights to sum to 1.0
      const normalized = this.normalizeCompetencyWeights(object);

      return normalized;
    } catch (error) {
      this.logger.error(
        `Failed to parse job description: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
      if (error instanceof JobDescriptionParsingError) {
        throw error;
      }
      throw new JobDescriptionParsingError(
        error instanceof Error ? error.message : "Unknown error",
      );
    }
  }

  private buildPrompt(jdText: string): string {
    return `Extract structured information from the following job description.

Rules:
- Extract the job title and company name (if mentioned)
- Determine seniority level (1=junior, 5=mid, 10=senior/principal)
- Identify 3-7 key competencies with:
  * name: specific competency (e.g., 'System Design', 'API Development')
  * weight: importance in the job (0-1, higher = more important)
  * depth: expertise level required (1-10, higher = more expertise)
- List hard skills (technical skills explicitly mentioned)
- List soft skills (communication, leadership, etc.)
- Estimate interview difficulty level (1-10) based on seniority and requirements

Job Description:
${jdText}`;
  }

  private normalizeCompetencyWeights(data: unknown): ParsedJobDescription {
    // Type guard to ensure data has the expected shape
    const parsed = data as ParsedJobDescription;

    const totalWeight = parsed.competencies.reduce(
      (sum: number, c: { weight: number }) => sum + c.weight,
      0,
    );

    if (totalWeight > 0) {
      return {
        ...parsed,
        competencies: parsed.competencies.map(
          (c: { depth: number; name: string; weight: number }) => ({
            ...c,
            weight: c.weight / totalWeight, // Normalize to sum to 1
          }),
        ),
      };
    }

    return parsed;
  }
}
