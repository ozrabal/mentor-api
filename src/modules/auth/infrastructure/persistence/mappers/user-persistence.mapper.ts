import { User as UserORM } from "@/database/schema";

import { User } from "../../../domain/entities/user.entity";
import { Email } from "../../../domain/value-objects/email";
import { IdentityId } from "../../../domain/value-objects/identity-id";
import { UserId } from "../../../domain/value-objects/user-id";

export class UserPersistenceMapper {
  static toDomain(orm: UserORM): User {
    return User.rehydrate({
      createdAt: orm.createdAt,
      deletedAt: orm.deletedAt as Date | undefined,
      email: Email.create(orm.email),
      id: UserId.create(orm.id),
      identityId: IdentityId.create(orm.identityId),
      updatedAt: orm.updatedAt,
    });
  }

  static toOrmInsert(domain: User): {
    email: string;
    id: string;
    identityId: string;
  } {
    return {
      email: domain.getEmail().getValue(),
      id: domain.getId().getValue(),
      identityId: domain.getIdentityId().getValue(),
    };
  }
}
