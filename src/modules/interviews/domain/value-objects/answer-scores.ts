/**
 * Value object representing the four-dimension scoring of an answer
 */
export class AnswerScores {
  private constructor(
    private readonly clarity: number,
    private readonly completeness: number,
    private readonly relevance: number,
    private readonly confidence: number,
  ) {
    this.validate();
  }

  /**
   * Create new answer scores
   */
  static create(
    clarity: number,
    completeness: number,
    relevance: number,
    confidence: number,
  ): AnswerScores {
    return new AnswerScores(clarity, completeness, relevance, confidence);
  }

  /**
   * Calculate overall score using weighted formula
   * Formula: (clarity × 0.3 + completeness × 0.3 + relevance × 0.25 + confidence × 0.15) / 10 × 100
   */
  calculateOverallScore(): number {
    return (
      ((this.clarity * 0.3 +
        this.completeness * 0.3 +
        this.relevance * 0.25 +
        this.confidence * 0.15) /
        10) *
      100
    );
  }

  getClarity(): number {
    return this.clarity;
  }

  getCompleteness(): number {
    return this.completeness;
  }

  getRelevance(): number {
    return this.relevance;
  }

  getConfidence(): number {
    return this.confidence;
  }

  private validate(): void {
    this.validateScore(this.clarity, "clarity");
    this.validateScore(this.completeness, "completeness");
    this.validateScore(this.relevance, "relevance");
    this.validateScore(this.confidence, "confidence");
  }

  private validateScore(score: number, name: string): void {
    if (score < 0 || score > 10) {
      throw new Error(`${name} score must be between 0 and 10`);
    }
  }
}
