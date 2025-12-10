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

- `GET /api/hello` - 欢迎消息
- `GET /api/status` - 服务器状态

### UserController

- `GET /api/users` - 获取所有用户
- `GET /api/users/:id` - 获取指定用户
- `POST /api/users` - 创建新用户

### AdminController（子目录）

- `GET /api/admin/dashboard` - 管理员仪表板
- `GET /api/admin/logs` - 系统日志

## 🧪 测试 API

### 获取欢迎消息

```bash
curl http://localhost:3000/api/hello
```

### 获取所有用户

```bash
curl http://localhost:3000/api/users
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

### 管理员仪表板

```bash
curl http://localhost:3000/api/admin/dashboard
```

## ✨ 特性

- ✅ **零配置** - 自动扫描 `src/server/controllers` 目录
- ✅ **递归扫描** - 支持子目录中的控制器
- ✅ **静态方法** - 支持静态方法和实例方法
- ✅ **类型安全** - 完整的 TypeScript 支持
- ✅ **热重载** - 开发模式下自动重启
- ✅ **纯 Node.js** - 不依赖 Vite 或其他构建工具

## 🎯 约定

- **调用位置**：`src/server/index.ts`
- **控制器目录**：`src/server/controllers`
- **相对路径**：相对于 `src/server/` 目录

## 📚 技术栈

- **Hono** - 轻量级 Web 框架
- **hono-class** - Spring Boot 风格的装饰器路由
- **TypeScript** - 类型安全
- **tsx** - TypeScript 执行器（开发模式）
- **@hono/node-server** - Node.js 适配器

## 🔧 配置

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
import { RestController, RequestMapping, GetMapping } from 'hono-class';
import type { Context } from 'hono';

@RestController
@RequestMapping('/api/products')
export class ProductController {
  @GetMapping('/')
  static getProducts(c: Context) {
    return c.json({ products: [] });
  }
}
```

## 🆚 对比 Vite 版本

| 特性 | Vite 版本 | Standalone 版本 |
|------|----------|----------------|
| **前端** | ✅ 支持 | ❌ 纯后端 |
| **热重载** | ✅ HMR | ✅ 自动重启 |
| **构建工具** | Vite | TypeScript |
| **启动速度** | 快 | 更快 |
| **适用场景** | 全栈应用 | 纯 API 服务 |

## 📄 License

MIT

