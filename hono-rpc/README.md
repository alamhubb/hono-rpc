# hono-rpc

函数式 RPC 框架 for Hono - 定义一次，服务端/客户端双用

## 特性

- 🚀 **一次定义，双端使用** - 同一份代码，服务端注册路由，客户端发送请求
- 📦 **零配置** - 无需额外配置，开箱即用
- 🔒 **类型安全** - 完整的 TypeScript 类型推断
- 🪶 **轻量** - 基于 Hono，无额外依赖

## 安装

```bash
npm install hono-rpc hono
```

## 快速开始

### 1. 定义 API

```typescript
// src/api/users.ts
import { createRpc } from 'hono-rpc';

const rpc = createRpc();

// 定义用户类型
interface User {
  id: number;
  name: string;
  email: string;
}

// 模拟数据库
const users: User[] = [];
let nextId = 1;

// GET /api/users - 获取所有用户
export const getUsers = rpc.get('/api/users', async () => {
  return users;
});

// POST /api/users - 创建用户
export const createUser = rpc.post<Omit<User, 'id'>, User>(
  '/api/users',
  async (input) => {
    const user = { id: nextId++, ...input };
    users.push(user);
    return user;
  },
  201  // 返回 201 Created
);

// PUT /api/users - 更新用户
export const updateUser = rpc.put<User, User>(
  '/api/users',
  async (input) => {
    const index = users.findIndex(u => u.id === input.id);
    if (index >= 0) {
      users[index] = input;
      return input;
    }
    throw new Error('User not found');
  }
);

// 导出 Hono 应用（服务端使用）
export const usersApp = rpc.hono;
```

### 2. 服务端使用

```typescript
// src/server/index.ts
import { Hono } from 'hono';
import { usersApp } from '../api/users';

const app = new Hono();

// 挂载用户 API
app.route('/', usersApp);

export default app;
```

### 3. 客户端使用

```typescript
// src/client/main.ts
import { getUsers, createUser, updateUser } from '../api/users';

// 直接调用函数，自动发送 HTTP 请求
async function main() {
  // GET /api/users
  const users = await getUsers();
  console.log('Users:', users);

  // POST /api/users
  const newUser = await createUser({
    name: 'Alice',
    email: 'alice@example.com'
  });
  console.log('Created:', newUser);

  // PUT /api/users
  const updated = await updateUser({
    id: newUser.id,
    name: 'Alice Updated',
    email: 'alice@example.com'
  });
  console.log('Updated:', updated);
}

main();
```

## API

### `createRpc(options?)`

创建 RPC 实例。

```typescript
const rpc = createRpc({
  baseUrl: 'http://localhost:3000',  // 客户端请求的基础 URL
  fetch: customFetch,                 // 自定义 fetch 函数
});
```

### `rpc.get<TOutput>(path, handler)`

定义 GET 请求。

```typescript
const getUsers = rpc.get('/api/users', async () => {
  return [{ id: 1, name: 'Alice' }];
});
```

### `rpc.post<TInput, TOutput>(path, handler, statusCode?)`

定义 POST 请求。

```typescript
const createUser = rpc.post<{ name: string }, User>(
  '/api/users',
  async (input) => ({ id: 1, name: input.name }),
  201  // 可选：响应状态码
);
```

### `rpc.put<TInput, TOutput>(path, handler)`

定义 PUT 请求。

### `rpc.delete<TOutput>(path, handler)`

定义 DELETE 请求。

### `rpc.patch<TInput, TOutput>(path, handler)`

定义 PATCH 请求。

### `rpc.hono`

获取 Hono 应用实例，用于服务端挂载。

## 工作原理

```
┌─────────────────────────────────────────────────────────┐
│                    api/users.ts                         │
│                                                         │
│  export const getUsers = rpc.get('/api/users', ...)     │
│  export const createUser = rpc.post('/api/users', ...)  │
│  export const usersApp = rpc.hono                       │
└─────────────────────────────────────────────────────────┘
                    │                    │
         ┌──────────┴──────────┐         │
         ▼                     ▼         ▼
┌─────────────────┐   ┌─────────────────────────┐
│   服务端导入     │   │      客户端导入          │
│                 │   │                         │
│ import usersApp │   │ import { getUsers }     │
│ app.route(...)  │   │ await getUsers()        │
│                 │   │   ↓                     │
│ 注册 Hono 路由   │   │ fetch('/api/users')    │
└─────────────────┘   └─────────────────────────┘
```

## 与 Hono 官方 RPC 对比

| 特性 | hono-rpc | hono/client |
|------|----------|-------------|
| 调用方式 | `getUsers()` | `client.api.users.$get()` |
| 定义方式 | 函数式 | 链式调用 |
| 类型安全 | ✅ | ✅ |
| 服务端直接调用 | ✅ | ❌ |
| 独立函数导出 | ✅ | ❌ |

## License

MIT
