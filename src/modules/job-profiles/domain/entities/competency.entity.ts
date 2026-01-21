export interface CompetencyProps {
  depth: number;
  name: string;
  weight: number;
}

export class Competency {
  private constructor(
    private readonly name: string,
    private readonly weight: number,
    private readonly depth: number,
  ) {
    this.validate();
  }

  static create(props: CompetencyProps): Competency {
    return new Competency(props.name, props.weight, props.depth);
  }

  private validate(): void {
    if (!this.name || this.name.trim().length === 0) {
      throw new Error("Competency name cannot be empty");
    }
    if (this.weight < 0 || this.weight > 1) {
      throw new Error("Competency weight must be between 0 and 1");
    }
    if (this.depth < 1 || this.depth > 10) {
      throw new Error("Competency depth must be between 1 and 10");
    }
  }

  getName(): string {
    return this.name;
  }

  getWeight(): number {
    return this.weight;
  }

  getDepth(): number {
    return this.depth;
  }

  toPlainObject(): CompetencyProps {
    return {
      depth: this.depth,
      name: this.name,
      weight: this.weight,
    };
  }
}
