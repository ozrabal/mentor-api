/**
 * Supabase Jwt Guard Unit Tests
 */

import { SupabaseJwtGuard } from "./supabase-jwt.guard";

describe("SupabaseJwtGuard", () => {
  it("should be defined", () => {
    const guard = new SupabaseJwtGuard();
    expect(guard).toBeDefined();
  });
});
