import { createServer } from 'vite';
import { createServer as createHttpServer } from 'http';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const PORT = 5173;

async function startServer() {
  // 创建 Vite 开发服务器（中间件模式）
  const vite = await createServer({
    server: { middlewareMode: true },
    appType: 'custom'
  });

  // 创建 HTTP 服务器
  const server = createHttpServer(async (req, res) => {
    const url = req.url;

    try {
      // 让 Vite 处理静态资源、HMR 等
      // 使用 Promise 包装 connect 中间件
      const handled = await new Promise((resolve) => {
        vite.middlewares(req, res, () => {
          // Vite 没处理这个请求，交给我们的 SSR 逻辑
          resolve(false);
        });
        // 如果 Vite 处理了（发送了响应），这个 Promise 不会 resolve
        // 但我们可以检查 res.writableEnded
        setTimeout(() => {
          if (res.writableEnded) resolve(true);
        }, 0);
      });

      if (handled) return;

      // API 接口：获取用户列表（分页）- 返回 SSR 渲染的 HTML
      if (url.startsWith('/api/users') && req.method === 'GET') {
        try {
          const urlObj = new URL(url, `http://${req.headers.host}`);
          const offset = parseInt(urlObj.searchParams.get('offset')) || 0;
          const limit = parseInt(urlObj.searchParams.get('limit')) || 10;

          console.log(`[API] 📋 获取用户列表: offset=${offset}, limit=${limit}`);

          // 从数据库查询
          const { getUsers } = await vite.ssrLoadModule('/src/db/queries.js');
          const users = await getUsers(limit, offset);

          // 🔑 使用 SSR 渲染用户卡片
          const { renderUserCards } = await vite.ssrLoadModule('/src/entry-server.js');
          const html = renderUserCards(users);

          console.log(`[API] 返回 ${users.length} 条 SSR 渲染的用户卡片`);

          res.writeHead(200, {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          });
          res.end(JSON.stringify({
            success: true,
            html,  // 🔑 返回 SSR 渲染的 HTML
            count: users.length,
            offset,
            limit
          }));
        } catch (e) {
          console.error('[API] 查询失败:', e);
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, message: e.message }));
        }
        return;
      }

      // API 接口：点赞
      if (url === '/api/like' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', () => {
          try {
            const data = JSON.parse(body);
            const { userId, nickname } = data;

            // 🔑 只输出日志，不存储
            console.log(`[API] 👍 收到点赞请求: userId=${userId}, nickname=${nickname}, time=${new Date().toISOString()}`);

            res.writeHead(200, {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*'
            });
            res.end(JSON.stringify({ success: true, message: '点赞成功（仅日志）' }));
          } catch (e) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: false, message: e.message }));
          }
        });
        return;
      }

      // SSR 逻辑：只处理 HTML 页面请求
      if (url === '/' || url === '/index.html') {
        // 1. 读取 index.html 模板
        let template = readFileSync(resolve('index.html'), 'utf-8');

        // 2. 让 Vite 处理 HTML（注入 HMR 客户端等）
        template = await vite.transformIndexHtml(url, template);

        // 3. 加载服务端入口模块
        const { renderApp } = await vite.ssrLoadModule('/src/entry-server.js');

        // 4. 渲染应用（返回 html 和 state）- 现在是异步的
        const { html: appHtml, state } = await renderApp();

        // 5. 注入序列化状态脚本
        const stateScript = `<script type="application/json" id="__RESUMABLE_STATE__">${state}</script>`;

        // 6. 替换占位符
        const html = template.replace('<!--ssr-outlet-->', appHtml + stateScript);

        // 6. 返回 HTML
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(html);
      }
    } catch (e) {
      // 让 Vite 处理错误（显示错误覆盖层）
      vite.ssrFixStacktrace(e);
      console.error(e);
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      res.end(e.message);
    }
  });

  server.listen(PORT, () => {
    console.log(`SSR 服务器运行在: http://localhost:${PORT}`);
  });
}

startServer();

