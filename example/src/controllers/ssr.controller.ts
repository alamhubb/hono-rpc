import 'reflect-metadata';
import { Controller, Get, Ctx } from '../../../hono-decorator/src/index';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import type { Context } from 'hono';

/**
 * SSR 控制器
 * 处理服务端渲染
 */
@Controller('')
export class SsrController {
  /**
   * SSR 路由：渲染首页
   * GET /
   */
  @Get('/')
  async renderIndex(@Ctx() c: Context) {
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
        : await import('../entry-server.js');

      // 4. 渲染应用（返回 html 和 state）
      const { html: appHtml, state } = await renderApp();

      // 5. 注入序列化状态脚本
      const stateScript = `<script type="application/json" id="__RESUMABLE_STATE__">${state}</script>`;

      // 6. 替换占位符
      const html = template.replace('<!--ssr-outlet-->', appHtml + stateScript);

      // 7. 返回 HTML（使用 c.html 而不是 return，因为需要返回 Response 对象）
      return c.html(html);
    } catch (e) {
      console.error('[SSR] 渲染错误:', e);
      return c.text(e.message, 500);
    }
  }
}

