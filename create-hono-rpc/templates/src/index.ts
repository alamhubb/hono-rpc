import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { api } from './api.js'

const app = new Hono()

// 启用 CORS（开发时 Vite 在不同端口）
app.use('/api/*', cors())

// 挂载 RPC API
app.route('/', api)

serve({
  fetch: app.fetch,
  port: 3000
}, (info) => {
  console.log(`API Server is running on http://localhost:${info.port}`)
  console.log(`Run 'npm run dev:client' to start the frontend`)
})
