import { Hono } from 'hono';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { getUsers } from './src/db/queries.js';

const app = new Hono();

/**
 * API 路由：获取用户列表（分页）
 */
app.get('/api/users', async (c) => {
  const offset = parseInt(c.req.query('offset')) || 0;
  const limit = parseInt(c.req.query('limit')) || 10;

  console.log(`[API] 📋 获取用户列表: offset=${offset}, limit=${limit}`);

  try {
    const users = await getUsers(limit, offset);
    console.log(`[API] 返回 ${users.length} 条用户数据`);

    return c.json({
      success: true,
      users,  // 🔑 返回用户数据数组
      count: users.length,
      offset,
      limit,
    });
  } catch (error) {
    console.error('[API] 查询失败:', error);
    return c.json({
      success: false,
      message: error.message,
    }, 500);
  }
});

/**
 * API 路由：点赞
 */
app.post('/api/like', async (c) => {
  try {
    const { userId, nickname } = await c.req.json();

    console.log(
      `[API] 👍 收到点赞请求: userId=${userId}, nickname=${nickname}, time=${new Date().toISOString()}`
    );

    return c.json({
      success: true,
      message: '点赞成功（仅日志）',
    });
  } catch (error) {
    return c.json({
      success: false,
      message: error.message,
    }, 400);
  }
});

/**
 * SSR 路由：渲染首页
 */
app.get('/', async (c) => {
  try {
    // 1. 读取 index.html 模板
    let template = readFileSync(resolve('index.html'), 'utf-8');

    // 2. 获取 Vite 实例并处理 HTML（注入 HMR 客户端等）
    // Vite 实例由 @hono/vite-dev-server 插件注入到 context 中
    const vite = c.get('vite');
    if (vite) {
      template = await vite.transformIndexHtml('/', template);
    }

    // 3. 加载服务端入口模块
    const { renderApp } = vite
      ? await vite.ssrLoadModule('/src/entry-server.js')
      : await import('./src/entry-server.js');

    // 4. 渲染应用（返回 html 和 state）
    const { html: appHtml, state } = await renderApp();

    // 5. 注入序列化状态脚本
    const stateScript = `<script type="application/json" id="__RESUMABLE_STATE__">${state}</script>`;

    // 6. 替换占位符
    const html = template.replace('<!--ssr-outlet-->', appHtml + stateScript);

    // 7. 返回 HTML
    return c.html(html);
  } catch (e) {
    console.error('[SSR] 渲染错误:', e);
    return c.text(e.message, 500);
  }
});

export default app;

