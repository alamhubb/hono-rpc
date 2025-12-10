/**
 * Property-Based Tests for AppConfig
 * 
 * **Feature: legacy-decorators, Property 10: Response Status Application**
 * **Validates: Requirements 5.4, 6.1**
 * 
 * **Feature: legacy-decorators, Property 11: Exception Handler Matching**
 * **Validates: Requirements 7.2, 7.3**
 */
import { describe, it, expect, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import 'reflect-metadata';
import { Hono } from 'hono';
import { AppConfig } from './app-config.ts';
import { RestController, RequestMapping, ControllerAdvice } from '../decorators/controller.ts';
import { GetMapping, PostMapping, ResponseStatus, ExceptionHandler } from '../decorators/http-methods.ts';
import { RequestBody } from '../decorators/params.ts';

describe('AppConfig Property Tests', () => {
  beforeEach(() => {
    // Reset AppConfig state before each test
    AppConfig.reset();
  });

  /**
   * **Feature: legacy-decorators, Property 10: Response Status Application**
   * **Validates: Requirements 5.4, 6.1**
   * 
   * For any method decorated with @ResponseStatus(code), successful responses 
   * should use the specified status code.
   */
  describe('Property 10: Response Status Application', () => {
    it('any method with @ResponseStatus should return the specified status code', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate common HTTP success status codes that support JSON body
          // Using only well-known status codes that Hono's ContentfulStatusCode supports
          fc.constantFrom(200, 201, 202, 203, 206, 207, 208, 226, 300, 301, 302, 303, 307, 308),
          // Generate response data
          fc.record({
            message: fc.string({ minLength: 1, maxLength: 50 }),
            success: fc.boolean(),
          }),
          async (statusCode, responseData) => {
            // Reset for each iteration
            AppConfig.reset();

            // Create a controller class dynamically with @ResponseStatus
            @RestController
            @RequestMapping('/test')
            class TestController {
              @GetMapping('/status')
              @ResponseStatus(statusCode)
              getStatus() {
                return responseData;
              }
            }

            // Build the app
            const app = new Hono();
            AppConfig.buildApp(app);

            // Make a request
            const res = await app.request('/test/status');

            // Verify the status code matches what was specified in @ResponseStatus
            expect(res.status).toBe(statusCode);

            // Verify the response body
            const body = await res.json();
            expect(body).toEqual(responseData);

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });


    it('method without @ResponseStatus should default to 200', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate response data
          fc.record({
            data: fc.string({ minLength: 1, maxLength: 30 }),
          }),
          async (responseData) => {
            // Reset for each iteration
            AppConfig.reset();

            // Create a controller without @ResponseStatus
            @RestController
            @RequestMapping('/api')
            class DefaultController {
              @GetMapping('/default')
              getData() {
                return responseData;
              }
            }

            // Build the app
            const app = new Hono();
            AppConfig.buildApp(app);

            // Make a request
            const res = await app.request('/api/default');

            // Should default to 200
            expect(res.status).toBe(200);

            // Verify the response body
            const body = await res.json();
            expect(body).toEqual(responseData);

            return true;
          }
        ),
        { numRuns: 50 }
      );
    });

    it('@ResponseStatus with POST should apply correct status code', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate 201 Created or other success codes (exclude 204 No Content)
          fc.constantFrom(201, 202),
          // Generate request body
          fc.record({
            name: fc.string({ minLength: 1, maxLength: 20 }),
          }),
          async (statusCode, requestBody) => {
            // Reset for each iteration
            AppConfig.reset();

            @RestController
            @RequestMapping('/items')
            class ItemController {
              @PostMapping('/create')
              @ResponseStatus(statusCode)
              createItem(@RequestBody() body: any) {
                return { created: true, item: body };
              }
            }

            // Build the app
            const app = new Hono();
            AppConfig.buildApp(app);

            // Make a POST request
            const res = await app.request('/items/create', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(requestBody),
            });

            // Verify the status code
            expect(res.status).toBe(statusCode);

            return true;
          }
        ),
        { numRuns: 50 }
      );
    });
  });


  /**
   * **Feature: legacy-decorators, Property 11: Exception Handler Matching**
   * **Validates: Requirements 7.2, 7.3**
   * 
   * For any exception thrown in a handler, if a matching @ExceptionHandler exists,
   * it should be invoked with the exception.
   */
  describe('Property 11: Exception Handler Matching', () => {
    // Define custom error classes for testing
    class ValidationError extends Error {
      constructor(message: string) {
        super(message);
        this.name = 'ValidationError';
      }
    }

    class NotFoundError extends Error {
      constructor(message: string) {
        super(message);
        this.name = 'NotFoundError';
      }
    }

    class UnauthorizedError extends Error {
      constructor(message: string) {
        super(message);
        this.name = 'UnauthorizedError';
      }
    }

    it('matching ExceptionHandler should be invoked for thrown exceptions', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate error message
          fc.string({ minLength: 1, maxLength: 50 }),
          async (errorMessage) => {
            // Reset for each iteration
            AppConfig.reset();

            // Create a ControllerAdvice with ExceptionHandler
            @ControllerAdvice
            class GlobalExceptionHandler {
              @ExceptionHandler(ValidationError)
              @ResponseStatus(400)
              handleValidationError(error: ValidationError) {
                return {
                  success: false,
                  type: 'ValidationError',
                  message: error.message,
                };
              }
            }

            // Create a controller that throws ValidationError
            @RestController
            @RequestMapping('/api')
            class TestController {
              @GetMapping('/validate')
              validate() {
                throw new ValidationError(errorMessage);
              }
            }

            // Build the app
            const app = new Hono();
            AppConfig.buildApp(app);

            // Make a request that triggers the error
            const res = await app.request('/api/validate');

            // Verify the exception handler was invoked
            expect(res.status).toBe(400);
            
            const body = await res.json();
            expect(body.success).toBe(false);
            expect(body.type).toBe('ValidationError');
            expect(body.message).toBe(errorMessage);

            return true;
          }
        ),
        { numRuns: 50 }
      );
    });

    it('correct ExceptionHandler should be selected based on error type', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Select which error type to throw
          fc.constantFrom('validation', 'notfound', 'unauthorized'),
          fc.string({ minLength: 1, maxLength: 30 }),
          async (errorType, errorMessage) => {
            // Reset for each iteration
            AppConfig.reset();

            // Create a ControllerAdvice with multiple ExceptionHandlers
            @ControllerAdvice
            class MultiExceptionHandler {
              @ExceptionHandler(ValidationError)
              @ResponseStatus(400)
              handleValidation(error: ValidationError) {
                return { type: 'validation', message: error.message };
              }

              @ExceptionHandler(NotFoundError)
              @ResponseStatus(404)
              handleNotFound(error: NotFoundError) {
                return { type: 'notfound', message: error.message };
              }

              @ExceptionHandler(UnauthorizedError)
              @ResponseStatus(401)
              handleUnauthorized(error: UnauthorizedError) {
                return { type: 'unauthorized', message: error.message };
              }
            }

            // Create a controller that throws different errors based on path
            @RestController
            @RequestMapping('/errors')
            class ErrorController {
              @GetMapping('/validation')
              throwValidation() {
                throw new ValidationError(errorMessage);
              }

              @GetMapping('/notfound')
              throwNotFound() {
                throw new NotFoundError(errorMessage);
              }

              @GetMapping('/unauthorized')
              throwUnauthorized() {
                throw new UnauthorizedError(errorMessage);
              }
            }

            // Build the app
            const app = new Hono();
            AppConfig.buildApp(app);

            // Make a request based on error type
            const res = await app.request(`/errors/${errorType}`);
            const body = await res.json();

            // Verify correct handler was invoked
            expect(body.type).toBe(errorType);
            expect(body.message).toBe(errorMessage);

            // Verify correct status code
            const expectedStatus = {
              validation: 400,
              notfound: 404,
              unauthorized: 401,
            }[errorType];
            expect(res.status).toBe(expectedStatus);

            return true;
          }
        ),
        { numRuns: 50 }
      );
    });


    it('unhandled exceptions should return 500 error', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 1, maxLength: 50 }),
          async (errorMessage) => {
            // Reset for each iteration
            AppConfig.reset();

            // Create a controller that throws a generic Error (no handler registered)
            @RestController
            @RequestMapping('/unhandled')
            class UnhandledController {
              @GetMapping('/error')
              throwError() {
                throw new Error(errorMessage);
              }
            }

            // Build the app (no ControllerAdvice registered)
            const app = new Hono();
            AppConfig.buildApp(app);

            // Make a request
            const res = await app.request('/unhandled/error');

            // Should return 500 for unhandled exceptions
            expect(res.status).toBe(500);

            const body = await res.json();
            expect(body.success).toBe(false);
            expect(body.message).toBe(errorMessage);

            return true;
          }
        ),
        { numRuns: 50 }
      );
    });

    it('ExceptionHandler should handle subclass errors', async () => {
      // Reset for this test
      AppConfig.reset();

      // Create a ControllerAdvice that handles base Error class
      @ControllerAdvice
      class BaseErrorHandler {
        @ExceptionHandler(Error)
        @ResponseStatus(500)
        handleAnyError(error: Error) {
          return {
            handled: true,
            errorName: error.name,
            message: error.message,
          };
        }
      }

      // Create a controller that throws a subclass error
      @RestController
      @RequestMapping('/subclass')
      class SubclassController {
        @GetMapping('/test')
        throwSubclass() {
          throw new ValidationError('subclass error');
        }
      }

      // Build the app
      const app = new Hono();
      AppConfig.buildApp(app);

      // Make a request
      const res = await app.request('/subclass/test');

      // The base Error handler should catch the ValidationError subclass
      expect(res.status).toBe(500);

      const body = await res.json();
      expect(body.handled).toBe(true);
      expect(body.errorName).toBe('ValidationError');
    });
  });
});
