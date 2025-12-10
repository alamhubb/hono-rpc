# Hono RPC Project

使用 hono-rpc 创建的项目 - 一次定义，服务端/客户端双用。

## 快速开始

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

服务器将在 http://localhost:3000 启动。

## 项目结构

```
src/
├── api/
│   └── index.ts      # API 定义（服务端/客户端共用）
├── server/
│   └── index.ts      # 服务端入口
└── client/
    └── index.ts      # 客户端示例
```

## API 示例

```typescript
import { useRpc } from 'hono-rpc';

const rpc = useRpc();

// 定义 API
export const getUsers = rpc.get('/api/users', async () => {
  return users;
});

export const createUser = rpc.post('/api/users', async (user: User) => {
  return { id: 1, ...user };
});

// 服务端导出
export default rpc.hono;
```

## 客户端调用

```typescript
import { getUsers, createUser } from './api';

// 直接调用函数，自动发送 HTTP 请求
const users = await getUsers();
const newUser = await createUser({ name: 'Bob', email: 'bob@example.com' });
```

## 测试 API

```bash
# 获取所有用户
curl http://localhost:3000/api/users

# 创建用户
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{"name":"Charlie","email":"charlie@example.com"}'

# 搜索用户
curl "http://localhost:3000/api/users/search?page=1&limit=10"
```

## License

MIT
