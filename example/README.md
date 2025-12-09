# Vite + Hono + TypeScript 项目

这是一个使用 Vite、Hono 和 hono-decorator 的全栈 TypeScript 项目示例。

## 📁 项目结构

```
example/
├── src/
│   ├── client/              # 客户端代码
│   │   ├── main.ts          # 前端入口文件
│   │   ├── counter.ts       # 计数器组件
│   │   ├── style.css        # 样式文件
│   │   └── typescript.svg   # TypeScript logo
│   └── server/              # 服务端代码
│       ├── index.ts         # Hono 应用入口
│       └── controllers/     # 控制器目录
│           └── HelloController.ts
├── public/
│   └── vite.svg             # Vite logo
├── index.html               # HTML 入口
├── vite.config.ts           # Vite 配置
├── tsconfig.json            # TypeScript 配置
└── package.json
```

## 🚀 快速开始

### 安装依赖

```bash
npm install
```

### 开发模式

```bash
npm run dev
```

访问 http://localhost:5173

### 构建

```bash
npm run build
```

## 📝 特性

### 客户端 (Client)

- **Vite** - 快速的前端构建工具
- **TypeScript** - 类型安全
- **原生 JavaScript** - 无框架依赖

### 服务端 (Server)

- **Hono** - 轻量级 Web 框架
- **hono-decorator** - Spring Boot 风格的装饰器路由
- **自动注册** - 使用 `useHono()` 自动注册控制器

## 🎯 API 示例

### HelloController

```typescript
@RestController
@RequestMapping('/api')
export class HelloController {
  @GetMapping('/hello')
  hello(c: Context) {
    return c.text('Hello World');
  }
}
```

访问 http://localhost:5173/api/hello 查看效果

## 🔧 配置说明

### Vite 配置

- **entry**: `src/server/index.ts` - Hono 应用入口
- **exclude**: 配置哪些路径由 Vite 处理，哪些由 Hono 处理
- **alias**: 配置 hono-decorator 路径别名

### TypeScript 配置

- **target**: ES2022 - 支持装饰器
- **include**: `src` - 包含所有 src 下的文件

## 📚 了解更多

- [Vite 文档](https://vite.dev/)
- [Hono 文档](https://hono.dev/)
- [TypeScript 文档](https://www.typescriptlang.org/)

