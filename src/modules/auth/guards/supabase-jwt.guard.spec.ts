/**
 * Supabase Jwt Guard Unit Tests
 */

import { SupabaseJwtGuard } from "./supabase-jwt.guard";

describe("SupabaseJwtGuard", () => {
  it("should be defined", () => {
    const guard = new SupabaseJwtGuard({
      // eslint-disable-next-line @typescript-eslint/require-await
      getUserByIdentityId: async () => null,
      // eslint-disable-next-line @typescript-eslint/require-await
      getUserInfo: async () => null,
    });
    expect(guard).toBeDefined();
  });
});
