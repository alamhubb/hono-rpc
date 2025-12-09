import { useHono } from 'hono-decorator';
// 导入控制器（装饰器会自动注册）
import './controllers/HelloController';

const app = useHono();

export default app;

