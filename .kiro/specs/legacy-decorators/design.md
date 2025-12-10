# Design Document: Legacy Decorators Migration

## Overview

将 hono-class 从 TC39 Stage 3 装饰器迁移到 TypeScript 旧版装饰器（experimentalDecorators），以支持完整的 Spring Boot 风格注解体系，特别是参数装饰器。

## Architecture

### 整体架构

```
┌─────────────────────────────────────────────────────────────────┐
│                        编译时 (TypeScript)                       │
├─────────────────────────────────────────────────────────────────┤
│  @RestController                                                │
│  @RequestMapping('/api')                                        │
│  class UserController {                                         │
│                                                                 │
│    @GetMapping('/users/:id')                                    │
│    @ResponseStatus(200)                                         │
│    getUser(                                                     │
│      @PathVariable('id') id: string,                           │
│      @RequestParam('page') page: number                        │
│    ) { ... }                                                    │
│  }                                                              │
│                                                                 │
│  装饰器执行 → Reflect.defineMetadata() 存储元数据                │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                        运行时 (RouteBuilder)                     │
├─────────────────────────────────────────────────────────────────┤
│  1. Reflect.getMetadata() 读取类/方法/参数元数据                 │
│  2. 构建参数解析器列表                                           │
│  3. 创建 Hono handler:                                          │
│     async (c: Context) => {                                     │
│       const args = resolveParameters(c, paramMetadata);         │
│       const result = await method.apply(instance, args);        │
│       return applyResponseMetadata(c, result, responseMetadata);│
│     }                                                           │
│  4. 注册到 Hono: app.get('/api/users/:id', handler)             │
└─────────────────────────────────────────────────────────────────┘
```

### 元数据存储结构

```
Controller Class
├── METADATA_KEYS.CONTROLLER_OPTIONS  → { isRestController: true }
├── METADATA_KEYS.PREFIX              → '/api'
├── METADATA_KEYS.CORS                → { origin: '*', ... }
│
├── Method: getUser
│   ├── METADATA_KEYS.ROUTES          → { path: '/:id', method: 'GET', ... }
│   ├── METADATA_KEYS.RESPONSE_STATUS → 200
│   ├── METADATA_KEYS.RESPONSE_HEADERS→ [{ name: 'X-Custom', value: '...' }]
│   │
│   └── Parameters
│       ├── [0] METADATA_KEYS.PARAMS  → { type: 'path', name: 'id' }
│       └── [1] METADATA_KEYS.PARAMS  → { type: 'query', name: 'page', defaultValue: 1 }
```

## Components and Interfaces

### 1. 元数据常量 (metadata/constants.ts)

```typescript
// 元数据键
export const METADATA_KEYS = {
  // 类级别
  CONTROLLER: 'hono:controller',
  PREFIX: 'hono:prefix',
  CORS: 'hono:cors',
  CONTROLLER_ADVICE: 'hono:controllerAdvice',
  
  // 方法级别
  ROUTES: 'hono:routes',
  RESPONSE_STATUS: 'hono:responseStatus',
  RESPONSE_HEADERS: 'hono:responseHeaders',
  EXCEPTION_HANDLER: 'hono:exceptionHandler',
  
  // 参数级别
  PARAMS: 'hono:params',
} as const;

// 参数类型枚举
export enum ParamType {
  PATH_VARIABLE = 'path',
  REQUEST_PARAM = 'query',
  REQUEST_HEADER = 'header',
  REQUEST_BODY = 'body',
  COOKIE_VALUE = 'cookie',
  CONTEXT = 'context',
}

// 参数元数据接口
export interface ParamMetadata {
  type: ParamType;
  index: number;
  name?: string;
  required?: boolean;
  defaultValue?: any;
}

// 路由元数据接口
export interface RouteMetadata {
  path: string;
  httpMethod: string;
  methodName: string;
  consumes?: string;
  produces?: string;
}

// CORS 配置接口
export interface CorsOptions {
  origin?: string | string[];
  methods?: string[];
  allowedHeaders?: string[];
  exposedHeaders?: string[];
  credentials?: boolean;
  maxAge?: number;
}
```

### 2. 类装饰器 (decorators/controller.ts)

```typescript
export function RestController(target: Function): void {
  Reflect.defineMetadata(METADATA_KEYS.CONTROLLER, { isRestController: true }, target);
  AppConfig.registerController(target);
}

export function RequestMapping(path: string = ''): ClassDecorator {
  return (target: Function) => {
    const normalizedPath = normalizePath(path);
    Reflect.defineMetadata(METADATA_KEYS.PREFIX, normalizedPath, target);
  };
}

export function CrossOrigin(options: CorsOptions = {}): ClassDecorator {
  return (target: Function) => {
    Reflect.defineMetadata(METADATA_KEYS.CORS, options, target);
  };
}

export function ControllerAdvice(target: Function): void {
  Reflect.defineMetadata(METADATA_KEYS.CONTROLLER_ADVICE, true, target);
  AppConfig.registerControllerAdvice(target);
}
```

### 3. 方法装饰器 (decorators/http-methods.ts)

```typescript
interface MappingOptions {
  consumes?: string;
  produces?: string;
}

function createMethodDecorator(httpMethod: string) {
  return (path: string = '', options?: MappingOptions): MethodDecorator => {
    return (target, propertyKey, descriptor) => {
      const routes: RouteMetadata[] = Reflect.getMetadata(METADATA_KEYS.ROUTES, target.constructor) || [];
      routes.push({
        path: normalizePath(path),
        httpMethod,
        methodName: propertyKey as string,
        ...options,
      });
      Reflect.defineMetadata(METADATA_KEYS.ROUTES, routes, target.constructor);
    };
  };
}

export const GetMapping = createMethodDecorator('GET');
export const PostMapping = createMethodDecorator('POST');
export const PutMapping = createMethodDecorator('PUT');
export const DeleteMapping = createMethodDecorator('DELETE');
export const PatchMapping = createMethodDecorator('PATCH');

export function ResponseStatus(code: number, reason?: string): MethodDecorator {
  return (target, propertyKey) => {
    Reflect.defineMetadata(METADATA_KEYS.RESPONSE_STATUS, { code, reason }, target.constructor, propertyKey);
  };
}

export function ExceptionHandler(...errorTypes: Function[]): MethodDecorator {
  return (target, propertyKey) => {
    Reflect.defineMetadata(METADATA_KEYS.EXCEPTION_HANDLER, errorTypes, target.constructor, propertyKey);
  };
}
```

### 4. 参数装饰器 (decorators/params.ts)

```typescript
function createParamDecorator(type: ParamType) {
  return (nameOrOptions?: string | { name?: string; required?: boolean; defaultValue?: any }): ParameterDecorator => {
    return (target, propertyKey, parameterIndex) => {
      const options = typeof nameOrOptions === 'string' 
        ? { name: nameOrOptions } 
        : nameOrOptions || {};
      
      const existingParams: ParamMetadata[] = 
        Reflect.getMetadata(METADATA_KEYS.PARAMS, target.constructor, propertyKey) || [];
      
      existingParams.push({
        type,
        index: parameterIndex,
        name: options.name,
        required: options.required ?? true,
        defaultValue: options.defaultValue,
      });
      
      Reflect.defineMetadata(METADATA_KEYS.PARAMS, existingParams, target.constructor, propertyKey);
    };
  };
}

export const PathVariable = createParamDecorator(ParamType.PATH_VARIABLE);
export const RequestParam = createParamDecorator(ParamType.REQUEST_PARAM);
export const RequestHeader = createParamDecorator(ParamType.REQUEST_HEADER);
export const RequestBody = createParamDecorator(ParamType.REQUEST_BODY);
export const CookieValue = createParamDecorator(ParamType.COOKIE_VALUE);

// 特殊：注入整个 Context
export function Ctx(): ParameterDecorator {
  return createParamDecorator(ParamType.CONTEXT)();
}
```

### 5. 参数解析器 (resolver/param-resolver.ts)

```typescript
export class ParamResolver {
  static async resolve(c: Context, params: ParamMetadata[]): Promise<any[]> {
    // 按 index 排序
    const sortedParams = [...params].sort((a, b) => a.index - b.index);
    const args: any[] = [];
    
    for (const param of sortedParams) {
      let value: any;
      
      switch (param.type) {
        case ParamType.PATH_VARIABLE:
          value = c.req.param(param.name!);
          break;
        case ParamType.REQUEST_PARAM:
          value = c.req.query(param.name!);
          break;
        case ParamType.REQUEST_HEADER:
          value = c.req.header(param.name!);
          break;
        case ParamType.REQUEST_BODY:
          value = await c.req.json();
          break;
        case ParamType.COOKIE_VALUE:
          value = getCookie(c, param.name!);
          break;
        case ParamType.CONTEXT:
          value = c;
          break;
      }
      
      // 应用默认值
      if (value === undefined && param.defaultValue !== undefined) {
        value = param.defaultValue;
      }
      
      // 检查必填
      if (value === undefined && param.required) {
        throw new BadRequestError(`Missing required parameter: ${param.name}`);
      }
      
      args[param.index] = value;
    }
    
    return args;
  }
}
```

### 6. 路由构建器 (builder/route-builder.ts)

```typescript
export class RouteBuilder {
  static buildRoutes(app: Hono, ControllerClass: Function): void {
    const instance = new (ControllerClass as any)();
    const prefix = Reflect.getMetadata(METADATA_KEYS.PREFIX, ControllerClass) || '';
    const routes: RouteMetadata[] = Reflect.getMetadata(METADATA_KEYS.ROUTES, ControllerClass) || [];
    const corsOptions = Reflect.getMetadata(METADATA_KEYS.CORS, ControllerClass);
    
    for (const route of routes) {
      const fullPath = prefix + route.path;
      const handler = this.createHandler(ControllerClass, instance, route);
      
      // 应用 CORS 中间件（如果有）
      if (corsOptions) {
        app.use(fullPath, cors(corsOptions));
      }
      
      // 注册路由
      (app as any)[route.httpMethod.toLowerCase()](fullPath, handler);
    }
  }
  
  private static createHandler(ControllerClass: Function, instance: any, route: RouteMetadata) {
    return async (c: Context) => {
      try {
        // 获取参数元数据
        const paramMetadata: ParamMetadata[] = 
          Reflect.getMetadata(METADATA_KEYS.PARAMS, ControllerClass, route.methodName) || [];
        
        // 解析参数
        const args = await ParamResolver.resolve(c, paramMetadata);
        
        // 如果没有参数装饰器，默认传入 Context（向后兼容）
        if (paramMetadata.length === 0) {
          args.push(c);
        }
        
        // 调用方法
        const result = await instance[route.methodName].apply(instance, args);
        
        // 如果返回 Response，直接返回
        if (result instanceof Response) {
          return result;
        }
        
        // 获取响应状态码
        const statusMeta = Reflect.getMetadata(METADATA_KEYS.RESPONSE_STATUS, ControllerClass, route.methodName);
        const status = statusMeta?.code || 200;
        
        return c.json(result, status);
        
      } catch (error) {
        return this.handleException(c, error, ControllerClass);
      }
    };
  }
  
  private static handleException(c: Context, error: unknown, ControllerClass: Function): Response {
    // 查找匹配的 ExceptionHandler
    const handler = AppConfig.findExceptionHandler(error);
    if (handler) {
      const result = handler(error, c);
      return c.json(result, result.status || 500);
    }
    
    // 默认错误处理
    console.error('[Error]', error);
    return c.json({
      success: false,
      message: error instanceof Error ? error.message : 'Internal Server Error',
    }, 500);
  }
}
```

## Data Models

### ParamMetadata

```typescript
interface ParamMetadata {
  type: ParamType;      // 参数类型
  index: number;        // 参数位置索引
  name?: string;        // 参数名称（用于提取值）
  required?: boolean;   // 是否必填
  defaultValue?: any;   // 默认值
}
```

### RouteMetadata

```typescript
interface RouteMetadata {
  path: string;         // 路由路径
  httpMethod: string;   // HTTP 方法
  methodName: string;   // 方法名
  consumes?: string;    // 接受的 Content-Type
  produces?: string;    // 响应的 Content-Type
}
```

### ExceptionHandlerInfo

```typescript
interface ExceptionHandlerInfo {
  errorTypes: Function[];  // 处理的异常类型
  handler: Function;       // 处理方法
  instance: any;           // ControllerAdvice 实例
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Metadata Storage Consistency
*For any* decorator applied to a class, method, or parameter, the metadata stored via `Reflect.defineMetadata` should be retrievable via `Reflect.getMetadata` with the same key.
**Validates: Requirements 1.2, 1.3**

### Property 2: Controller Registration
*For any* class decorated with `@RestController`, the class should be present in the controller registry after decoration.
**Validates: Requirements 2.1**

### Property 3: Path Prefix Storage
*For any* path string passed to `@RequestMapping`, the normalized path should be retrievable from the class metadata.
**Validates: Requirements 2.2**

### Property 4: Route Registration
*For any* method decorated with an HTTP method decorator (`@GetMapping`, `@PostMapping`, etc.), a corresponding route entry should exist in the routes metadata with correct HTTP method and path.
**Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5**

### Property 5: Parameter Resolution - PathVariable
*For any* parameter decorated with `@PathVariable(name)`, when the handler is invoked with a Context containing that path parameter, the parameter should receive the correct value.
**Validates: Requirements 4.1**

### Property 6: Parameter Resolution - RequestParam
*For any* parameter decorated with `@RequestParam(name)`, when the handler is invoked with a Context containing that query parameter, the parameter should receive the correct value.
**Validates: Requirements 4.2**

### Property 7: Parameter Resolution - RequestHeader
*For any* parameter decorated with `@RequestHeader(name)`, when the handler is invoked with a Context containing that header, the parameter should receive the correct value.
**Validates: Requirements 4.3**

### Property 8: Parameter Resolution - RequestBody
*For any* parameter decorated with `@RequestBody`, when the handler is invoked with a Context containing JSON body, the parameter should receive the parsed object.
**Validates: Requirements 4.4**

### Property 9: Default Value Application
*For any* parameter decorator with a defaultValue specified, when the actual value is missing from the request, the parameter should receive the default value.
**Validates: Requirements 4.6**

### Property 10: Response Status Application
*For any* method decorated with `@ResponseStatus(code)`, successful responses should use the specified status code.
**Validates: Requirements 5.4, 6.1**

### Property 11: Exception Handler Matching
*For any* exception thrown in a handler, if a matching `@ExceptionHandler` exists, it should be invoked with the exception.
**Validates: Requirements 7.2, 7.3**

## Error Handling

### 参数解析错误

| 错误场景 | 处理方式 |
|---------|---------|
| 必填参数缺失 | 抛出 BadRequestError (400) |
| JSON 解析失败 | 抛出 BadRequestError (400) |
| 类型转换失败 | 使用原始字符串值 |

### 异常处理流程

```
Handler 抛出异常
       │
       ▼
查找匹配的 @ExceptionHandler
       │
       ├─ 找到 → 调用 handler，返回结果
       │
       └─ 未找到 → 返回 500 错误
```

## Testing Strategy

### 单元测试

1. **装饰器测试** - 验证元数据正确存储
2. **参数解析器测试** - 验证各类型参数正确解析
3. **路由构建器测试** - 验证路由正确注册

### 属性测试 (Property-Based Testing)

使用 `fast-check` 库进行属性测试：

1. **元数据一致性** - 任意元数据存储后可正确读取
2. **参数解析** - 任意参数值正确传递到方法
3. **默认值应用** - 缺失值时正确应用默认值
4. **异常处理** - 任意异常正确路由到 handler

### 集成测试

1. **完整请求流程** - 从请求到响应的端到端测试
2. **CORS 配置** - 验证跨域头正确设置
3. **异常处理链** - 验证全局异常处理工作正常
