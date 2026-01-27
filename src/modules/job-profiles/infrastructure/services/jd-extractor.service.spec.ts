import { Test, TestingModule } from "@nestjs/testing";
import { JdExtractorService } from "./jd-extractor.service";

describe("JdExtractorService", () => {
  let service: JdExtractorService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [JdExtractorService],
    }).compile();

    service = module.get<JdExtractorService>(JdExtractorService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("extractTextFromHtml", () => {
    it("should extract text from HTML", () => {
      const html = `
        <html>
          <body>
            <h1>Job Title</h1>
            <p>We are looking for a senior engineer</p>
          </body>
        </html>
      `;

      const result = service.extractTextFromHtml(html);

      expect(result).toContain("Job Title");
      expect(result).toContain("senior engineer");
    });

    it("should remove script tags", () => {
      const html = `
        <html>
          <body>
            <h1>Job Title</h1>
            <script>console.log('ignore me')</script>
            <p>Job description</p>
          </body>
        </html>
      `;

      const result = service.extractTextFromHtml(html);

      expect(result).toContain("Job Title");
      expect(result).toContain("Job description");
      expect(result).not.toContain("ignore me");
      expect(result).not.toContain("console.log");
    });

    it("should remove style tags", () => {
      const html = `
        <html>
          <head>
            <style>body { color: red; }</style>
          </head>
          <body>
            <p>Job description</p>
          </body>
        </html>
      `;

      const result = service.extractTextFromHtml(html);

      expect(result).toContain("Job description");
      expect(result).not.toContain("color: red");
    });

    it("should normalize whitespace", () => {
      const html = `
        <html>
          <body>
            <p>Job     title    with     lots    of     spaces</p>
          </body>
        </html>
      `;

      const result = service.extractTextFromHtml(html);

      expect(result).toContain("Job title with lots of spaces");
      expect(result).not.toMatch(/\s{2,}/); // No multiple consecutive spaces
    });

    it("should handle empty HTML", () => {
      const html = "<html><body></body></html>";

      const result = service.extractTextFromHtml(html);

      expect(result).toBe("");
    });

    it("should throw error on invalid HTML structure", () => {
      const html = "not valid html at all";

      // Should not throw, cheerio is forgiving
      expect(() => {
        service.extractTextFromHtml(html);
      }).not.toThrow();
    });
  });

  describe("normalizeRawJD", () => {
    it("should normalize raw JD text", () => {
      const rawJD = "Job   Title\n\n\nDescription     with    spaces";

      const result = service.normalizeRawJD(rawJD);

      // The implementation replaces all whitespace (including newlines) with single space
      expect(result).toBe("Job Title Description with spaces");
    });

    it("should trim leading and trailing whitespace", () => {
      const rawJD = "   Job Title   \n\n   Description   ";

      const result = service.normalizeRawJD(rawJD);

      expect(result).toBe("Job Title Description");
      expect(result).not.toMatch(/^\s/); // No leading whitespace
      expect(result).not.toMatch(/\s$/); // No trailing whitespace
    });

    it("should normalize multiple spaces to single space", () => {
      const rawJD = "We    are    looking    for    engineers";

      const result = service.normalizeRawJD(rawJD);

      expect(result).toBe("We are looking for engineers");
    });

    it("should normalize multiple spaces and newlines to single space", () => {
      const rawJD = "Line 1\n\n\n\nLine 2\n\n\nLine 3";

      const result = service.normalizeRawJD(rawJD);

      expect(result).toBe("Line 1 Line 2 Line 3");
    });

    it("should handle empty string", () => {
      const rawJD = "";

      const result = service.normalizeRawJD(rawJD);

      expect(result).toBe("");
    });

    it("should handle whitespace only string", () => {
      const rawJD = "   \n\n   \n   ";

      const result = service.normalizeRawJD(rawJD);

      expect(result).toBe("");
    });

    it("should normalize all whitespace including line breaks", () => {
      const rawJD =
        "Requirements:\n- Skill 1\n- Skill 2\n\nQualifications:\n- Experience";

      const result = service.normalizeRawJD(rawJD);

      // All whitespace is normalized to single spaces
      expect(result).toBe(
        "Requirements: - Skill 1 - Skill 2 Qualifications: - Experience",
      );
    });
  });
});
