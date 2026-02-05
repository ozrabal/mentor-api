import { randomUUID } from "crypto";

export class SessionId {
  private constructor(private readonly value: string) {
    if (!value || value.trim().length === 0) {
      throw new Error("SessionId cannot be empty");
    }
  }

  static create(value: string): SessionId {
    return new SessionId(value);
  }

  static generate(): SessionId {
    return new SessionId(randomUUID());
  }

  getValue(): string {
    return this.value;
  }

  equals(other: SessionId): boolean {
    return this.value === other.value;
  }
}
