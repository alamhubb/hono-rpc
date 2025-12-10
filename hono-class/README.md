# hono-class

🎨 Spring Boot 风格的装饰器路由框架，基于 [Hono](https://hono.dev/) 和 **Legacy Decorators (experimentalDecorators)**。

## ✨ 特性

- 🎯 **Spring Boot 风格** - `@RestController`、`@GetMapping`、`@PostMapping` 熟悉的命名
- 🔧 **参数装饰器** - `@PathVariable`、`@RequestParam`、`@RequestBody`、`@RequestHeader` 等
- 🛡️ **异常处理** - `@ControllerAdvice`、`@ExceptionHandler` 全局异常处理
- 📦 **响应状态** - `@ResponseStatus` 自定义 HTTP 状态码
- 🌐 **CORS 支持** - `@CrossOrigin` 跨域配置
- 🔥 **自动扫描** - `useHono()` 自动扫描并注册控制器

## 📦 安装

```bash
npm install hono reflect-metadata
# hono-class 目前作为本地包使用
```

## 🚀 快速开始

### 1. 配置 TypeScript

确保 `tsconfig.json` 启用旧版装饰器：

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "strict": true,
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true
  }
}
```

### 2. 创建控制器

```typescript
import { 
  RestController, 
  RequestMapping, 
  GetMapping, 
  PostMapping,
  PathVariable,
  RequestParam,
  RequestBody,
  ResponseStatus
} from 'hono-class';

@RestController
@RequestMapping('/api/users')
export class UserController {

  // GET /api/users?page=1&limit=10
  @GetMapping('')
  getUsers(
    @RequestParam({ name: 'page', defaultValue: '1' }) page: string,
    @RequestParam({ name: 'limit', defaultValue: '10' }) limit: string
  ) {
    return { users: [], page: parseInt(page), limit: parseInt(limit) };
  }

  // GET /api/users/:id
  @GetMapping('/:id')
  getUserById(@PathVariable('id') id: string) {
    return { id, name: 'User ' + id };
  }

  // POST /api/users - 返回 201 Created
  @PostMapping('')
  @ResponseStatus(201, 'Created')
  createUser(@RequestBody() body: { name: string; email: string }) {
    return { success: true, user: body };
  }
}
```

### 3. 启动服务器

```typescript
import { serve } from '@hono/node-server';
import { useHono } from 'hono-class';

// 自动扫描 src/server/controllers 目录
const app = await useHono();

serve({ fetch: app.fetch, port: 3000 });
console.log('Server running on http://localhost:3000');
```

---

## 📘 装饰器参考

### 类装饰器

| 装饰器 | 用途 | 示例 |
|--------|------|------|
| `@RestController` | 标记控制器类 | `@RestController` |
| `@RequestMapping(path)` | 设置路由前缀 | `@RequestMapping('/api')` |
| `@CrossOrigin(options)` | 配置 CORS | `@CrossOrigin({ origin: '*' })` |
| `@ControllerAdvice` | 全局异常处理器 | `@ControllerAdvice` |

### 方法装饰器

| 装饰器 | 用途 | 示例 |
|--------|------|------|
| `@GetMapping(path)` | 处理 GET 请求 | `@GetMapping('/users')` |
| `@PostMapping(path)` | 处理 POST 请求 | `@PostMapping('/users')` |
| `@PutMapping(path)` | 处理 PUT 请求 | `@PutMapping('/users/:id')` |
| `@DeleteMapping(path)` | 处理 DELETE 请求 | `@DeleteMapping('/users/:id')` |
| `@PatchMapping(path)` | 处理 PATCH 请求 | `@PatchMapping('/users/:id')` |
| `@ResponseStatus(code)` | 设置响应状态码 | `@ResponseStatus(201)` |
| `@ExceptionHandler(...types)` | 异常处理方法 | `@ExceptionHandler(Error)` |

### 参数装饰器

| 装饰器 | 用途 | 示例 |
|--------|------|------|
| `@PathVariable(name)` | 路径参数 | `@PathVariable('id') id: string` |
| `@RequestParam(options)` | 查询参数 | `@RequestParam('page') page: string` |
| `@RequestHeader(name)` | 请求头 | `@RequestHeader('Authorization') auth: string` |
| `@RequestBody()` | 请求体 | `@RequestBody() body: CreateUserDto` |
| `@CookieValue(name)` | Cookie 值 | `@CookieValue('sessionId') session: string` |
| `@Ctx()` | Hono Context | `@Ctx() ctx: Context` |

---

## 🎯 使用示例

### 参数装饰器

```typescript
@RestController
@RequestMapping('/api')
export class ExampleController {
  // 路径参数
  @GetMapping('/users/:id')
  getUser(@PathVariable('id') id: string) {
    return { id };
  }

  // 查询参数（带默认值）
  @GetMapping('/search')
  search(
    @RequestParam('q') query: string,
    @RequestParam({ name: 'page', defaultValue: '1' }) page: string
  ) {
    return { query, page: parseInt(page) };
  }

  // 请求头
  @GetMapping('/protected')
  protected(@RequestHeader('Authorization') auth: string) {
    return { authorized: !!auth };
  }

  // 请求体
  @PostMapping('/data')
  @ResponseStatus(201)
  createData(@RequestBody() body: any) {
    return { received: body };
  }
}
```

### 异常处理

```typescript
// 自定义异常
class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

// 全局异常处理器
@ControllerAdvice
export class GlobalExceptionHandler {
  @ExceptionHandler(ValidationError)
  @ResponseStatus(400)
  handleValidation(error: ValidationError) {
    return { success: false, message: error.message };
  }

  @ExceptionHandler(Error)
  @ResponseStatus(500)
  handleError(error: Error) {
    return { success: false, message: 'Internal Server Error' };
  }
}

// 控制器中抛出异常
@RestController
@RequestMapping('/api')
export class UserController {
  @PostMapping('/users')
  createUser(@RequestBody() body: any) {
    if (!body.name) {
      throw new ValidationError('Name is required');
    }
    return { user: body };
  }
}
```

### CORS 配置

```typescript
@RestController
@RequestMapping('/api')
@CrossOrigin({
  origin: ['http://localhost:3000', 'https://example.com'],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  maxAge: 86400
})
export class ApiController {
  // ...
}
```

---

## 📖 API 参考

### `useHono(packages?: string[])`

创建并配置 Hono 应用实例，自动扫描并注册控制器。

```typescript
// 默认扫描 ./controllers（相对于 src/server/）
const app = await useHono();

// 自定义扫描路径
const app = await useHono(['./controllers', './api']);
```

### `AppConfig`

全局应用配置类，用于手动注册控制器。

```typescript
import { Hono } from 'hono';
import { AppConfig } from 'hono-class';

const app = new Hono();
AppConfig.registerController(UserController);
AppConfig.buildApp(app);
```

### `ParamResolver`

参数解析器，用于从请求中提取参数值。

```typescript
import { ParamResolver } from 'hono-class';

// 内部使用，通常不需要直接调用
const args = await ParamResolver.resolve(context, paramMetadata);
```

---

## 🔧 实现原理

### 架构概览

```
┌──────────────────────────────────────────────────────────────────┐
│                        编译时 (TypeScript)                        │
├──────────────────────────────────────────────────────────────────┤
│  @RestController                                                 │
│  @RequestMapping('/api')     ──→  Reflect.defineMetadata(PREFIX) │
│  class ApiController {                                           │
│                                                                  │
│    @GetMapping('/users')     ──→  Reflect.defineMetadata(ROUTES) │
│    getUsers(@RequestParam('page') page: string) {}               │
│                              ──→  Reflect.defineMetadata(PARAMS) │
│  }                                                               │
└──────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌──────────────────────────────────────────────────────────────────┐
│                        运行时 (AppConfig)                         │
├──────────────────────────────────────────────────────────────────┤
│  AppConfig.buildApp(app)                                         │
│                                                                  │
│  1. 读取 Reflect.getMetadata(PREFIX, Controller)                 │
│  2. 读取 Reflect.getMetadata(ROUTES, Controller)                 │
│  3. 读取 Reflect.getMetadata(PARAMS, Controller, methodName)     │
│  4. 使用 ParamResolver 解析参数                                   │
│  5. 注册路由到 Hono                                               │
└──────────────────────────────────────────────────────────────────┘
```

### 元数据键

```typescript
export const METADATA_KEYS = {
  CONTROLLER: 'hono:controller',
  PREFIX: 'hono:prefix',
  CORS: 'hono:cors',
  CONTROLLER_ADVICE: 'hono:controllerAdvice',
  ROUTES: 'hono:routes',
  RESPONSE_STATUS: 'hono:responseStatus',
  EXCEPTION_HANDLER: 'hono:exceptionHandler',
  PARAMS: 'hono:params',
};
```

---

## 📝 注意事项

1. **需要 reflect-metadata** - 必须安装并在入口文件导入
2. **TypeScript 配置** - 必须启用 `experimentalDecorators` 和 `emitDecoratorMetadata`
3. **参数顺序** - 参数装饰器按声明顺序解析

## 📄 License

MIT
