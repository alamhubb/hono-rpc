# useHono 使用指南

## 📦 包扫描（ComponentScan）

类似 Spring Boot 的 `@ComponentScan`，`useHono` 支持自动扫描和注册控制器。

## 🎯 约定优于配置

### 核心约定

1. **调用位置约定**：必须在 `src/server/index.ts` 中调用 `useHono()`
2. **控制器位置约定**：默认扫描 `./controllers` 目录（相对于 `src/server/`）
3. **路径规则**：
   - 相对路径：相对于 **`src/server/`** 目录
   - 绝对路径：直接使用

### 基本用法

```typescript
// 文件位置：src/server/index.ts
import { useHono } from 'hono-class';

// 零配置：自动扫描 src/server/controllers
const app = await useHono();

export default app;
```

### 使用示例

#### 示例 1: 零配置（推荐）

```typescript
// 文件位置：src/server/index.ts
import { useHono } from 'hono-class';

// 默认扫描 ./controllers（相对于 src/server/）
// 实际扫描：src/server/controllers
const app = await useHono();

export default app;
```

#### 示例 2: 自定义相对路径

```typescript
// 扫描 ./api（相对于 src/server/）
// 实际扫描：src/server/api
const app = await useHono(['./api']);
```

#### 示例 3: 扫描多个目录

```typescript
// 扫描多个目录（都相对于 src/server/）
const app = await useHono([
  './controllers',  // src/server/controllers
  './api'           // src/server/api
]);
```

#### 示例 4: 使用绝对路径

```typescript
import path from 'path';

const app = await useHono([
  path.resolve(process.cwd(), 'src/server/controllers')
]);
```

### 工作原理

1. **获取项目根目录**：`process.cwd()` 获取项目根目录
2. **计算基础目录**：`项目根目录/src/server`（约定的调用位置）
3. **解析包路径**：相对路径相对于基础目录转换为绝对路径
4. **扫描目录**：使用 Node.js `fs` 模块递归扫描目录
5. **动态导入**：`import()` 动态加载所有 `.ts` 和 `.js` 文件
6. **装饰器执行**：模块加载时，`@RestController` 装饰器自动执行
7. **自动注册**：装饰器调用 `AppConfig.registerController()` 注册控制器
8. **构建应用**：`useHono()` 调用 `AppConfig.buildApp()` 注册所有路由

### 目录结构

```
src/server/
├── index.ts              # 入口文件
└── controllers/          # 控制器目录
    ├── HelloController.ts
    ├── TestController.ts
    └── user/             # 支持子目录
        └── UserController.ts
```

### 注意事项

1. **约定调用位置**
   - 必须在 `src/server/index.ts` 中调用 `useHono()`
   - 这是约定，确保相对路径正确解析

2. **路径规则**
   - 相对路径：相对于 `src/server/` 目录
   - 绝对路径：直接使用
   - 默认路径：`./controllers`（实际为 `src/server/controllers`）

3. **启动目录**
   - 必须在项目根目录启动应用
   - 例如：`npm run dev` 应该在项目根目录执行
   - 不要在 `src/server/` 目录下启动

### 对比 Spring Boot

| Spring Boot | hono-class |
|-------------|----------------|
| `@ComponentScan(basePackages = {"com.example"})` | `useHono(['src/server/controllers'])` |
| 基于包名扫描 | 基于文件路径扫描 |
| 运行时扫描 | 运行时扫描 |
| 约定：包结构 | 约定：文件位置 |

### 优势

- ✅ 自动发现控制器
- ✅ 支持递归子目录
- ✅ 支持多个包路径
- ✅ 灵活的自定义选项
- ✅ 类型安全

