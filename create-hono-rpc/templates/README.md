# Hono RPC Demo

一次定义，服务端/客户端双用的 RPC 框架示例。

## 快速开始

```bash
npm install
npm run dev
```

打开 http://localhost:5173 查看前端页面。

## 项目结构

```
src/
├── api.ts      # API 定义（服务端/客户端共用）
├── client.ts   # 客户端入口（使用 RPC 调用）
└── index.ts    # 服务端入口
```

## RPC 调用方式

```typescript
// api.ts - 定义 API
import { useRpc } from 'hono-rpc'

const rpc = useRpc()

export const getServerTime = rpc.get('/api/time', async () => {
  return { time: new Date().toISOString() }
})

export const greet = rpc.post('/api/greet', async (body: { name: string }) => {
  return { message: `Hello, ${body.name}!` }
})

// client.ts - 客户端直接调用
import { getServerTime, greet } from './api.js'

const data = await getServerTime()  // 自动发起 GET /api/time
const result = await greet({ name: 'World' })  // 自动发起 POST /api/greet
```

## 开发命令

- `npm run dev` - 同时启动服务端和客户端
- `npm run dev:server` - 仅启动 API 服务器 (端口 3000)
- `npm run dev:client` - 仅启动 Vite 前端 (端口 5173)
- `npm run build` - 构建生产版本
