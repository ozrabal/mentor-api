import { Injectable } from "@nestjs/common";

import { AnswerScores } from "../../domain/value-objects/answer-scores";

/**
 * Service for scoring interview answers using rule-based heuristics
 *
 * Scoring dimensions:
 * 1. Clarity (0-10): Structure, coherence, vocabulary
 * 2. Completeness (0-10): STAR format or technical depth
 * 3. Relevance (0-10): Match to JD requirements
 * 4. Confidence (0-10): Length, fillers, completeness
 */
@Injectable()
export class ScoringService {
  /**
   * Score an answer across all four dimensions
   *
   * @param answerText The candidate's answer
   * @param questionCategory The category/competency being tested
   * @param questionType 'behavioral' | 'technical' | 'culture'
   * @param jobCompetencies Array of competencies from job profile
   * @returns AnswerScores value object
   */
  scoreAnswer(
    answerText: string,
    questionCategory: string,
    questionType: string,
    jobCompetencies: string[],
  ): AnswerScores {
    const clarity = this.scoreClarity(answerText);
    const completeness = this.scoreCompleteness(answerText, questionType);
    const relevance = this.scoreRelevance(
      answerText,
      questionCategory,
      jobCompetencies,
    );
    const confidence = this.scoreConfidence(answerText);

    return AnswerScores.create(clarity, completeness, relevance, confidence);
  }

  /**
   * Score clarity (0-10)
   * - Coherent structure: +3
   * - Structured (STAR format): +3
   * - Concise (not verbose): +2
   * - Good vocabulary: +2
   */
  private scoreClarity(answerText: string): number {
    let score = 0;

    // Check for coherent structure (has sentences, proper punctuation)
    const hasSentences = /[.!?]/.test(answerText);
    const sentenceCount = (answerText.match(/[.!?]/g) || []).length;
    if (hasSentences && sentenceCount >= 3) {
      score += 3;
    } else if (hasSentences && sentenceCount >= 1) {
      score += 1.5;
    }

    // Check for STAR structure keywords
    const starKeywords = [
      "situation",
      "task",
      "action",
      "result",
      "when",
      "where",
      "how",
      "why",
    ];
    const hasStarKeywords = starKeywords.some((keyword) =>
      answerText.toLowerCase().includes(keyword),
    );
    if (hasStarKeywords) {
      score += 3;
    }

    // Check conciseness (not too verbose)
    const wordCount = answerText.split(/\s+/).length;
    if (wordCount >= 50 && wordCount <= 200) {
      score += 2; // Sweet spot
    } else if (wordCount >= 30 && wordCount < 50) {
      score += 1; // A bit short but acceptable
    } else if (wordCount > 200 && wordCount <= 300) {
      score += 1; // A bit long but acceptable
    }

    // Check vocabulary (diverse words, professional terms)
    const uniqueWords = new Set(answerText.toLowerCase().split(/\s+/));
    const vocabularyRichness = uniqueWords.size / wordCount;
    if (vocabularyRichness > 0.6) {
      score += 2;
    } else if (vocabularyRichness > 0.4) {
      score += 1;
    }

    return Math.min(10, score);
  }

  /**
   * Score completeness (0-10)
   * Behavioral: Situation (+2.5), Task (+2.5), Action (+2.5), Result (+2.5)
   * Technical: Problem understanding (+2.5), Approach (+2.5), Trade-offs (+2.5), Feasibility (+2.5)
   */
  private scoreCompleteness(answerText: string, questionType: string): number {
    let score = 0;
    const lowerText = answerText.toLowerCase();

    if (questionType === "behavioral") {
      // Check for Situation
      if (/\b(situation|context|when|where|at that time)\b/.test(lowerText)) {
        score += 2.5;
      }

      // Check for Task
      if (
        /\b(task|goal|objective|needed to|had to|responsible for)\b/.test(
          lowerText,
        )
      ) {
        score += 2.5;
      }

      // Check for Action
      if (
        /\b(action|did|implemented|created|developed|worked)\b/.test(lowerText)
      ) {
        score += 2.5;
      }

      // Check for Result
      if (
        /\b(result|outcome|impact|achieved|improved|increased|decreased)\b/.test(
          lowerText,
        )
      ) {
        score += 2.5;
      }
    } else if (questionType === "technical") {
      // Check for Problem understanding
      if (/\b(problem|challenge|issue|requirement)\b/.test(lowerText)) {
        score += 2.5;
      }

      // Check for Approach
      if (
        /\b(approach|solution|design|architecture|implement)\b/.test(lowerText)
      ) {
        score += 2.5;
      }

      // Check for Trade-offs
      if (
        /\b(trade-off|pros|cons|advantage|disadvantage|consider)\b/.test(
          lowerText,
        )
      ) {
        score += 2.5;
      }

      // Check for Feasibility
      if (
        /\b(feasible|scalable|performance|efficient|practical)\b/.test(
          lowerText,
        )
      ) {
        score += 2.5;
      }
    } else {
      // Generic completeness for other types
      const wordCount = answerText.split(/\s+/).length;
      if (wordCount >= 100) score += 10;
      else if (wordCount >= 50) score += 5;
      else if (wordCount >= 30) score += 2.5;
    }

    return Math.min(10, score);
  }

  /**
   * Score relevance (0-10)
   * - Matches JD requirements: +4
   * - Uses job-specific terminology: +3
   * - Shows role understanding: +3
   */
  private scoreRelevance(
    answerText: string,
    questionCategory: string,
    jobCompetencies: string[],
  ): number {
    let score = 0;
    const lowerText = answerText.toLowerCase();

    // Check if answer mentions the question category/competency
    if (lowerText.includes(questionCategory.toLowerCase())) {
      score += 2;
    }

    // Check if answer mentions any job competencies
    const mentionedCompetencies = jobCompetencies.filter((comp) =>
      lowerText.includes(comp.toLowerCase()),
    );
    if (mentionedCompetencies.length >= 2) {
      score += 4;
    } else if (mentionedCompetencies.length === 1) {
      score += 2;
    }

    // Check for job-specific terminology (technical terms, tools, methodologies)
    const technicalTerms = [
      "api",
      "database",
      "frontend",
      "backend",
      "react",
      "node",
      "python",
      "agile",
      "scrum",
      "ci/cd",
      "docker",
      "kubernetes",
      "aws",
      "cloud",
      "microservices",
      "rest",
      "graphql",
      "sql",
      "nosql",
      "git",
    ];
    const hasTechnicalTerms = technicalTerms.some((term) =>
      lowerText.includes(term),
    );
    if (hasTechnicalTerms) {
      score += 3;
    }

    // Check for role understanding (leadership, teamwork, ownership)
    const roleKeywords = [
      "team",
      "collaborate",
      "lead",
      "mentor",
      "ownership",
      "responsibility",
      "stakeholder",
      "customer",
      "user",
      "product",
      "business",
    ];
    const hasRoleKeywords = roleKeywords.some((keyword) =>
      lowerText.includes(keyword),
    );
    if (hasRoleKeywords) {
      score += 3;
    }

    return Math.min(10, score);
  }

  /**
   * Score confidence (0-10)
   * - Adequate length (>50 words): +2
   * - No fillers (uh, um): +3
   * - Complete thoughts (periods): +3
   * - Base score: +2
   */
  private scoreConfidence(answerText: string): number {
    let score = 2; // Base score

    // Adequate length
    const wordCount = answerText.split(/\s+/).length;
    if (wordCount >= 50) {
      score += 2;
    }

    // No fillers
    const fillers =
      /\b(uh|um|like|you know|sort of|kind of|basically|actually)\b/gi;
    const fillerMatches = (answerText.match(fillers) || []).length;
    if (fillerMatches === 0) {
      score += 3;
    } else if (fillerMatches <= 2) {
      score += 1.5;
    }

    // Complete thoughts (proper sentence endings)
    const sentenceEndings = (answerText.match(/[.!?]/g) || []).length;
    if (sentenceEndings >= 3) {
      score += 3;
    } else if (sentenceEndings >= 1) {
      score += 1.5;
    }

    return Math.min(10, score);
  }
}
