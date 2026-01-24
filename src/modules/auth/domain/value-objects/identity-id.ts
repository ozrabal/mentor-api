export class IdentityId {
  private constructor(private readonly value: string) {
    if (!value || value.trim().length === 0) {
      throw new Error("IdentityId cannot be empty");
    }
    // Supabase identity IDs are UUIDs
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(value)) {
      throw new Error("IdentityId must be a valid UUID");
    }
  }

  static create(value: string): IdentityId {
    return new IdentityId(value);
  }

  getValue(): string {
    return this.value;
  }

  equals(other: IdentityId): boolean {
    return this.value === other.value;
  }
}
