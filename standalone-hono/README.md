# Standalone Hono Server

纯 Node.js + Hono + hono-class 项目（不依赖 Vite）

## 📁 项目结构

```
standalone-hono/
├── src/
│   └── server/
│       ├── index.ts              # 服务器入口
│       └── controllers/          # 控制器目录
│           ├── HelloController.ts
│           ├── UserController.ts
│           └── admin/            # 子目录（测试递归扫描）
│               └── AdminController.ts
├── package.json
├── tsconfig.json
└── README.md
```

## 🚀 快速开始

### 1. 安装依赖

```bash
cd standalone-hono
npm install
```

### 2. 开发模式

```bash
npm run dev
```

服务器将在 http://localhost:3000 启动

### 3. 构建

```bash
npm run build
```

### 4. 生产模式

```bash
npm start
```

## 📡 API 端点

### HelloController

| 端点 | 方法 | 描述 | 参数 |
|------|------|------|------|
| `/api/hello` | GET | 欢迎消息 | `?name=World` (可选) |
| `/api/status` | GET | 服务器状态 | - |
| `/api/headers` | GET | 请求头信息 | - |

### UserController

| 端点 | 方法 | 描述 | 参数 |
|------|------|------|------|
| `/api/users` | GET | 获取所有用户 | `?page=1&limit=10` |
| `/api/users/:id` | GET | 获取指定用户 | - |
| `/api/users` | POST | 创建新用户 | Body: `{name, email}` |

### AdminController（子目录）

| 端点 | 方法 | 描述 | 参数 |
|------|------|------|------|
| `/api/admin/dashboard` | GET | 管理员仪表板 | - |
| `/api/admin/logs` | GET | 系统日志 | `?level=all&limit=10` |

## 🧪 测试 API

### 获取欢迎消息

```bash
# 默认
curl http://localhost:3000/api/hello

# 带参数
curl "http://localhost:3000/api/hello?name=John"
```

### 获取所有用户（分页）

```bash
curl "http://localhost:3000/api/users?page=1&limit=5"
```

### 获取指定用户

```bash
curl http://localhost:3000/api/users/1
```

### 创建用户

```bash
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{"name":"David","email":"david@example.com"}'
```

### 管理员日志（带过滤）

```bash
curl "http://localhost:3000/api/admin/logs?level=error&limit=5"
```

## ✨ 特性

- ✅ **零配置** - 自动扫描 `src/server/controllers` 目录
- ✅ **递归扫描** - 支持子目录中的控制器
- ✅ **参数装饰器** - `@PathVariable`、`@RequestParam`、`@RequestBody`、`@RequestHeader`
- ✅ **响应状态** - `@ResponseStatus` 自定义 HTTP 状态码
- ✅ **CORS 支持** - `@CrossOrigin` 跨域配置
- ✅ **类型安全** - 完整的 TypeScript 支持
- ✅ **热重载** - 开发模式下自动重启

## 🎯 装饰器示例

### 参数装饰器

```typescript
import { 
  RestController, 
  RequestMapping, 
  GetMapping,
  PathVariable,
  RequestParam,
  RequestHeader
} from 'hono-class';

@RestController
@RequestMapping('/api')
export class ExampleController {
  // 路径参数: GET /api/users/123
  @GetMapping('/users/:id')
  getUser(@PathVariable('id') id: string) {
    return { id };
  }

  // 查询参数: GET /api/search?q=test&page=1
  @GetMapping('/search')
  search(
    @RequestParam('q') query: string,
    @RequestParam({ name: 'page', defaultValue: '1' }) page: string
  ) {
    return { query, page };
  }

  // 请求头: GET /api/protected
  @GetMapping('/protected')
  protected(@RequestHeader('Authorization') auth: string) {
    return { authorized: !!auth };
  }
}
```

### 响应状态

```typescript
import { PostMapping, ResponseStatus, RequestBody } from 'hono-class';

@PostMapping('/users')
@ResponseStatus(201, 'Created')
createUser(@RequestBody() body: any) {
  return { success: true, user: body };
}
```

### CORS 配置

```typescript
import { RestController, CrossOrigin } from 'hono-class';

@RestController
@RequestMapping('/api/admin')
@CrossOrigin({ origin: '*', methods: ['GET'] })
export class AdminController {
  // ...
}
```

## 📚 技术栈

- **Hono** - 轻量级 Web 框架
- **hono-class** - Spring Boot 风格的装饰器路由
- **reflect-metadata** - 元数据反射
- **TypeScript** - 类型安全
- **tsx** - TypeScript 执行器（开发模式）
- **@hono/node-server** - Node.js 适配器

## 🔧 配置

### TypeScript 配置

```json
{
  "compilerOptions": {
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true
  }
}
```

### 自定义端口

编辑 `src/server/index.ts`：

```typescript
const port = 3000;  // 修改为你想要的端口
```

### 自定义控制器目录

```typescript
const app = await useHono(['./controllers', './api']);
```

## 📝 添加新控制器

1. 在 `src/server/controllers/` 下创建新文件
2. 使用 `@RestController` 装饰器
3. 自动注册，无需手动导入！

示例：

```typescript
import { 
  RestController, 
  RequestMapping, 
  GetMapping,
  RequestParam 
} from 'hono-class';

@RestController
@RequestMapping('/api/products')
export class ProductController {
  @GetMapping('/')
  getProducts(@RequestParam({ name: 'category', defaultValue: 'all' }) category: string) {
    return { products: [], category };
  }
}
```

## 📄 License

MIT
