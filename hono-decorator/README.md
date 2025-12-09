# hono-decorator

🎨 Spring Boot 风格的装饰器路由框架，基于 [Hono](https://hono.dev/) 和 **TC39 Stage 3 装饰器标准**。

## ✨ 特性

- 🎯 **Spring Boot 风格** - `@RestController`、`@GetMapping`、`@PostMapping` 熟悉的命名
- 🚀 **TC39 Stage 3 标准** - 使用官方 `Symbol.metadata` 提案，面向未来
- 🔥 **零依赖** - 不需要 `reflect-metadata`，无额外依赖
- 📦 **轻量级** - 代码精简，性能优先
- 🛡️ **类型安全** - TypeScript 5.2+ 原生支持

## 📦 安装

```bash
npm install hono
# hono-decorator 目前作为本地包使用
```

## 🚀 快速开始

### 1. 配置 TypeScript

确保 `tsconfig.json` 不包含旧版装饰器配置（我们使用 Stage 3 标准）：

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "strict": true
    // ❌ 不要添加 experimentalDecorators
    // ❌ 不要添加 emitDecoratorMetadata
  }
}
```

### 2. 创建控制器

```typescript
import { Context } from 'hono';
import { RestController, RequestMapping, GetMapping, PostMapping } from 'hono-decorator';

@RestController
@RequestMapping('/api')
export class UserController {

  // GET /api/users - 参数: (c: Context)
  @GetMapping('/users')
  async getUsers(c: Context) {
    const page = c.req.query('page') || '1';
    return { users: [], page: parseInt(page) };
  }

  // POST /api/users - 参数: (body, c: Context)
  // 请求体自动注入为第一个参数（相当于 @RequestBody）
  @PostMapping('/users')
  async createUser(body: { name: string; email: string }, c: Context) {
    return { success: true, user: body };
  }
}
```

### 3. 注册路由

```typescript
import { Hono } from 'hono';
import { RouteBuilder } from 'hono-decorator';
import { UserController } from './controllers/user.controller';

const app = new Hono();

// 注册所有控制器
RouteBuilder.buildRoutes(app, [
  UserController
]);

export default app;
```

### 4. 启动服务器

**方式 A：使用 Vite Dev Server（推荐开发环境）**

```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import devServer from '@hono/vite-dev-server';

export default defineConfig({
  plugins: [
    devServer({
      entry: 'server.ts',
    }),
  ],
});
```

```bash
npm run dev  # 启动 Vite 开发服务器
```

**方式 B：使用 @hono/node-server（生产环境）**

```typescript
import { serve } from '@hono/node-server';
import app from './server';

serve({ fetch: app.fetch, port: 3000 });
console.log('Server running on http://localhost:3000');
```

---

## 📘 详细使用指南

### 🎯 装饰器速查表

| 装饰器 | 用途 | 示例 |
|--------|------|------|
| `@RestController` | 标记控制器类 | `@RestController` |
| `@RequestMapping(path)` | 设置路由前缀 | `@RequestMapping('/api')` |
| `@GetMapping(path)` | 处理 GET 请求 | `@GetMapping('/users')` |
| `@PostMapping(path)` | 处理 POST 请求 | `@PostMapping('/users')` |

### 📝 方法签名规则

| HTTP 方法 | 方法签名 | 说明 |
|-----------|----------|------|
| **GET** | `(c: Context) => any` | 通过 `c.req.query()` 获取参数 |
| **POST** | `(body: T, c: Context) => any` | body 自动注入为第一个参数 |

### GET 请求示例

```typescript
@GetMapping('/users/:id')
async getUser(c: Context) {
  const id = c.req.param('id');                // 路径参数
  const page = c.req.query('page');            // 查询参数
  const token = c.req.header('Authorization'); // 请求头

  return { id, page };
}
```

### POST 请求示例

```typescript
interface CreateUserDto {
  name: string;
  email: string;
}

@PostMapping('/users')
async createUser(body: CreateUserDto, c: Context) {
  // body 已自动解析为 JSON 对象
  console.log(body.name, body.email);

  return { success: true, user: body };
}
```

### 多控制器注册

```typescript
import { UserController } from './controllers/user.controller';
import { OrderController } from './controllers/order.controller';
import { ProductController } from './controllers/product.controller';

RouteBuilder.buildRoutes(app, [
  UserController,
  OrderController,
  ProductController
]);
```

### 🔄 请求处理流程

```
请求: POST /api/users
Body: { "name": "John", "email": "john@example.com" }
      │
      ▼
┌─────────────────────────────────────────┐
│ Hono 路由匹配: app.post('/api/users')   │
└─────────────────────────────────────────┘
      │
      ▼
┌─────────────────────────────────────────┐
│ RouteBuilder 创建的 handler:            │
│   const body = await c.req.json();      │
│   return instance.createUser(body, c);  │
└─────────────────────────────────────────┘
      │
      ▼
┌─────────────────────────────────────────┐
│ 控制器方法:                              │
│   async createUser(body, c) {           │
│     return { success: true, user: body };│
│   }                                      │
└─────────────────────────────────────────┘
      │
      ▼
响应: { "success": true, "user": { "name": "John", ... } }
```

---

## 📖 API 参考

### 类装饰器

#### `@RestController`

标记一个类为 REST 控制器。

```typescript
@RestController
export class ApiController {
  // ...
}
```

#### `@RequestMapping(prefix?: string)`

定义控制器级别的路由前缀。

```typescript
@RestController
@RequestMapping('/api/v1')
export class ApiController {
  // 所有路由将以 /api/v1 为前缀
}
```

### 方法装饰器

#### `@GetMapping(path?: string)`

处理 GET 请求。方法签名：`(c: Context) => any`

```typescript
@GetMapping('/users')
async getUsers(c: Context) {
  return { users: [] };
}
```

#### `@PostMapping(path?: string)`

处理 POST 请求。方法签名：`(body: any, c: Context) => any`

请求体自动解析并注入为第一个参数（相当于 Spring 的 `@RequestBody`）。

```typescript
@PostMapping('/users')
async createUser(body: CreateUserDto, c: Context) {
  return { success: true, user: body };
}
```

## 🔧 实现原理

### 架构概览

```
┌──────────────────────────────────────────────────────────────────┐
│                        编译时 (TypeScript)                        │
├──────────────────────────────────────────────────────────────────┤
│  @RestController                                                 │
│  @RequestMapping('/api')     ──→  context.metadata[PREFIX] = '/api'
│  class ApiController {                                           │
│                                                                  │
│    @GetMapping('/users')     ──→  context.metadata[ROUTES].push({│
│    getUsers(c: Context) {}        methodName: 'getUsers',        │
│                                   path: '/users',                │
│    @PostMapping('/like')          httpMethod: 'GET'              │
│    like(body, c: Context) {}    })                               │
│  }                                                               │
└──────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌──────────────────────────────────────────────────────────────────┐
│                        运行时 (RouteBuilder)                      │
├──────────────────────────────────────────────────────────────────┤
│  RouteBuilder.buildRoutes(app, [ApiController])                  │
│                                                                  │
│  1. 读取 ApiController[Symbol.metadata]                          │
│  2. 获取 prefix = '/api'                                         │
│  3. 获取 routes = [{methodName, path, httpMethod}...]            │
│  4. 注册到 Hono:                                                 │
│     app.get('/api/users', handler)                               │
│     app.post('/api/like', handler)                               │
└──────────────────────────────────────────────────────────────────┘
```

### 核心组件

#### 1. 元数据存储 (`metadata/constants.ts`)

使用 **TC39 Stage 3 Symbol.metadata 标准** 存储装饰器元数据：

```typescript
// Symbol.metadata Polyfill（Vite 尚未内置支持）
(Symbol as any).metadata ??= Symbol('Symbol.metadata');

// 元数据键（使用 Symbol 确保唯一性）
export const METADATA_KEYS = {
  PREFIX: Symbol('hono:prefix'),   // 存储路由前缀
  ROUTES: Symbol('hono:routes'),   // 存储路由列表
} as const;

// 辅助函数
export function addRoute(metadata, route) { ... }
export function setPrefix(metadata, prefix) { ... }
export function getRoutes(metadata) { ... }
export function getPrefix(metadata) { ... }
```

**关键点**：
- `context.metadata` 是装饰器运行时自动创建的对象
- 装饰器执行完后，可以通过 `Class[Symbol.metadata]` 访问

#### 2. 类装饰器 (`decorators/controller.ts`)

```typescript
// @RequestMapping('/api') - 设置路由前缀
export function RequestMapping(path: string = '') {
  return <T>(target: T, context: ClassDecoratorContext<T>): T => {
    // 写入元数据：context.metadata[PREFIX] = '/api'
    setPrefix(context.metadata, normalizedPath);
    return target;
  };
}
```

#### 3. 方法装饰器 (`decorators/http-methods.ts`)

```typescript
function createMethodDecorator(method: string, hasBody: boolean = false) {
  return (path: string = '') => {
    return <T>(target: T, context: ClassMethodDecoratorContext): T => {
      // 写入元数据：context.metadata[ROUTES].push({...})
      addRoute(context.metadata, {
        methodName: context.name as string,
        path: normalizedPath,
        httpMethod: method.toUpperCase(),
        hasBody,  // POST 等方法需要自动注入 body
      });
      return target;
    };
  };
}

export const GetMapping = createMethodDecorator('GET', false);
export const PostMapping = createMethodDecorator('POST', true);
```

#### 4. 路由构建器 (`builder/route-builder.ts`)

连接装饰器和 Hono 的桥梁：

```typescript
export class RouteBuilder {
  static buildRoutes(app: Hono, controllers: any[]): void {
    for (const ControllerClass of controllers) {
      // 1. 通过 Symbol.metadata 读取元数据
      const metadata = ControllerClass[Symbol.metadata];
      const prefix = getPrefix(metadata);     // '/api'
      const routes = getRoutes(metadata);     // [{methodName, path, ...}]

      // 2. 创建控制器实例
      const instance = new ControllerClass();

      // 3. 注册每个路由到 Hono
      for (const route of routes) {
        const fullPath = prefix + route.path;  // '/api' + '/users'
        const handler = this.createHandler(instance, route);
        app[route.httpMethod.toLowerCase()](fullPath, handler);
      }
    }
  }

  private static createHandler(instance, route) {
    return async (c: Context) => {
      if (route.hasBody) {
        // POST: 解析 body，传给方法
        const body = await c.req.json();
        return c.json(await instance[route.methodName](body, c));
      } else {
        // GET: 只传 Context
        return c.json(await instance[route.methodName](c));
      }
    };
  }
}
```

### 完整数据流

```
1. 编译时：装饰器执行
   @RequestMapping('/api') → metadata[PREFIX] = '/api'
   @GetMapping('/users')   → metadata[ROUTES].push({...})
   @PostMapping('/like')   → metadata[ROUTES].push({...})

2. 运行时：服务器启动
   RouteBuilder.buildRoutes(app, [ApiController])

3. 读取元数据：
   ApiController[Symbol.metadata] = {
     [PREFIX]: '/api',
     [ROUTES]: [
       { methodName: 'getUsers', path: '/users', httpMethod: 'GET', hasBody: false },
       { methodName: 'like', path: '/like', httpMethod: 'POST', hasBody: true }
     ]
   }

4. 注册到 Hono：
   app.get('/api/users', async (c) => instance.getUsers(c))
   app.post('/api/like', async (c) => {
     const body = await c.req.json();
     return instance.like(body, c);
   })
```

## 🆚 与其他方案对比

| 特性 | hono-decorator | NestJS | 传统 Hono |
|------|---------------|--------|-----------|
| 装饰器标准 | TC39 Stage 3 ✅ | Legacy (experimentalDecorators) | - |
| 元数据存储 | Symbol.metadata | reflect-metadata | - |
| 额外依赖 | 无 | reflect-metadata | 无 |
| Vite 兼容 | ✅ | ❌ (需要配置) | ✅ |
| 代码风格 | Spring Boot | NestJS | 函数式 |

## 📝 注意事项

1. **不支持参数装饰器** - TC39 Stage 3 装饰器标准不支持参数装饰器
   - GET 请求：通过 `c.req.query()` 获取参数
   - POST 请求：请求体自动注入为第一个参数

2. **需要 TypeScript 5.2+** - 使用原生 Stage 3 装饰器支持

3. **Vite 环境** - 需要 Symbol.metadata polyfill（已内置）

## 📄 License

MIT

