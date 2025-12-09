import { useHono } from 'hono-decorator';
// 测试：删除导入看看会发生什么
// import './controllers/HelloController';

const app = useHono();

export default app;

