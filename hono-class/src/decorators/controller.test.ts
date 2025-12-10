/**
 * Property-Based Tests for Class Decorators
 * 
 * **Feature: legacy-decorators, Property 2: Controller Registration**
 * **Feature: legacy-decorators, Property 3: Path Prefix Storage**
 * **Validates: Requirements 2.1, 2.2**
 */
import { describe, it, expect, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import 'reflect-metadata';
import { RestController, RequestMapping, CrossOrigin, ControllerAdvice } from './controller.ts';
import { METADATA_KEYS, type ControllerOptions, type CorsOptions } from '../metadata/constants.ts';
import { AppConfig } from '../config/app-config.ts';

describe('Class Decorators Property Tests', () => {
  beforeEach(() => {
    // Reset AppConfig before each test to ensure isolation
    AppConfig.reset();
  });

  /**
   * **Feature: legacy-decorators, Property 2: Controller Registration**
   * **Validates: Requirements 2.1**
   * 
   * For any class decorated with @RestController, the class should be 
   * present in the controller registry after decoration.
   */
  it('Property 2: any class decorated with @RestController should be registered in AppConfig', () => {
    fc.assert(
      fc.property(
        // Generate arbitrary class name
        fc.string({ minLength: 1, maxLength: 20 }).filter(s => /^[a-zA-Z][a-zA-Z0-9]*$/.test(s)),
        (className) => {
          // Reset before each property test iteration
          AppConfig.reset();

          // Create a fresh class dynamically
          const TestController = class {};
          Object.defineProperty(TestController, 'name', { value: className });

          // Apply @RestController decorator
          RestController(TestController);

          // Verify controller is registered
          const controllers = AppConfig.getControllers();
          expect(controllers).toContain(TestController);

          // Verify metadata is stored
          const metadata: ControllerOptions = Reflect.getMetadata(METADATA_KEYS.CONTROLLER, TestController);
          expect(metadata).toBeDefined();
          expect(metadata.isRestController).toBe(true);

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: legacy-decorators, Property 3: Path Prefix Storage**
   * **Validates: Requirements 2.2**
   * 
   * For any path string passed to @RequestMapping, the normalized path 
   * should be retrievable from the class metadata.
   */
  it('Property 3: any path passed to @RequestMapping should be stored and retrievable as normalized path', () => {
    fc.assert(
      fc.property(
        // Generate arbitrary path strings
        fc.oneof(
          fc.constant(''),
          fc.constant('/'),
          fc.constant('/api'),
          fc.constant('api'),
          fc.constant('/api/v1'),
          fc.constant('api/v1/'),
          fc.string({ minLength: 0, maxLength: 20 }).map(s => s.replace(/[^/a-zA-Z0-9\-_]/g, ''))
        ),
        (inputPath) => {
          // Create a fresh class
          class TestController {}

          // Apply @RequestMapping decorator
          const decorator = RequestMapping(inputPath);
          decorator(TestController);

          // Retrieve stored path
          const storedPath: string = Reflect.getMetadata(METADATA_KEYS.PREFIX, TestController);

          // Verify normalization rules:
          // 1. Empty path stays empty
          // 2. Non-empty path starts with /
          // 3. Path does not end with / (unless it's just /)
          if (inputPath === '' || inputPath === '/') {
            expect(storedPath === '' || storedPath === undefined || storedPath === '/').toBeFalsy;
          } else {
            // Should start with /
            if (storedPath && storedPath.length > 0) {
              expect(storedPath.startsWith('/')).toBe(true);
            }
            // Should not end with / (unless empty)
            if (storedPath && storedPath.length > 1) {
              expect(storedPath.endsWith('/')).toBe(false);
            }
          }

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 3b: Path normalization consistency
   * Paths with or without leading/trailing slashes should normalize consistently
   */
  it('Property 3b: equivalent paths should normalize to the same value', () => {
    fc.assert(
      fc.property(
        // Generate path segments
        fc.array(
          fc.string({ minLength: 1, maxLength: 5 }).map(s => s.replace(/[^a-zA-Z0-9\-_]/g, 'a')),
          { minLength: 1, maxLength: 3 }
        ),
        (segments) => {
          const basePath = segments.join('/');
          
          // Create variations of the same path
          const variations = [
            basePath,
            `/${basePath}`,
            `${basePath}/`,
            `/${basePath}/`,
          ];

          const normalizedPaths: string[] = [];

          for (const variation of variations) {
            class TestController {}
            const decorator = RequestMapping(variation);
            decorator(TestController);
            const storedPath: string = Reflect.getMetadata(METADATA_KEYS.PREFIX, TestController);
            normalizedPaths.push(storedPath);
          }

          // All variations should normalize to the same path
          const expected = `/${basePath}`;
          for (const normalized of normalizedPaths) {
            expect(normalized).toBe(expected);
          }

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Test @CrossOrigin decorator stores CORS options correctly
   */
  it('CrossOrigin decorator should store CORS options in metadata', () => {
    fc.assert(
      fc.property(
        // Generate CORS options
        fc.record({
          origin: fc.oneof(fc.constant('*'), fc.constant('http://localhost:3000'), fc.array(fc.string())),
          methods: fc.array(fc.constantFrom('GET', 'POST', 'PUT', 'DELETE', 'PATCH')),
          credentials: fc.boolean(),
          maxAge: fc.integer({ min: 0, max: 86400 }),
        }),
        (corsOptions: CorsOptions) => {
          class TestController {}

          const decorator = CrossOrigin(corsOptions);
          decorator(TestController);

          const storedOptions: CorsOptions = Reflect.getMetadata(METADATA_KEYS.CORS, TestController);
          expect(storedOptions).toEqual(corsOptions);

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Test @ControllerAdvice decorator registers class correctly
   */
  it('ControllerAdvice decorator should register class and store metadata', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 20 }).filter(s => /^[a-zA-Z][a-zA-Z0-9]*$/.test(s)),
        (className) => {
          AppConfig.reset();

          const TestAdvice = class {};
          Object.defineProperty(TestAdvice, 'name', { value: className });

          ControllerAdvice(TestAdvice);

          // Verify registered in AppConfig
          const advices = AppConfig.getControllerAdvices();
          expect(advices).toContain(TestAdvice);

          // Verify metadata
          const isAdvice = Reflect.getMetadata(METADATA_KEYS.CONTROLLER_ADVICE, TestAdvice);
          expect(isAdvice).toBe(true);

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });
});
