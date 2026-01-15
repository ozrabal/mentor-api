/**
 * Test Data Factory
 *
 * Provides factory methods for creating test data entities.
 * These factories create valid domain objects for testing purposes.
 */

import { faker } from "@faker-js/faker";

// User test data factory
export const UserFactory = {
  createMultipleUsers: (count: number = 3) => {
    return Array.from({ length: count }, () => UserFactory.createUserData());
  },

  createUserData: (
    overrides?: Partial<{
      email: string;
      identityId: string;
    }>,
  ) => ({
    createdAt: new Date(),
    email: overrides?.email || faker.internet.email(),
    identityId: overrides?.identityId || faker.string.uuid(),
    updatedAt: new Date(),
  }),
};

// Job Profile test data factory
export const JobProfileFactory = {
  createJobProfileData: (
    overrides?: Partial<{
      competencies: Record<string, any>;
      description: string;
      difficulty: string;
      title: string;
      userId: string;
    }>,
  ) => ({
    competencies: overrides?.competencies || {
      soft: ["Communication", "Problem Solving"],
      technical: ["JavaScript", "TypeScript", "Node.js"],
    },
    createdAt: new Date(),
    description: overrides?.description || faker.lorem.paragraphs(2),
    difficulty:
      overrides?.difficulty ||
      faker.helpers.arrayElement(["junior", "mid", "senior"]),
    title: overrides?.title || faker.person.jobTitle(),
    updatedAt: new Date(),
    userId: overrides?.userId || faker.string.uuid(),
  }),
};

// Question Pool test data factory
export const QuestionFactory = {
  createQuestionData: (
    overrides?: Partial<{
      competency: string;
      difficulty: string;
      evaluationCriteria: Record<string, any>;
      question: string;
    }>,
  ) => ({
    competency:
      overrides?.competency ||
      faker.helpers.arrayElement([
        "javascript",
        "communication",
        "problem-solving",
      ]),
    createdAt: new Date(),
    difficulty:
      overrides?.difficulty ||
      faker.helpers.arrayElement(["junior", "mid", "senior"]),
    evaluationCriteria: overrides?.evaluationCriteria || {
      clarity: "Clear explanation",
      technical_accuracy: "Correct understanding of concepts",
    },
    question: overrides?.question || faker.lorem.sentence() + "?",
    updatedAt: new Date(),
  }),
};
