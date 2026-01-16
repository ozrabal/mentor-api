import {
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { User } from "@supabase/supabase-js";
import { Request } from "express";
import { decode } from "jsonwebtoken";

@Injectable()
export class SupabaseJwtGuard extends AuthGuard("supabase-jwt") {
  handleRequest<TUser = User>(
    err: any,
    user: any,
    info: any,
    context: ExecutionContext,
  ): TUser {
    if (err) {
      throw err;
    }

    // Since we skip verification in the strategy, we get false as user
    // We need to manually decode and pass the payload
    if (!user) {
      const request: Request = context.switchToHttp().getRequest();
      const authHeader = request.headers.authorization;

      if (!authHeader) {
        throw new UnauthorizedException("No authorization header");
      }

      const token = authHeader.replace("Bearer ", "");

      // Decode without verification (we verify in the strategy's validate method)
      const decoded = decode(token, { complete: false });

      if (!decoded) {
        throw new UnauthorizedException("Invalid token format");
      }

      // Let passport-jwt pass the decoded payload to validate()
      return decoded as TUser;
    }

    return user as TUser;
  }
}
