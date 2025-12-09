import { Hono } from 'hono';
import { readFileSync } from 'fs';
import { RouteBuilder } from '../hono-decorator/src/index';
import { ApiController } from './src/controllers/api.controller';

/**
 * 🎨 使用 hono-decorator 装饰器方式创建 Hono 应用（Stage 3 装饰器）
 * 纯 CSR 模式：客户端渲染，API 提供数据
 */
const app = new Hono();

// 🔥 注册所有 API 控制器
console.log('\n🎨 使用 hono-decorator 装饰器框架 (Stage 3 - CSR 模式)\n');
RouteBuilder.buildRoutes(app, [
  ApiController,    // API 路由控制器
]);

// 📄 CSR 模式：根路由返回 index.html
app.get('/', async (c) => {
  // 读取 index.html 模板
  let template = readFileSync('./index.html', 'utf-8');

  // 在开发环境下，Vite 会通过中间件注入 HMR 客户端
  // @ts-ignore - vite 是由 @hono/vite-dev-server 注入的
  const vite = c.get('vite') as any;
  if (vite && vite.transformIndexHtml) {
    template = await vite.transformIndexHtml(c.req.url, template);
  }

  return c.html(template);
});

export default app;

