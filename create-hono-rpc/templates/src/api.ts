/**
 * API 定义 - 服务端/客户端共用
 */
import { useRpc } from 'hono-rpc'

const rpc = useRpc()

// 示例：获取服务器时间
export const getServerTime = rpc.get('/api/time', async () => {
  return {
    message: '后端返回',
    time: new Date().toISOString(),
    server: 'Hono RPC Server'
  }
})

// 示例：问候接口
export const greet = rpc.post('/api/greet', async (body: { name: string }) => {
  return {
    message: `后端返回: Hello, ${body.name}!`,
    timestamp: Date.now()
  }
})

// 导出 Hono 应用
export const api = rpc.hono
