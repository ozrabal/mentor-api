import {
  ExecutionContext,
  Inject,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { User } from "@supabase/supabase-js";
import { Request } from "express";
import { decode } from "jsonwebtoken";

import { IUsersACL } from "../public/acl/users.acl.interface";
import { USERS_ACL } from "../public/acl/users.acl.tokens";

@Injectable()
export class SupabaseJwtGuard extends AuthGuard("supabase-jwt") {
  constructor(@Inject(USERS_ACL) private readonly usersAcl: IUsersACL) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const result = (await super.canActivate(context)) as boolean;
    const request: Request = context.switchToHttp().getRequest();
    const user = request.user as undefined | { sub?: string; userId?: string };

    if (!user) {
      throw new UnauthorizedException("Invalid token - no user data");
    }

    const identityId = user.userId ?? user.sub;
    if (!identityId) {
      throw new UnauthorizedException("Invalid token - no user ID");
    }

    const userProfile = await this.usersAcl.getUserByIdentityId(identityId);

    if (!userProfile) {
      throw new UnauthorizedException("User profile not found");
    }

    request.user = {
      email: userProfile.email,
      id: userProfile.id,
      identityId: userProfile.identityId,
    };

    return result;
  }

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

      return decoded as TUser;
    }

    return user as TUser;
  }
}
