import { Injectable, Logger } from "@nestjs/common";
import axios, { AxiosError } from "axios";

@Injectable()
export class HtmlFetcherService {
  private readonly logger = new Logger(HtmlFetcherService.name);

  async fetchHtml(url: string): Promise<string> {
    try {
      this.logger.log(`Fetching HTML from URL: ${url}`);

      const response = await axios.get(url, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        },
        timeout: 10000, // 10 seconds
      });

      const htmlContent = response.data as string;
      this.logger.log(
        `Successfully fetched HTML: ${htmlContent.length} characters`,
      );
      return htmlContent;
    } catch (error) {
      if (error instanceof AxiosError) {
        this.logger.error(`Failed to fetch HTML: ${error.message}`);
        throw new Error(`Failed to fetch job URL: ${error.message}`);
      }
      throw error;
    }
  }
}
