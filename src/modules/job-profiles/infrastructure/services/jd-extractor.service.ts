import { Injectable, Logger } from "@nestjs/common";
import * as cheerio from "cheerio";

@Injectable()
export class JdExtractorService {
  private readonly logger = new Logger(JdExtractorService.name);

  extractTextFromHtml(html: string): string {
    try {
      this.logger.log("Extracting text from HTML");

      const $ = cheerio.load(html);

      // Remove script and style tags
      $("script, style, noscript").remove();

      // Get text content
      const text = $("body").text();

      // Clean up whitespace
      const cleaned = text.replace(/\s+/g, " ").replace(/\n+/g, "\n").trim();

      this.logger.log(`Extracted ${cleaned.length} characters from HTML`);
      return cleaned;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      this.logger.error(`Failed to extract text from HTML: ${errorMessage}`);
      throw new Error("Failed to extract text from HTML");
    }
  }

  normalizeRawJD(rawJD: string): string {
    this.logger.log("Normalizing raw JD text");

    // Clean up whitespace and normalize line breaks
    const normalized = rawJD.replace(/\s+/g, " ").replace(/\n+/g, "\n").trim();

    this.logger.log(`Normalized JD: ${normalized.length} characters`);
    return normalized;
  }
}
