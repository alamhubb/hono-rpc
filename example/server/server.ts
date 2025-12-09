import { Hono } from 'hono';
import { RouteBuilder } from 'hono-decorator';
import { HelloController } from './controllers/HelloController';

const app = new Hono();

// 使用 RouteBuilder 注册控制器
RouteBuilder.buildRoutes(app, [HelloController]);

export default app;

