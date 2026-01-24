import { User } from "../entities/user.entity";
import { Email } from "../value-objects/email";
import { IdentityId } from "../value-objects/identity-id";
import { UserId } from "../value-objects/user-id";

export interface IUserRepository {
  findByEmail(email: Email, includeDeleted?: boolean): Promise<null | User>;
  findById(id: UserId, includeDeleted?: boolean): Promise<null | User>;
  findByIdentityId(
    identityId: IdentityId,
    includeDeleted?: boolean,
  ): Promise<null | User>;
  restore(id: UserId): Promise<void>;
  save(user: User): Promise<void>;
  softDelete(id: UserId): Promise<void>;
}

// DI token
export const USER_REPOSITORY = Symbol("USER_REPOSITORY");
