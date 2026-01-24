import { Email } from "../value-objects/email";
import { IdentityId } from "../value-objects/identity-id";
import { UserId } from "../value-objects/user-id";

export interface UserProps {
  createdAt?: Date;
  deletedAt?: Date;
  email: Email;
  id?: UserId;
  identityId: IdentityId;
  updatedAt?: Date;
}

export class User {
  private constructor(
    private readonly id: UserId,
    private email: Email,
    private readonly identityId: IdentityId,
    private readonly createdAt: Date = new Date(),
    private updatedAt: Date = new Date(),
    private deletedAt?: Date,
  ) {}

  /**
   * Factory method for creating new user instances (registration flow)
   */
  static createNew(email: string, identityId: string): User {
    return new User(
      UserId.generate(),
      Email.create(email),
      IdentityId.create(identityId),
    );
  }

  /**
   * Factory method for rehydrating user from persistence
   * Does not emit domain events
   */
  static rehydrate(props: {
    createdAt: Date;
    deletedAt?: Date;
    email: Email;
    id: UserId;
    identityId: IdentityId;
    updatedAt: Date;
  }): User {
    return new User(
      props.id,
      props.email,
      props.identityId,
      props.createdAt,
      props.updatedAt,
      props.deletedAt,
    );
  }

  // Getters
  getId(): UserId {
    return this.id;
  }

  getEmail(): Email {
    return this.email;
  }

  getIdentityId(): IdentityId {
    return this.identityId;
  }

  getCreatedAt(): Date {
    return this.createdAt;
  }

  getUpdatedAt(): Date {
    return this.updatedAt;
  }

  getDeletedAt(): Date | undefined {
    return this.deletedAt;
  }

  isDeleted(): boolean {
    return this.deletedAt !== undefined;
  }

  // Business methods
  changeEmail(newEmail: string): void {
    if (this.isDeleted()) {
      throw new Error("Cannot change email of deleted user");
    }
    this.email = Email.create(newEmail);
    this.updatedAt = new Date();
  }

  softDelete(): void {
    if (this.isDeleted()) {
      throw new Error("User is already deleted");
    }
    this.deletedAt = new Date();
    this.updatedAt = new Date();
  }

  restore(): void {
    if (!this.isDeleted()) {
      throw new Error("User is not deleted");
    }
    this.deletedAt = undefined;
    this.updatedAt = new Date();
  }
}
