import { Inject, Injectable } from "@nestjs/common";
import { and, eq, isNull } from "drizzle-orm";

import { DRIZZLE_DB, DrizzleDb } from "@/database/database.service";
import { users } from "@/database/schema";

import { User } from "../../../domain/entities/user.entity";
import { IUserRepository } from "../../../domain/repositories/user.repository.interface";
import { Email } from "../../../domain/value-objects/email";
import { IdentityId } from "../../../domain/value-objects/identity-id";
import { UserId } from "../../../domain/value-objects/user-id";
import { UserPersistenceMapper } from "../mappers/user-persistence.mapper";

@Injectable()
export class UserRepository implements IUserRepository {
  constructor(@Inject(DRIZZLE_DB) private readonly db: DrizzleDb) {}

  async save(user: User): Promise<void> {
    const ormEntity = UserPersistenceMapper.toOrmInsert(user);
    await this.db.insert(users).values(ormEntity);
  }

  async findById(id: UserId, includeDeleted = false): Promise<null | User> {
    const conditions = [eq(users.id, id.getValue())];

    if (!includeDeleted) {
      conditions.push(isNull(users.deletedAt));
    }

    const result = await this.db
      .select()
      .from(users)
      .where(and(...conditions))
      .limit(1);

    if (!result[0]) return null;
    return UserPersistenceMapper.toDomain(result[0]);
  }

  async findByEmail(
    email: Email,
    includeDeleted = false,
  ): Promise<null | User> {
    const conditions = [eq(users.email, email.getValue())];

    if (!includeDeleted) {
      conditions.push(isNull(users.deletedAt));
    }

    const result = await this.db
      .select()
      .from(users)
      .where(and(...conditions))
      .limit(1);

    if (!result[0]) return null;
    return UserPersistenceMapper.toDomain(result[0]);
  }

  async findByIdentityId(
    identityId: IdentityId,
    includeDeleted = false,
  ): Promise<null | User> {
    const conditions = [eq(users.identityId, identityId.getValue())];

    if (!includeDeleted) {
      conditions.push(isNull(users.deletedAt));
    }

    const result = await this.db
      .select()
      .from(users)
      .where(and(...conditions))
      .limit(1);

    if (!result[0]) return null;
    return UserPersistenceMapper.toDomain(result[0]);
  }

  async softDelete(id: UserId): Promise<void> {
    await this.db
      .update(users)
      .set({
        deletedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(users.id, id.getValue()));
  }

  async restore(id: UserId): Promise<void> {
    await this.db
      .update(users)
      .set({
        deletedAt: null,
        updatedAt: new Date(),
      })
      .where(eq(users.id, id.getValue()));
  }
}
