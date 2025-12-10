import { useHono } from 'hono-decorator';
import { serve } from '@hono/node-server';

// 🎉 零配置：自动扫描并加载控制器
// 类似 Spring Boot 的 @ComponentScan
//
// 约定：
// - 此文件位置：src/server/index.ts
// - 默认扫描：src/server/controllers
const app = await useHono();

// 启动服务器
const port = 3001;

serve({
  fetch: app.fetch,
  port
}, (info) => {
  console.log(`🚀 Server is running on http://localhost:${info.port}`);
});

