# Requirements Document

## Introduction

将 hono-class 库从 TC39 Stage 3 装饰器迁移到旧版装饰器（experimentalDecorators），以支持完整的 Spring Boot 风格注解，包括参数装饰器。这将使开发者能够使用 `@PathVariable`、`@RequestParam`、`@RequestHeader` 等参数级装饰器，实现与 Spring Web 更一致的开发体验。

## Glossary

- **hono-class**: 基于 Hono 框架的装饰器路由库
- **Legacy Decorators**: TypeScript 的 experimentalDecorators 实现
- **Stage 3 Decorators**: TC39 标准的装饰器提案
- **reflect-metadata**: 用于存储和读取装饰器元数据的库
- **Parameter Decorator**: 参数装饰器，用于标记方法参数
- **Controller**: 处理 HTTP 请求的类
- **Route Handler**: 处理特定路由的方法

## Requirements

### Requirement 1: 基础架构迁移

**User Story:** As a developer, I want hono-class to use legacy decorators, so that I can use parameter decorators for a Spring-like experience.

#### Acceptance Criteria

1. WHEN the library is initialized THEN the system SHALL import reflect-metadata polyfill
2. WHEN decorators store metadata THEN the system SHALL use Reflect.defineMetadata API instead of Symbol.metadata
3. WHEN decorators read metadata THEN the system SHALL use Reflect.getMetadata API
4. WHEN TypeScript compiles the code THEN the system SHALL require experimentalDecorators and emitDecoratorMetadata options

### Requirement 2: 类装饰器兼容

**User Story:** As a developer, I want existing class decorators to work with legacy decorator syntax, so that my controllers continue to function.

#### Acceptance Criteria

1. WHEN @RestController is applied to a class THEN the system SHALL register the controller for route building
2. WHEN @RequestMapping is applied with a path THEN the system SHALL store the path prefix in metadata
3. WHEN @CrossOrigin is applied to a class THEN the system SHALL store CORS configuration in metadata

### Requirement 3: 方法装饰器兼容

**User Story:** As a developer, I want HTTP method decorators to work with legacy syntax, so that I can define route handlers.

#### Acceptance Criteria

1. WHEN @GetMapping is applied to a method THEN the system SHALL register a GET route handler
2. WHEN @PostMapping is applied to a method THEN the system SHALL register a POST route handler with body parsing
3. WHEN @PutMapping is applied to a method THEN the system SHALL register a PUT route handler with body parsing
4. WHEN @DeleteMapping is applied to a method THEN the system SHALL register a DELETE route handler
5. WHEN @PatchMapping is applied to a method THEN the system SHALL register a PATCH route handler with body parsing
6. WHEN @ResponseStatus is applied to a method THEN the system SHALL store the status code in metadata

### Requirement 4: 参数装饰器实现

**User Story:** As a developer, I want to use parameter decorators like @PathVariable and @RequestParam, so that I can declaratively bind request data to method parameters.

#### Acceptance Criteria

1. WHEN @PathVariable is applied to a parameter THEN the system SHALL extract the value from c.req.param() at runtime
2. WHEN @RequestParam is applied to a parameter THEN the system SHALL extract the value from c.req.query() at runtime
3. WHEN @RequestHeader is applied to a parameter THEN the system SHALL extract the value from c.req.header() at runtime
4. WHEN @RequestBody is applied to a parameter THEN the system SHALL parse and inject the request body as JSON
5. WHEN @CookieValue is applied to a parameter THEN the system SHALL extract the value from cookies at runtime
6. WHEN a parameter decorator specifies a default value THEN the system SHALL use the default when the actual value is missing

### Requirement 5: 路由构建器更新

**User Story:** As a developer, I want the route builder to process parameter metadata, so that decorated parameters receive correct values.

#### Acceptance Criteria

1. WHEN building a route handler THEN the system SHALL read parameter metadata from Reflect API
2. WHEN a handler is invoked THEN the system SHALL resolve all decorated parameters from the Context
3. WHEN parameter resolution fails THEN the system SHALL use default values or return appropriate errors
4. WHEN the handler returns a value THEN the system SHALL apply ResponseStatus metadata if present

### Requirement 6: 响应处理增强

**User Story:** As a developer, I want response decorators to control HTTP responses, so that I can set status codes and headers declaratively.

#### Acceptance Criteria

1. WHEN @ResponseStatus specifies a code THEN the system SHALL use that code for successful responses
2. WHEN @ResponseHeader is applied THEN the system SHALL add the specified header to responses
3. WHEN the method returns a Response object THEN the system SHALL pass it through without modification

### Requirement 7: 异常处理支持

**User Story:** As a developer, I want global exception handling, so that I can handle errors consistently across controllers.

#### Acceptance Criteria

1. WHEN @ControllerAdvice is applied to a class THEN the system SHALL register it as a global exception handler
2. WHEN @ExceptionHandler is applied to a method THEN the system SHALL invoke it for matching exception types
3. WHEN an exception occurs in a handler THEN the system SHALL find and invoke the appropriate ExceptionHandler
4. WHEN no ExceptionHandler matches THEN the system SHALL return a generic 500 error response
