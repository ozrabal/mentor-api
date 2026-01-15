/**
 * Supabase Jwt Strategy Unit Tests
 */

import { UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { createClient as mockedCreateClient } from "@supabase/supabase-js";

import { JwtPayload, SupabaseJwtStrategy } from "./supabase-jwt.strategy";

jest.mock("@supabase/supabase-js", () => {
  return {
    createClient: jest.fn(() => ({
      auth: {
        admin: {
          getUserById: jest.fn(),
        },
      },
    })),
  };
});

describe("SupabaseJwtStrategy", () => {
  const mockConfigService = {
    get: jest.fn().mockImplementation((key: string) => {
      if (key === "SUPABASE_URL") return "https://example.supabase.co";
      if (key === "JWT_SECRET") return "supersecret";
      if (key === "SUPABASE_SERVICE_ROLE_KEY") return "service-role-key";
      return undefined;
    }),
  } as unknown as ConfigService;

  function createStrategy() {
    return new SupabaseJwtStrategy(
      mockConfigService as unknown as ConfigService<any, true>,
    );
  }

  it("should validate and return normalized user", async () => {
    const strategy = createStrategy();
    const payload: JwtPayload = { email: "user@example.com", sub: "user-1" };

    const mockFn = mockedCreateClient as unknown as jest.Mock;
    const lastCall = mockFn.mock.results[mockFn.mock.results.length - 1];
    const supabaseInstance = lastCall.value as {
      auth: { admin: { getUserById: jest.Mock } };
    };
    supabaseInstance.auth.admin.getUserById.mockResolvedValue({
      data: { user: { email: "user@example.com", id: "user-1" } },
      error: null,
    });

    const result = await strategy.validate(payload);
    expect(result).toEqual({ email: "user@example.com", userId: "user-1" });
  });

  it("should throw UnauthorizedException when sub missing", async () => {
    const strategy = createStrategy();
    await expect(strategy.validate({} as any)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it("should throw UnauthorizedException when user not found", async () => {
    const strategy = createStrategy();
    const payload: JwtPayload = { sub: "user-2" } as any;

    const mockFn = mockedCreateClient as unknown as jest.Mock;
    const lastCall = mockFn.mock.results[mockFn.mock.results.length - 1];
    const supabaseInstance = lastCall.value as {
      auth: { admin: { getUserById: jest.Mock } };
    };
    supabaseInstance.auth.admin.getUserById.mockResolvedValue({
      data: null,
      error: null,
    });

    await expect(strategy.validate(payload)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it("should throw UnauthorizedException when supabase returns error", async () => {
    const strategy = createStrategy();
    const payload: JwtPayload = { sub: "user-3" } as any;

    const mockFn = mockedCreateClient as unknown as jest.Mock;
    const lastCall = mockFn.mock.results[mockFn.mock.results.length - 1];
    const supabaseInstance = lastCall.value as {
      auth: { admin: { getUserById: jest.Mock } };
    };
    supabaseInstance.auth.admin.getUserById.mockResolvedValue({
      data: null,
      error: { message: "boom" },
    });

    await expect(strategy.validate(payload)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });
});
