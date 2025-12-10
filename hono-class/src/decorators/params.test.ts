/**
 * Property-Based Tests for Parameter Decorators
 * 
 * **Feature: legacy-decorators, Property 5: Parameter Resolution - PathVariable**
 * **Feature: legacy-decorators, Property 6: Parameter Resolution - RequestParam**
 * **Feature: legacy-decorators, Property 7: Parameter Resolution - RequestHeader**
 * **Feature: legacy-decorators, Property 8: Parameter Resolution - RequestBody**
 * **Feature: legacy-decorators, Property 9: Default Value Application**
 * **Validates: Requirements 4.1, 4.2, 4.3, 4.4, 4.6**
 */
import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import 'reflect-metadata';
import {
  PathVariable,
  RequestParam,
  RequestHeader,
  RequestBody,
  CookieValue,
  Ctx,
  getParamMetadata,
} from './params.ts';
import { METADATA_KEYS, ParamType, type ParamMetadata } from '../metadata/constants.ts';

describe('Parameter Decorators Property Tests', () => {
  /**
   * **Feature: legacy-decorators, Property 5: Parameter Resolution - PathVariable**
   * **Validates: Requirements 4.1**
   * 
   * For any parameter decorated with @PathVariable(name), the parameter metadata
   * should be stored with correct type, index, and name.
   */
  describe('Property 5: PathVariable Parameter Storage', () => {
    it('any parameter decorated with @PathVariable should have metadata stored with PATH_VARIABLE type', () => {
      fc.assert(
        fc.property(
          // Generate parameter name
          fc.string({ minLength: 1, maxLength: 20 }).filter(s => /^[a-zA-Z][a-zA-Z0-9_]*$/.test(s)),
          // Generate parameter index
          fc.integer({ min: 0, max: 5 }),
          (paramName, paramIndex) => {
            // Create a fresh class with a method
            class TestController {
              testMethod(...args: any[]) { return args; }
            }

            // Apply @PathVariable decorator
            const decorator = PathVariable(paramName);
            decorator(TestController.prototype, 'testMethod', paramIndex);

            // Retrieve parameter metadata
            const params: ParamMetadata[] = Reflect.getMetadata(
              METADATA_KEYS.PARAMS,
              TestController,
              'testMethod'
            ) || [];

            // Verify metadata was stored
            expect(params.length).toBeGreaterThan(0);

            // Find the parameter metadata
            const param = params.find(p => p.index === paramIndex);
            expect(param).toBeDefined();
            expect(param!.type).toBe(ParamType.PATH_VARIABLE);
            expect(param!.name).toBe(paramName);
            expect(param!.index).toBe(paramIndex);

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });
  });


  /**
   * **Feature: legacy-decorators, Property 6: Parameter Resolution - RequestParam**
   * **Validates: Requirements 4.2**
   * 
   * For any parameter decorated with @RequestParam(name), the parameter metadata
   * should be stored with correct type, index, and name.
   */
  describe('Property 6: RequestParam Parameter Storage', () => {
    it('any parameter decorated with @RequestParam should have metadata stored with REQUEST_PARAM type', () => {
      fc.assert(
        fc.property(
          // Generate parameter name
          fc.string({ minLength: 1, maxLength: 20 }).filter(s => /^[a-zA-Z][a-zA-Z0-9_]*$/.test(s)),
          // Generate parameter index
          fc.integer({ min: 0, max: 5 }),
          (paramName, paramIndex) => {
            class TestController {
              testMethod(...args: any[]) { return args; }
            }

            // Apply @RequestParam decorator
            const decorator = RequestParam(paramName);
            decorator(TestController.prototype, 'testMethod', paramIndex);

            // Retrieve parameter metadata
            const params: ParamMetadata[] = Reflect.getMetadata(
              METADATA_KEYS.PARAMS,
              TestController,
              'testMethod'
            ) || [];

            // Verify metadata was stored
            expect(params.length).toBeGreaterThan(0);

            // Find the parameter metadata
            const param = params.find(p => p.index === paramIndex);
            expect(param).toBeDefined();
            expect(param!.type).toBe(ParamType.REQUEST_PARAM);
            expect(param!.name).toBe(paramName);
            expect(param!.index).toBe(paramIndex);

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * **Feature: legacy-decorators, Property 7: Parameter Resolution - RequestHeader**
   * **Validates: Requirements 4.3**
   * 
   * For any parameter decorated with @RequestHeader(name), the parameter metadata
   * should be stored with correct type, index, and name.
   */
  describe('Property 7: RequestHeader Parameter Storage', () => {
    it('any parameter decorated with @RequestHeader should have metadata stored with REQUEST_HEADER type', () => {
      fc.assert(
        fc.property(
          // Generate header name (HTTP headers are case-insensitive, typically use kebab-case)
          fc.string({ minLength: 1, maxLength: 30 }).filter(s => /^[a-zA-Z][a-zA-Z0-9\-]*$/.test(s)),
          // Generate parameter index
          fc.integer({ min: 0, max: 5 }),
          (headerName, paramIndex) => {
            class TestController {
              testMethod(...args: any[]) { return args; }
            }

            // Apply @RequestHeader decorator
            const decorator = RequestHeader(headerName);
            decorator(TestController.prototype, 'testMethod', paramIndex);

            // Retrieve parameter metadata
            const params: ParamMetadata[] = Reflect.getMetadata(
              METADATA_KEYS.PARAMS,
              TestController,
              'testMethod'
            ) || [];

            // Verify metadata was stored
            expect(params.length).toBeGreaterThan(0);

            // Find the parameter metadata
            const param = params.find(p => p.index === paramIndex);
            expect(param).toBeDefined();
            expect(param!.type).toBe(ParamType.REQUEST_HEADER);
            expect(param!.name).toBe(headerName);
            expect(param!.index).toBe(paramIndex);

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * **Feature: legacy-decorators, Property 8: Parameter Resolution - RequestBody**
   * **Validates: Requirements 4.4**
   * 
   * For any parameter decorated with @RequestBody, the parameter metadata
   * should be stored with correct type and index.
   */
  describe('Property 8: RequestBody Parameter Storage', () => {
    it('any parameter decorated with @RequestBody should have metadata stored with REQUEST_BODY type', () => {
      fc.assert(
        fc.property(
          // Generate parameter index
          fc.integer({ min: 0, max: 5 }),
          (paramIndex) => {
            class TestController {
              testMethod(...args: any[]) { return args; }
            }

            // Apply @RequestBody decorator (no name needed for body)
            const decorator = RequestBody();
            decorator(TestController.prototype, 'testMethod', paramIndex);

            // Retrieve parameter metadata
            const params: ParamMetadata[] = Reflect.getMetadata(
              METADATA_KEYS.PARAMS,
              TestController,
              'testMethod'
            ) || [];

            // Verify metadata was stored
            expect(params.length).toBeGreaterThan(0);

            // Find the parameter metadata
            const param = params.find(p => p.index === paramIndex);
            expect(param).toBeDefined();
            expect(param!.type).toBe(ParamType.REQUEST_BODY);
            expect(param!.index).toBe(paramIndex);

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });
  });


  /**
   * Test multiple parameters on the same method
   */
  describe('Multiple Parameters on Same Method', () => {
    it('multiple decorated parameters should all be stored in metadata', () => {
      fc.assert(
        fc.property(
          // Generate number of parameters
          fc.integer({ min: 2, max: 5 }),
          (numParams) => {
            class TestController {
              testMethod(...args: any[]) { return args; }
            }

            // Apply different parameter decorators
            const decorators = [
              { decorator: PathVariable('id'), type: ParamType.PATH_VARIABLE, name: 'id' },
              { decorator: RequestParam('page'), type: ParamType.REQUEST_PARAM, name: 'page' },
              { decorator: RequestHeader('Authorization'), type: ParamType.REQUEST_HEADER, name: 'Authorization' },
              { decorator: RequestBody(), type: ParamType.REQUEST_BODY, name: undefined },
              { decorator: CookieValue('session'), type: ParamType.COOKIE_VALUE, name: 'session' },
            ];

            // Apply decorators for each parameter
            for (let i = 0; i < numParams; i++) {
              const { decorator } = decorators[i % decorators.length];
              decorator(TestController.prototype, 'testMethod', i);
            }

            // Retrieve parameter metadata
            const params: ParamMetadata[] = Reflect.getMetadata(
              METADATA_KEYS.PARAMS,
              TestController,
              'testMethod'
            ) || [];

            // Verify all parameters are stored
            expect(params.length).toBe(numParams);

            // Verify each parameter has correct index
            for (let i = 0; i < numParams; i++) {
              const param = params.find(p => p.index === i);
              expect(param).toBeDefined();
              expect(param!.type).toBe(decorators[i % decorators.length].type);
            }

            return true;
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  /**
   * Test @CookieValue decorator
   */
  describe('CookieValue Parameter Storage', () => {
    it('any parameter decorated with @CookieValue should have metadata stored with COOKIE_VALUE type', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 20 }).filter(s => /^[a-zA-Z][a-zA-Z0-9_]*$/.test(s)),
          fc.integer({ min: 0, max: 5 }),
          (cookieName, paramIndex) => {
            class TestController {
              testMethod(...args: any[]) { return args; }
            }

            const decorator = CookieValue(cookieName);
            decorator(TestController.prototype, 'testMethod', paramIndex);

            const params: ParamMetadata[] = Reflect.getMetadata(
              METADATA_KEYS.PARAMS,
              TestController,
              'testMethod'
            ) || [];

            const param = params.find(p => p.index === paramIndex);
            expect(param).toBeDefined();
            expect(param!.type).toBe(ParamType.COOKIE_VALUE);
            expect(param!.name).toBe(cookieName);

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Test @Ctx decorator
   */
  describe('Ctx Parameter Storage', () => {
    it('any parameter decorated with @Ctx should have metadata stored with CONTEXT type', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 5 }),
          (paramIndex) => {
            class TestController {
              testMethod(...args: any[]) { return args; }
            }

            const decorator = Ctx();
            decorator(TestController.prototype, 'testMethod', paramIndex);

            const params: ParamMetadata[] = Reflect.getMetadata(
              METADATA_KEYS.PARAMS,
              TestController,
              'testMethod'
            ) || [];

            const param = params.find(p => p.index === paramIndex);
            expect(param).toBeDefined();
            expect(param!.type).toBe(ParamType.CONTEXT);

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Test getParamMetadata helper function
   */
  describe('getParamMetadata Helper', () => {
    it('should return all parameter metadata for a method', () => {
      class TestController {
        testMethod(id: string, page: string) { return { id, page }; }
      }

      // Apply decorators
      PathVariable('id')(TestController.prototype, 'testMethod', 0);
      RequestParam('page')(TestController.prototype, 'testMethod', 1);

      // Use helper function
      const params = getParamMetadata(TestController, 'testMethod');

      expect(params.length).toBe(2);
      expect(params.some(p => p.type === ParamType.PATH_VARIABLE && p.name === 'id')).toBe(true);
      expect(params.some(p => p.type === ParamType.REQUEST_PARAM && p.name === 'page')).toBe(true);
    });

    it('should return empty array for method without parameter decorators', () => {
      class TestController {
        testMethod() { return 'test'; }
      }

      const params = getParamMetadata(TestController, 'testMethod');
      expect(params).toEqual([]);
    });
  });
});


/**
 * **Feature: legacy-decorators, Property 9: Default Value Application**
 * **Validates: Requirements 4.6**
 * 
 * For any parameter decorator with a defaultValue specified, the metadata
 * should store the default value correctly.
 */
describe('Property 9: Default Value Application', () => {
  it('any parameter decorator with defaultValue should store the default value in metadata', () => {
    fc.assert(
      fc.property(
        // Generate parameter name
        fc.string({ minLength: 1, maxLength: 20 }).filter(s => /^[a-zA-Z][a-zA-Z0-9_]*$/.test(s)),
        // Generate default value (various types)
        fc.oneof(
          fc.string(),
          fc.integer(),
          fc.boolean(),
          fc.constant(null),
          fc.array(fc.integer()),
          fc.record({ key: fc.string() })
        ),
        // Generate parameter index
        fc.integer({ min: 0, max: 5 }),
        (paramName, defaultValue, paramIndex) => {
          class TestController {
            testMethod(...args: any[]) { return args; }
          }

          // Apply decorator with defaultValue option
          const decorator = RequestParam({ name: paramName, defaultValue });
          decorator(TestController.prototype, 'testMethod', paramIndex);

          // Retrieve parameter metadata
          const params: ParamMetadata[] = Reflect.getMetadata(
            METADATA_KEYS.PARAMS,
            TestController,
            'testMethod'
          ) || [];

          // Find the parameter metadata
          const param = params.find(p => p.index === paramIndex);
          expect(param).toBeDefined();
          expect(param!.defaultValue).toEqual(defaultValue);

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('PathVariable with defaultValue should store the default value', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 10 }).filter(s => /^[a-zA-Z][a-zA-Z0-9]*$/.test(s)),
        fc.string(),
        fc.integer({ min: 0, max: 5 }),
        (paramName, defaultValue, paramIndex) => {
          class TestController {
            testMethod(...args: any[]) { return args; }
          }

          const decorator = PathVariable({ name: paramName, defaultValue });
          decorator(TestController.prototype, 'testMethod', paramIndex);

          const params: ParamMetadata[] = Reflect.getMetadata(
            METADATA_KEYS.PARAMS,
            TestController,
            'testMethod'
          ) || [];

          const param = params.find(p => p.index === paramIndex);
          expect(param).toBeDefined();
          expect(param!.type).toBe(ParamType.PATH_VARIABLE);
          expect(param!.defaultValue).toBe(defaultValue);

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('RequestHeader with defaultValue should store the default value', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 20 }).filter(s => /^[a-zA-Z][a-zA-Z0-9\-]*$/.test(s)),
        fc.string(),
        fc.integer({ min: 0, max: 5 }),
        (headerName, defaultValue, paramIndex) => {
          class TestController {
            testMethod(...args: any[]) { return args; }
          }

          const decorator = RequestHeader({ name: headerName, defaultValue });
          decorator(TestController.prototype, 'testMethod', paramIndex);

          const params: ParamMetadata[] = Reflect.getMetadata(
            METADATA_KEYS.PARAMS,
            TestController,
            'testMethod'
          ) || [];

          const param = params.find(p => p.index === paramIndex);
          expect(param).toBeDefined();
          expect(param!.type).toBe(ParamType.REQUEST_HEADER);
          expect(param!.defaultValue).toBe(defaultValue);

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('CookieValue with defaultValue should store the default value', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 20 }).filter(s => /^[a-zA-Z][a-zA-Z0-9_]*$/.test(s)),
        fc.string(),
        fc.integer({ min: 0, max: 5 }),
        (cookieName, defaultValue, paramIndex) => {
          class TestController {
            testMethod(...args: any[]) { return args; }
          }

          const decorator = CookieValue({ name: cookieName, defaultValue });
          decorator(TestController.prototype, 'testMethod', paramIndex);

          const params: ParamMetadata[] = Reflect.getMetadata(
            METADATA_KEYS.PARAMS,
            TestController,
            'testMethod'
          ) || [];

          const param = params.find(p => p.index === paramIndex);
          expect(param).toBeDefined();
          expect(param!.type).toBe(ParamType.COOKIE_VALUE);
          expect(param!.defaultValue).toBe(defaultValue);

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('required flag should default to true and be configurable', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 10 }).filter(s => /^[a-zA-Z][a-zA-Z0-9]*$/.test(s)),
        fc.boolean(),
        fc.integer({ min: 0, max: 5 }),
        (paramName, required, paramIndex) => {
          class TestController {
            testMethod(...args: any[]) { return args; }
          }

          // Apply decorator with explicit required option
          const decorator = RequestParam({ name: paramName, required });
          decorator(TestController.prototype, 'testMethod', paramIndex);

          const params: ParamMetadata[] = Reflect.getMetadata(
            METADATA_KEYS.PARAMS,
            TestController,
            'testMethod'
          ) || [];

          const param = params.find(p => p.index === paramIndex);
          expect(param).toBeDefined();
          expect(param!.required).toBe(required);

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('required should default to true when not specified', () => {
    class TestController {
      testMethod(param: string) { return param; }
    }

    // Apply decorator without required option
    const decorator = RequestParam('param');
    decorator(TestController.prototype, 'testMethod', 0);

    const params: ParamMetadata[] = Reflect.getMetadata(
      METADATA_KEYS.PARAMS,
      TestController,
      'testMethod'
    ) || [];

    const param = params.find(p => p.index === 0);
    expect(param).toBeDefined();
    expect(param!.required).toBe(true);
  });
});
