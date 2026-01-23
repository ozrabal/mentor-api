import { Injectable, Logger } from "@nestjs/common";

@Injectable()
export class JdExtractorService {
  private readonly logger = new Logger(JdExtractorService.name);

  normalizeRawJD(rawJD: string): string {
    this.logger.log("Normalizing raw JD text");

    // Clean up whitespace and normalize line breaks
    const normalized = rawJD.replace(/\s+/g, " ").replace(/\n+/g, "\n").trim();

    this.logger.log(`Normalized JD: ${normalized.length} characters`);
    return normalized;
  }
}
