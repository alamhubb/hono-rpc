import { Hono } from 'hono';
import { AppConfig } from 'hono-decorator';
// 导入控制器（装饰器会自动注册）
import './controllers/HelloController';

const app = new Hono();

// 设置 Hono 应用实例，自动注册所有控制器
AppConfig.setHonoApp(app);

export default app;

