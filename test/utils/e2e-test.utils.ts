/**
 * E2E Test Utilities
 * 
 * Common utilities for e2e testing:
 * - HTTP request helpers
 * - Response validation
 * - Test data management
 */

import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { Response } from 'supertest';

export interface ApiResponse<T = any> {
  body: T;
  status: number;
  headers: Record<string, string>;
}

/**
 * HTTP test client wrapper for common API operations
 */
export class ApiTestClient {
  constructor(private app: INestApplication) {}

  /**
   * GET request helper
   */
  async get<T = any>(path: string, headers: Record<string, string> = {}): Promise<ApiResponse<T>> {
    const response = await request(this.app.getHttpServer())
      .get(path)
      .set(headers);

    return {
      body: response.body,
      status: response.status,
      headers: response.headers,
    };
  }

  /**
   * POST request helper
   */
  async post<T = any>(
    path: string, 
    body: any = {}, 
    headers: Record<string, string> = {}
  ): Promise<ApiResponse<T>> {
    const response = await request(this.app.getHttpServer())
      .post(path)
      .send(body)
      .set(headers);

    return {
      body: response.body,
      status: response.status,
      headers: response.headers,
    };
  }

  /**
   * PUT request helper
   */
  async put<T = any>(
    path: string, 
    body: any = {}, 
    headers: Record<string, string> = {}
  ): Promise<ApiResponse<T>> {
    const response = await request(this.app.getHttpServer())
      .put(path)
      .send(body)
      .set(headers);

    return {
      body: response.body,
      status: response.status,
      headers: response.headers,
    };
  }

  /**
   * DELETE request helper
   */
  async delete<T = any>(
    path: string, 
    headers: Record<string, string> = {}
  ): Promise<ApiResponse<T>> {
    const response = await request(this.app.getHttpServer())
      .delete(path)
      .set(headers);

    return {
      body: response.body,
      status: response.status,
      headers: response.headers,
    };
  }

  /**
   * Raw supertest request for advanced scenarios
   */
  request(): any {
    return request(this.app.getHttpServer());
  }
}

/**
 * Response validation helpers
 */
export class ResponseValidator {
  /**
   * Validates successful response
   */
  static expectSuccess<T>(response: ApiResponse<T>, expectedStatus: number = 200): T {
    expect(response.status).toBe(expectedStatus);
    expect(response.body).toBeDefined();
    return response.body;
  }

  /**
   * Validates error response
   */
  static expectError(
    response: ApiResponse, 
    expectedStatus: number, 
    expectedMessage?: string
  ): any {
    expect(response.status).toBe(expectedStatus);
    expect(response.body).toBeDefined();
    
    if (expectedMessage) {
      expect(response.body.message).toContain(expectedMessage);
    }
    
    return response.body;
  }

  /**
   * Validates response headers
   */
  static expectHeaders(response: ApiResponse, expectedHeaders: Record<string, string>): void {
    Object.entries(expectedHeaders).forEach(([key, value]) => {
      expect(response.headers[key.toLowerCase()]).toMatch(new RegExp(value));
    });
  }

  /**
   * Validates response content type
   */
  static expectContentType(response: ApiResponse, contentType: string): void {
    expect(response.headers['content-type']).toMatch(new RegExp(contentType));
  }

  /**
   * Validates JSON response structure
   */
  static expectJsonStructure<T>(response: ApiResponse<T>, structure: Partial<T>): T {
    const body = this.expectSuccess(response);
    
    Object.keys(structure).forEach(key => {
      expect(body).toHaveProperty(key);
    });
    
    return body;
  }
}

/**
 * Test data cleanup helper
 */
export class TestDataManager {
  private static cleanupFunctions: Array<() => Promise<void>> = [];

  /**
   * Register a cleanup function to run after tests
   */
  static registerCleanup(cleanupFn: () => Promise<void>): void {
    this.cleanupFunctions.push(cleanupFn);
  }

  /**
   * Run all registered cleanup functions
   */
  static async cleanup(): Promise<void> {
    const errors: Error[] = [];
    
    for (const cleanupFn of this.cleanupFunctions) {
      try {
        await cleanupFn();
      } catch (error) {
        errors.push(error as Error);
      }
    }
    
    this.cleanupFunctions = [];
    
    if (errors.length > 0) {
      console.warn('Some cleanup functions failed:', errors);
    }
  }

  /**
   * Clear all registered cleanup functions without running them
   */
  static clearCleanup(): void {
    this.cleanupFunctions = [];
  }
}