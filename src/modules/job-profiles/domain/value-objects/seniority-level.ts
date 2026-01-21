export class SeniorityLevel {
  private constructor(private readonly value: number) {
    if (value < 1 || value > 10) {
      throw new Error("SeniorityLevel must be between 1 and 10");
    }
  }

  static create(value: number): SeniorityLevel {
    return new SeniorityLevel(value);
  }

  getValue(): number {
    return this.value;
  }
}
