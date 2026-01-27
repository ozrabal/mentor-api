import { Test, TestingModule } from "@nestjs/testing";
import { HtmlFetcherService } from "./html-fetcher.service";
import axios, { AxiosError } from "axios";

jest.mock("axios");
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe("HtmlFetcherService", () => {
  let service: HtmlFetcherService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [HtmlFetcherService],
    }).compile();

    service = module.get<HtmlFetcherService>(HtmlFetcherService);
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("fetchHtml", () => {
    it("should fetch HTML from URL", async () => {
      const url = "https://example.com/job";
      const mockHtml = "<html><body>Job Description</body></html>";

      mockedAxios.get.mockResolvedValue({
        data: mockHtml,
        status: 200,
        statusText: "OK",
        headers: {},
        config: {} as any,
      });

      const result = await service.fetchHtml(url);

      expect(result).toBe(mockHtml);
      expect(mockedAxios.get).toHaveBeenCalledWith(url, {
        timeout: 10000,
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        },
      });
    });

    it("should throw error when fetch fails", async () => {
      const url = "https://example.com/job";
      const errorMessage = "Network error";

      const axiosError = Object.assign(new AxiosError(), {
        message: errorMessage,
        code: "ERR_NETWORK",
      });

      mockedAxios.get.mockRejectedValue(axiosError);

      await expect(service.fetchHtml(url)).rejects.toThrow(
        `Failed to fetch job URL: ${errorMessage}`,
      );
    });

    it("should throw error on timeout", async () => {
      const url = "https://example.com/job";

      const timeoutError = Object.assign(new AxiosError(), {
        message: "timeout of 10000ms exceeded",
        code: "ECONNABORTED",
      });

      mockedAxios.get.mockRejectedValue(timeoutError);

      await expect(service.fetchHtml(url)).rejects.toThrow(
        "Failed to fetch job URL: timeout of 10000ms exceeded",
      );
    });

    it("should throw error on 404", async () => {
      const url = "https://example.com/job";

      const notFoundError = Object.assign(new AxiosError(), {
        message: "Request failed with status code 404",
        code: "ERR_BAD_REQUEST",
        response: { status: 404 },
      });

      mockedAxios.get.mockRejectedValue(notFoundError);

      await expect(service.fetchHtml(url)).rejects.toThrow(
        "Failed to fetch job URL: Request failed with status code 404",
      );
    });

    it("should handle non-axios errors", async () => {
      const url = "https://example.com/job";
      const genericError = new Error("Some other error");

      mockedAxios.get.mockRejectedValue(genericError);

      await expect(service.fetchHtml(url)).rejects.toThrow(genericError);
    });

    it("should use correct timeout", async () => {
      const url = "https://example.com/job";
      const mockHtml = "<html></html>";

      mockedAxios.get.mockResolvedValue({
        data: mockHtml,
        status: 200,
        statusText: "OK",
        headers: {},
        config: {} as any,
      });

      await service.fetchHtml(url);

      expect(mockedAxios.get).toHaveBeenCalledWith(
        url,
        expect.objectContaining({
          timeout: 10000, // 10 seconds
        }),
      );
    });

    it("should include user agent header", async () => {
      const url = "https://example.com/job";
      const mockHtml = "<html></html>";

      mockedAxios.get.mockResolvedValue({
        data: mockHtml,
        status: 200,
        statusText: "OK",
        headers: {},
        config: {} as any,
      });

      await service.fetchHtml(url);

      expect(mockedAxios.get).toHaveBeenCalledWith(
        url,
        expect.objectContaining({
          headers: expect.objectContaining({
            "User-Agent": expect.stringContaining("Mozilla"),
          }),
        }),
      );
    });
  });
});
