export type InterviewTypeValue = "behavioral" | "mixed" | "technical";

export class InterviewType {
  private constructor(private readonly value: InterviewTypeValue) {}

  static create(value?: InterviewTypeValue): InterviewType {
    return new InterviewType(value ?? "mixed");
  }

  getValue(): InterviewTypeValue {
    return this.value;
  }

  equals(other: InterviewType): boolean {
    return this.value === other.value;
  }
}
