/**
 * Property-Based Tests for HTTP Method Decorators
 * 
 * **Feature: legacy-decorators, Property 4: Route Registration**
 * **Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5**
 */
import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import 'reflect-metadata';
import { 
  GetMapping, 
  PostMapping, 
  PutMapping, 
  DeleteMapping, 
  PatchMapping,
  ResponseStatus,
  ExceptionHandler
} from './http-methods.ts';
import { METADATA_KEYS, type RouteMetadata, type ResponseStatusMetadata } from '../metadata/constants.ts';

describe('HTTP Method Decorators Property Tests', () => {
  /**
   * **Feature: legacy-decorators, Property 4: Route Registration**
   * **Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5**
   * 
   * For any method decorated with an HTTP method decorator (@GetMapping, @PostMapping, etc.),
   * a corresponding route entry should exist in the routes metadata with correct HTTP method and path.
   */
  describe('Property 4: Route Registration', () => {
    // Test data: HTTP method decorators with their expected HTTP methods
    const httpMethodDecorators = [
      { decorator: GetMapping, method: 'GET', name: 'GetMapping' },
      { decorator: PostMapping, method: 'POST', name: 'PostMapping' },
      { decorator: PutMapping, method: 'PUT', name: 'PutMapping' },
      { decorator: DeleteMapping, method: 'DELETE', name: 'DeleteMapping' },
      { decorator: PatchMapping, method: 'PATCH', name: 'PatchMapping' },
    ];

    it('any method decorated with HTTP method decorator should have route registered with correct HTTP method', () => {
      fc.assert(
        fc.property(
          // Generate arbitrary path strings
          fc.oneof(
            fc.constant(''),
            fc.constant('/'),
            fc.constant('/users'),
            fc.constant('users'),
            fc.constant('/users/:id'),
            fc.string({ minLength: 0, maxLength: 20 }).map(s => s.replace(/[^/a-zA-Z0-9\-_:]/g, ''))
          ),
          // Generate method name
          fc.string({ minLength: 1, maxLength: 15 }).filter(s => /^[a-zA-Z][a-zA-Z0-9]*$/.test(s)),
          // Select which HTTP method decorator to test
          fc.integer({ min: 0, max: httpMethodDecorators.length - 1 }),
          (inputPath, methodName, decoratorIndex) => {
            const { decorator, method } = httpMethodDecorators[decoratorIndex];

            // Create a fresh class with a method
            class TestController {
              testMethod() { return 'test'; }
            }
            // Rename method dynamically
            Object.defineProperty(TestController.prototype.testMethod, 'name', { value: methodName });

            // Apply the decorator
            const methodDecorator = decorator(inputPath);
            const descriptor = Object.getOwnPropertyDescriptor(TestController.prototype, 'testMethod')!;
            methodDecorator(TestController.prototype, 'testMethod', descriptor);

            // Retrieve routes metadata
            const routes: RouteMetadata[] = Reflect.getMetadata(METADATA_KEYS.ROUTES, TestController) || [];

            // Verify route was registered
            expect(routes.length).toBeGreaterThan(0);

            // Find the route for our method
            const route = routes.find(r => r.methodName === 'testMethod');
            expect(route).toBeDefined();
            expect(route!.httpMethod).toBe(method);

            // Verify path normalization (should start with / if non-empty)
            if (inputPath && inputPath !== '') {
              const expectedPath = inputPath.startsWith('/') ? inputPath : `/${inputPath}`;
              expect(route!.path).toBe(expectedPath);
            }

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('multiple methods on same class should all be registered', () => {
      fc.assert(
        fc.property(
          // Generate number of methods to add
          fc.integer({ min: 2, max: 5 }),
          (numMethods) => {
            class TestController {}

            // Add multiple methods with different decorators
            for (let i = 0; i < numMethods; i++) {
              const methodName = `method${i}`;
              (TestController.prototype as any)[methodName] = function() { return i; };
              
              const decoratorInfo = httpMethodDecorators[i % httpMethodDecorators.length];
              const methodDecorator = decoratorInfo.decorator(`/path${i}`);
              const descriptor = Object.getOwnPropertyDescriptor(TestController.prototype, methodName)!;
              methodDecorator(TestController.prototype, methodName, descriptor);
            }

            // Verify all routes are registered
            const routes: RouteMetadata[] = Reflect.getMetadata(METADATA_KEYS.ROUTES, TestController) || [];
            expect(routes.length).toBe(numMethods);

            // Verify each method has its route
            for (let i = 0; i < numMethods; i++) {
              const route = routes.find(r => r.methodName === `method${i}`);
              expect(route).toBeDefined();
              expect(route!.path).toBe(`/path${i}`);
            }

            return true;
          }
        ),
        { numRuns: 50 }
      );
    });

    it('consumes and produces options should be stored in route metadata', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('application/json', 'application/xml', 'text/plain', 'multipart/form-data'),
          fc.constantFrom('application/json', 'application/xml', 'text/html'),
          (consumes, produces) => {
            class TestController {
              testMethod() { return 'test'; }
            }

            // Apply decorator with options
            const methodDecorator = PostMapping('/test', { consumes, produces });
            const descriptor = Object.getOwnPropertyDescriptor(TestController.prototype, 'testMethod')!;
            methodDecorator(TestController.prototype, 'testMethod', descriptor);

            // Verify options are stored
            const routes: RouteMetadata[] = Reflect.getMetadata(METADATA_KEYS.ROUTES, TestController) || [];
            const route = routes.find(r => r.methodName === 'testMethod');
            
            expect(route).toBeDefined();
            expect(route!.consumes).toBe(consumes);
            expect(route!.produces).toBe(produces);

            return true;
          }
        ),
        { numRuns: 50 }
      );
    });
  });


  /**
   * Tests for @ResponseStatus decorator
   * **Validates: Requirements 3.6, 6.1**
   */
  describe('ResponseStatus Decorator', () => {
    it('should store status code in method metadata', () => {
      fc.assert(
        fc.property(
          // Generate valid HTTP status codes
          fc.integer({ min: 100, max: 599 }),
          fc.option(fc.string({ minLength: 1, maxLength: 30 })),
          (statusCode, reason) => {
            class TestController {
              testMethod() { return 'test'; }
            }

            // Apply decorator
            const decorator = ResponseStatus(statusCode, reason ?? undefined);
            const descriptor = Object.getOwnPropertyDescriptor(TestController.prototype, 'testMethod')!;
            decorator(TestController.prototype, 'testMethod', descriptor);

            // Verify metadata is stored
            const metadata: ResponseStatusMetadata = Reflect.getMetadata(
              METADATA_KEYS.RESPONSE_STATUS, 
              TestController, 
              'testMethod'
            );

            expect(metadata).toBeDefined();
            expect(metadata.code).toBe(statusCode);
            if (reason) {
              expect(metadata.reason).toBe(reason);
            }

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Tests for @ExceptionHandler decorator
   * **Validates: Requirements 7.2**
   */
  describe('ExceptionHandler Decorator', () => {
    it('should store exception types in method metadata', () => {
      // Define some error classes for testing
      class ValidationError extends Error {}
      class NotFoundError extends Error {}
      class UnauthorizedError extends Error {}

      const errorClasses = [Error, ValidationError, NotFoundError, UnauthorizedError];

      fc.assert(
        fc.property(
          // Generate subset of error classes
          fc.subarray(errorClasses, { minLength: 1, maxLength: 4 }),
          (selectedErrors) => {
            class TestAdvice {
              handleError() { return { error: true }; }
            }

            // Apply decorator with selected error types
            const decorator = ExceptionHandler(...selectedErrors);
            const descriptor = Object.getOwnPropertyDescriptor(TestAdvice.prototype, 'handleError')!;
            decorator(TestAdvice.prototype, 'handleError', descriptor);

            // Verify metadata is stored
            const storedTypes: Function[] = Reflect.getMetadata(
              METADATA_KEYS.EXCEPTION_HANDLER,
              TestAdvice,
              'handleError'
            );

            expect(storedTypes).toBeDefined();
            expect(storedTypes.length).toBe(selectedErrors.length);
            
            // Verify all error types are stored
            for (const errorType of selectedErrors) {
              expect(storedTypes).toContain(errorType);
            }

            return true;
          }
        ),
        { numRuns: 50 }
      );
    });
  });
});
