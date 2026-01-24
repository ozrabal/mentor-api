// Public contracts for inter-module communication
export { SupabaseJwtGuard } from "../guards/supabase-jwt.guard";
export { SupabaseJwtStrategy } from "../strategies/supabase-jwt.strategy";

// ACL for cross-module communication
export * from "./acl/users.acl.interface";
export * from "./acl/users.acl.tokens";
