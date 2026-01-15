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
    const jwtSecret = configService.get("JWT_SECRET", { infer: true });

    super({
      ignoreExpiration: false,
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: jwtSecret,
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
      throw new UnauthorizedException("Invalid token");
    }

    const { data: user, error } = await this.supabase.auth.admin.getUserById(
      payload.sub,
    );

    if (error || !user) {
      throw new UnauthorizedException("User not found");
    }

    return {
      email: user.user.email,
      userId: user.user.id,
    };
  }
}
