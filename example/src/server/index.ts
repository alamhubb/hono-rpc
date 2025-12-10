import { useHono } from 'hono-class';
import { funUsersApp } from './controllers/userControllerFun.ts';

// 🎉 零配置：自动扫描并加载控制器
// 类似 Spring Boot 的 @ComponentScan
//
// 约定：
// - 此文件位置：src/server/index.ts
// - 默认扫描：src/server/controllers
const app = await useHono();

// 挂载函数式 RPC 路由
app.route('/', funUsersApp);

export default app;

