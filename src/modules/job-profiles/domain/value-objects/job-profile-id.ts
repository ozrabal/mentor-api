export class JobProfileId {
  private constructor(private readonly value: string) {
    if (!value || value.trim().length === 0) {
      throw new Error("JobProfileId cannot be empty");
    }
  }

  static create(value: string): JobProfileId {
    return new JobProfileId(value);
  }

  static generate(): JobProfileId {
    return new JobProfileId(crypto.randomUUID());
  }

  getValue(): string {
    return this.value;
  }

  equals(other: JobProfileId): boolean {
    return this.value === other.value;
  }
}
