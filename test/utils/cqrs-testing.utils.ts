/**
 * CQRS Test Utilities
 * 
 * Provides utilities for testing CQRS commands and queries:
 * - Mock CommandBus and QueryBus
 * - Test helpers for handlers
 * - Command/Query testing patterns
 */

import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { Test, TestingModule } from '@nestjs/testing';

export interface MockCommandBus {
  execute: jest.MockedFunction<CommandBus['execute']>;
}

export interface MockQueryBus {
  execute: jest.MockedFunction<QueryBus['execute']>;
}

/**
 * Creates a mock CommandBus for testing
 */
export function createMockCommandBus(): MockCommandBus {
  return {
    execute: jest.fn(),
  };
}

/**
 * Creates a mock QueryBus for testing
 */
export function createMockQueryBus(): MockQueryBus {
  return {
    execute: jest.fn(),
  };
}

/**
 * Testing module builder with CQRS setup
 */
export class CQRSTestingModuleBuilder {
  private providers: any[] = [];
  private controllers: any[] = [];
  private imports: any[] = [];

  withMockCommandBus(): this {
    this.providers.push({
      provide: CommandBus,
      useValue: createMockCommandBus(),
    });
    return this;
  }

  withMockQueryBus(): this {
    this.providers.push({
      provide: QueryBus,
      useValue: createMockQueryBus(),
    });
    return this;
  }

  withControllers(...controllers: any[]): this {
    this.controllers.push(...controllers);
    return this;
  }

  withProviders(...providers: any[]): this {
    this.providers.push(...providers);
    return this;
  }

  withImports(...imports: any[]): this {
    this.imports.push(...imports);
    return this;
  }

  async build(): Promise<TestingModule> {
    return Test.createTestingModule({
      imports: this.imports,
      controllers: this.controllers,
      providers: this.providers,
    }).compile();
  }
}

/**
 * Base class for testing command handlers
 */
export abstract class CommandHandlerTestBase<TCommand, TResult> {
  protected abstract handler: any;
  protected abstract createValidCommand(): TCommand;
  protected abstract setupMocks(): void;

  beforeEach(): void {
    this.setupMocks();
  }

  async executeCommand(command?: TCommand): Promise<TResult> {
    const cmd = command || this.createValidCommand();
    return this.handler.execute(cmd);
  }

  expectCommandToBeValid(command: TCommand): void {
    expect(command).toBeDefined();
    expect(command).not.toBeNull();
  }
}

/**
 * Base class for testing query handlers
 */
export abstract class QueryHandlerTestBase<TQuery, TResult> {
  protected abstract handler: any;
  protected abstract createValidQuery(): TQuery;
  protected abstract setupMocks(): void;

  beforeEach(): void {
    this.setupMocks();
  }

  async executeQuery(query?: TQuery): Promise<TResult> {
    const q = query || this.createValidQuery();
    return this.handler.execute(q);
  }

  expectQueryToBeValid(query: TQuery): void {
    expect(query).toBeDefined();
    expect(query).not.toBeNull();
  }
}

/**
 * Helper for testing controllers with CQRS
 */
export class ControllerTestHelper {
  static async createTestingModule(
    Controller: any,
    mockBuses: { commandBus?: boolean; queryBus?: boolean } = {}
  ): Promise<{
    module: TestingModule;
    controller: any;
    commandBus?: MockCommandBus;
    queryBus?: MockQueryBus;
  }> {
    const providers: any[] = [];
    let mockCommandBus: MockCommandBus | undefined;
    let mockQueryBus: MockQueryBus | undefined;

    if (mockBuses.commandBus) {
      mockCommandBus = createMockCommandBus();
      providers.push({
        provide: CommandBus,
        useValue: mockCommandBus,
      });
    }

    if (mockBuses.queryBus) {
      mockQueryBus = createMockQueryBus();
      providers.push({
        provide: QueryBus,
        useValue: mockQueryBus,
      });
    }

    const module = await Test.createTestingModule({
      controllers: [Controller],
      providers,
    }).compile();

    const controller = module.get(Controller);

    return {
      module,
      controller,
      commandBus: mockCommandBus,
      queryBus: mockQueryBus,
    };
  }
}