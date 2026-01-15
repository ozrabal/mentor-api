import { Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { createClient, SupabaseClient } from "@supabase/supabase-js";

import type { Env } from "@/config/config.module";

import { AuthResultDto } from "./application/dto/auth-result.dto";

@Injectable()
export class AuthService {
  private readonly supabase: SupabaseClient;

  constructor(private readonly configService: ConfigService<Env, true>) {
    const supabaseUrl = this.configService.get("SUPABASE_URL", {
      infer: true,
    });
    const supabaseServiceRoleKey = this.configService.get(
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

  async register(email: string, password: string): Promise<AuthResultDto> {
    const { data, error } = await this.supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      throw new UnauthorizedException(error.message);
    }

    if (!data.session || !data.user) {
      throw new UnauthorizedException("Registration failed");
    }

    return {
      accessToken: data.session.access_token,
      email: data.user.email!,
      refreshToken: data.session.refresh_token,
      userId: data.user.id,
    };
  }

  async login(email: string, password: string): Promise<AuthResultDto> {
    const { data, error } = await this.supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw new UnauthorizedException(error.message);
    }

    if (!data.session || !data.user) {
      throw new UnauthorizedException("Login failed");
    }

    return {
      accessToken: data.session.access_token,
      email: data.user.email!,
      refreshToken: data.session.refresh_token,
      userId: data.user.id,
    };
  }
}
