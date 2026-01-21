export class UserId {
  private constructor(private readonly value: string) {
    if (!value || value.trim().length === 0) {
      throw new Error("UserId cannot be empty");
    }
  }

  static create(value: string): UserId {
    return new UserId(value);
  }

  getValue(): string {
    return this.value;
  }
}
