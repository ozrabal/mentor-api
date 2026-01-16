import type { Request } from "express";

import { Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PassportStrategy } from "@nestjs/passport";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { ExtractJwt, Strategy } from "passport-jwt";

import type { Env } from "@/config/config.module";

export interface JwtPayload {
  email?: string;
  role?: string;
  sub: string;
}

@Injectable()
export class SupabaseJwtStrategy extends PassportStrategy(
  Strategy,
  "supabase-jwt",
) {
  private readonly supabase: SupabaseClient;

  constructor(private readonly configService: ConfigService<Env, true>) {
    const supabaseUrl = configService.get("SUPABASE_URL", { infer: true });

    const customJwtExtractor = (req: Request) => {
      const token = ExtractJwt.fromAuthHeaderAsBearerToken()(req);

      return token;
    };

    super({
      ignoreExpiration: true, // Skip passport-jwt verification (we'll verify with Supabase)
      jwtFromRequest: customJwtExtractor,
      secretOrKey: "dummy", // Not used since we skip verification
    });

    const supabaseServiceRoleKey = configService.get(
      "SUPABASE_SERVICE_ROLE_KEY",
      { infer: true },
    );

    this.supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }

  async validate(payload: JwtPayload) {
    if (!payload.sub) {
      throw new UnauthorizedException("Invalid token - no user ID");
    }

    // Verify user exists in Supabase
    const { data: user, error } = await this.supabase.auth.admin.getUserById(
      payload.sub,
    );

    if (error || !user) {
      throw new UnauthorizedException("User not found or invalid token");
    }

    const response = {
      email: user.user.email,
      userId: user.user.id,
    };
    return response;
  }
}
