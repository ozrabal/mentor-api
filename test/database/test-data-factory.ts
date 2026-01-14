/**
 * Test Data Factory
 * 
 * Provides factory methods for creating test data entities.
 * These factories create valid domain objects for testing purposes.
 */

import { faker } from '@faker-js/faker';

// User test data factory
export const UserFactory = {
  createUserData: (overrides?: Partial<{
    email: string;
    identityId: string;
  }>) => ({
    email: overrides?.email || faker.internet.email(),
    identityId: overrides?.identityId || faker.string.uuid(),
    createdAt: new Date(),
    updatedAt: new Date(),
  }),

  createMultipleUsers: (count: number = 3) => {
    return Array.from({ length: count }, () => UserFactory.createUserData());
  },
};

// Job Profile test data factory
export const JobProfileFactory = {
  createJobProfileData: (overrides?: Partial<{
    userId: string;
    title: string;
    description: string;
    competencies: Record<string, any>;
    difficulty: string;
  }>) => ({
    userId: overrides?.userId || faker.string.uuid(),
    title: overrides?.title || faker.person.jobTitle(),
    description: overrides?.description || faker.lorem.paragraphs(2),
    competencies: overrides?.competencies || {
      technical: ['JavaScript', 'TypeScript', 'Node.js'],
      soft: ['Communication', 'Problem Solving'],
    },
    difficulty: overrides?.difficulty || faker.helpers.arrayElement(['junior', 'mid', 'senior']),
    createdAt: new Date(),
    updatedAt: new Date(),
  }),
};

// Question Pool test data factory
export const QuestionFactory = {
  createQuestionData: (overrides?: Partial<{
    competency: string;
    difficulty: string;
    question: string;
    evaluationCriteria: Record<string, any>;
  }>) => ({
    competency: overrides?.competency || faker.helpers.arrayElement(['javascript', 'communication', 'problem-solving']),
    difficulty: overrides?.difficulty || faker.helpers.arrayElement(['junior', 'mid', 'senior']),
    question: overrides?.question || faker.lorem.sentence() + '?',
    evaluationCriteria: overrides?.evaluationCriteria || {
      technical_accuracy: 'Correct understanding of concepts',
      clarity: 'Clear explanation',
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  }),
};