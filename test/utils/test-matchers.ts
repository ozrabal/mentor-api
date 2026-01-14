/**
 * Test Matchers
 * 
 * Custom Jest matchers for common testing scenarios:
 * - Domain object validation
 * - Date/timestamp validation
 * - Error type validation
 */

/**
 * Validates that an object has valid UUID format
 */
export function toBeValidUUID(received: string): jest.CustomMatcherResult {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  
  const pass = typeof received === 'string' && uuidRegex.test(received);
  
  return {
    pass,
    message: () => 
      pass 
        ? `expected ${received} not to be a valid UUID`
        : `expected ${received} to be a valid UUID`,
  };
}

/**
 * Validates that a timestamp is recent (within specified milliseconds)
 */
export function toBeRecentTimestamp(
  received: Date | string, 
  withinMs: number = 5000
): jest.CustomMatcherResult {
  const receivedTime = received instanceof Date ? received : new Date(received);
  const now = new Date();
  const diff = Math.abs(now.getTime() - receivedTime.getTime());
  
  const pass = diff <= withinMs;
  
  return {
    pass,
    message: () => 
      pass 
        ? `expected ${received} not to be within ${withinMs}ms of now`
        : `expected ${received} to be within ${withinMs}ms of now (diff: ${diff}ms)`,
  };
}

/**
 * Validates that an object has all required properties
 */
export function toHaveRequiredProperties(
  received: any, 
  properties: string[]
): jest.CustomMatcherResult {
  if (!received || typeof received !== 'object') {
    return {
      pass: false,
      message: () => `expected ${received} to be an object`,
    };
  }

  const missingProperties = properties.filter(prop => !(prop in received));
  const pass = missingProperties.length === 0;
  
  return {
    pass,
    message: () => 
      pass 
        ? `expected object not to have properties: ${properties.join(', ')}`
        : `expected object to have missing properties: ${missingProperties.join(', ')}`,
  };
}

/**
 * Validates that all properties in an object are defined (not null or undefined)
 */
export function toHaveAllPropertiesDefined(received: any): jest.CustomMatcherResult {
  if (!received || typeof received !== 'object') {
    return {
      pass: false,
      message: () => `expected ${received} to be an object`,
    };
  }

  const undefinedProperties = Object.keys(received).filter(
    key => received[key] === null || received[key] === undefined
  );
  
  const pass = undefinedProperties.length === 0;
  
  return {
    pass,
    message: () => 
      pass 
        ? `expected object to have some undefined properties`
        : `expected all properties to be defined, but found undefined: ${undefinedProperties.join(', ')}`,
  };
}

/**
 * Validates ISO 8601 timestamp format
 */
export function toBeISOString(received: string): jest.CustomMatcherResult {
  const isoRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/;
  const pass = typeof received === 'string' && isoRegex.test(received);
  
  return {
    pass,
    message: () => 
      pass 
        ? `expected ${received} not to be a valid ISO string`
        : `expected ${received} to be a valid ISO string (YYYY-MM-DDTHH:mm:ss.sssZ)`,
  };
}

// Extend Jest matchers
declare global {
  namespace jest {
    interface Matchers<R> {
      toBeValidUUID(): R;
      toBeRecentTimestamp(withinMs?: number): R;
      toHaveRequiredProperties(properties: string[]): R;
      toHaveAllPropertiesDefined(): R;
      toBeISOString(): R;
    }
  }
}

// Register matchers
expect.extend({
  toBeValidUUID,
  toBeRecentTimestamp,
  toHaveRequiredProperties,
  toHaveAllPropertiesDefined,
  toBeISOString,
});