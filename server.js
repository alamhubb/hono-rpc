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

      // SSR 逻辑：只处理 HTML 页面请求
      if (url === '/' || url === '/index.html') {
        // 1. 读取 index.html 模板
        let template = readFileSync(resolve('index.html'), 'utf-8');

        // 2. 让 Vite 处理 HTML（注入 HMR 客户端等）
        template = await vite.transformIndexHtml(url, template);

        // 3. 加载服务端入口模块
        const { renderApp } = await vite.ssrLoadModule('/src/entry-server.js');

        // 4. 渲染应用
        const appHtml = renderApp();

        // 5. 替换占位符
        const html = template.replace('<!--ssr-outlet-->', appHtml);

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

