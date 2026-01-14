/**
 * Repository Mock Utilities
 * 
 * Provides utilities for mocking repository interfaces:
 * - Mock repository creation
 * - Common repository method mocks
 * - Repository testing patterns
 */

/**
 * Generic repository mock interface
 */
export interface MockRepository<T> {
  save: jest.MockedFunction<(entity: T) => Promise<void>>;
  findById: jest.MockedFunction<(id: any) => Promise<T | null>>;
  findAll?: jest.MockedFunction<() => Promise<T[]>>;
  delete?: jest.MockedFunction<(id: any) => Promise<void>>;
  update?: jest.MockedFunction<(id: any, entity: Partial<T>) => Promise<void>>;
}

/**
 * Creates a mock repository with common methods
 */
export function createMockRepository<T>(): MockRepository<T> {
  return {
    save: jest.fn(),
    findById: jest.fn(),
    findAll: jest.fn(),
    delete: jest.fn(),
    update: jest.fn(),
  };
}

/**
 * Repository test helper for setting up common scenarios
 */
export class RepositoryTestHelper<T> {
  constructor(private mockRepository: MockRepository<T>) {}

  /**
   * Setup the repository to return an entity when findById is called
   */
  setupFindById(id: any, entity: T | null): this {
    this.mockRepository.findById.mockResolvedValue(entity);
    return this;
  }

  /**
   * Setup the repository to return entities when findAll is called
   */
  setupFindAll(entities: T[]): this {
    this.mockRepository.findAll?.mockResolvedValue(entities);
    return this;
  }

  /**
   * Setup the repository save method to succeed
   */
  setupSaveSuccess(): this {
    this.mockRepository.save.mockResolvedValue();
    return this;
  }

  /**
   * Setup the repository save method to fail
   */
  setupSaveFailure(error: Error): this {
    this.mockRepository.save.mockRejectedValue(error);
    return this;
  }

  /**
   * Setup the repository findById method to fail
   */
  setupFindByIdFailure(error: Error): this {
    this.mockRepository.findById.mockRejectedValue(error);
    return this;
  }

  /**
   * Verify that save was called with the expected entity
   */
  expectSaveCalledWith(entity: T): void {
    expect(this.mockRepository.save).toHaveBeenCalledWith(entity);
  }

  /**
   * Verify that findById was called with the expected id
   */
  expectFindByIdCalledWith(id: any): void {
    expect(this.mockRepository.findById).toHaveBeenCalledWith(id);
  }

  /**
   * Verify that save was called once
   */
  expectSaveCalledOnce(): void {
    expect(this.mockRepository.save).toHaveBeenCalledTimes(1);
  }

  /**
   * Verify that findById was called once
   */
  expectFindByIdCalledOnce(): void {
    expect(this.mockRepository.findById).toHaveBeenCalledTimes(1);
  }

  /**
   * Reset all mocks
   */
  resetMocks(): void {
    this.mockRepository.save.mockReset();
    this.mockRepository.findById.mockReset();
    this.mockRepository.findAll?.mockReset();
    this.mockRepository.delete?.mockReset();
    this.mockRepository.update?.mockReset();
  }
}

/**
 * Creates a repository test helper
 */
export function createRepositoryTestHelper<T>(mockRepository: MockRepository<T>): RepositoryTestHelper<T> {
  return new RepositoryTestHelper(mockRepository);
}