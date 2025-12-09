import 'reflect-metadata';
import { Hono } from 'hono';
import { RouteBuilder } from '../hono-decorator/src/index';
import { ApiController } from './src/controllers/api.controller';
import { SsrController } from './src/controllers/ssr.controller';

/**
 * 🎨 使用 hono-decorator 装饰器方式创建 Hono 应用
 */
const app = new Hono();

// 🔥 注册所有控制器
console.log('\n🎨 使用 hono-decorator 装饰器框架\n');
RouteBuilder.buildRoutes(app, [
  ApiController,    // API 路由控制器
  SsrController,    // SSR 路由控制器
]);

export default app;

