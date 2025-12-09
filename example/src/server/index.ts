import { useHono } from 'hono-decorator';

// 🎉 自动扫描并加载所有控制器
// 使用 import.meta.glob 扫描 controllers 目录及其所有子目录
const app = useHono({
  controllers: import.meta.glob('./controllers/**/*.ts', { eager: true })
});

export default app;

