/**
 * Property-Based Tests for Metadata Storage
 * 
 * **Feature: legacy-decorators, Property 1: Metadata Storage Consistency**
 * **Validates: Requirements 1.2, 1.3**
 */
import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import 'reflect-metadata';
import { METADATA_KEYS, ParamType } from './constants';

describe('Metadata Storage Consistency', () => {
  /**
   * **Feature: legacy-decorators, Property 1: Metadata Storage Consistency**
   * **Validates: Requirements 1.2, 1.3**
   * 
   * For any decorator applied to a class, method, or parameter, 
   * the metadata stored via Reflect.defineMetadata should be 
   * retrievable via Reflect.getMetadata with the same key.
   */
  it('Property 1: any metadata stored via Reflect.defineMetadata should be retrievable via Reflect.getMetadata', () => {
    fc.assert(
      fc.property(
        // Generate arbitrary metadata key from METADATA_KEYS
        fc.constantFrom(...Object.values(METADATA_KEYS)),
        // Generate arbitrary metadata value
        fc.oneof(
          fc.string(),
          fc.integer(),
          fc.boolean(),
          fc.array(fc.string()),
          fc.record({ key: fc.string(), value: fc.integer() })
        ),
        (metadataKey, metadataValue) => {
          // Create a fresh target class for each test
          class TestTarget {
            testMethod() {}
          }

          // Store metadata on class
          Reflect.defineMetadata(metadataKey, metadataValue, TestTarget);
          const retrievedClassMeta = Reflect.getMetadata(metadataKey, TestTarget);
          expect(retrievedClassMeta).toEqual(metadataValue);

          // Store metadata on method
          Reflect.defineMetadata(metadataKey, metadataValue, TestTarget, 'testMethod');
          const retrievedMethodMeta = Reflect.getMetadata(metadataKey, TestTarget, 'testMethod');
          expect(retrievedMethodMeta).toEqual(metadataValue);

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Additional property test: Metadata isolation between targets
   * Ensures metadata on one target doesn't affect another target
   */
  it('Property 1b: metadata on different targets should be isolated', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...Object.values(METADATA_KEYS)),
        fc.string(),
        fc.string(),
        (metadataKey, value1, value2) => {
          // Ensure different values for meaningful test
          fc.pre(value1 !== value2);

          class Target1 {}
          class Target2 {}

          Reflect.defineMetadata(metadataKey, value1, Target1);
          Reflect.defineMetadata(metadataKey, value2, Target2);

          expect(Reflect.getMetadata(metadataKey, Target1)).toEqual(value1);
          expect(Reflect.getMetadata(metadataKey, Target2)).toEqual(value2);

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Test that METADATA_KEYS constants are properly defined
   */
  it('should have all required metadata keys defined', () => {
    expect(METADATA_KEYS.CONTROLLER).toBe('hono:controller');
    expect(METADATA_KEYS.PREFIX).toBe('hono:prefix');
    expect(METADATA_KEYS.CORS).toBe('hono:cors');
    expect(METADATA_KEYS.CONTROLLER_ADVICE).toBe('hono:controllerAdvice');
    expect(METADATA_KEYS.ROUTES).toBe('hono:routes');
    expect(METADATA_KEYS.RESPONSE_STATUS).toBe('hono:responseStatus');
    expect(METADATA_KEYS.RESPONSE_HEADERS).toBe('hono:responseHeaders');
    expect(METADATA_KEYS.EXCEPTION_HANDLER).toBe('hono:exceptionHandler');
    expect(METADATA_KEYS.PARAMS).toBe('hono:params');
  });

  /**
   * Test that ParamType enum is properly defined
   */
  it('should have all ParamType values defined', () => {
    expect(ParamType.PATH_VARIABLE).toBe('path');
    expect(ParamType.REQUEST_PARAM).toBe('query');
    expect(ParamType.REQUEST_HEADER).toBe('header');
    expect(ParamType.REQUEST_BODY).toBe('body');
    expect(ParamType.COOKIE_VALUE).toBe('cookie');
    expect(ParamType.CONTEXT).toBe('context');
  });
});
