import { divSSR, buttonSSR, spanSSR, imgSSR, initSSRContext, getSSRContext } from './solid-runtime.js'
import { createApp } from './app.js'
import { getUsers } from './db/queries.js'

/**
 * 服务端渲染入口 - Resumable SSR + 数据库
 *
 * 🔑 核心思想：
 * - 服务端从数据库读取数据
 * - 数据序列化存储在 DOM 中
 * - 客户端可以直接使用或懒恢复响应式
 */
export async function renderApp() {
  // 初始化 SSR 上下文
  initSSRContext();

  // 🔑 从数据库读取用户数据
  let users = [];
  try {
    users = await getUsers(10);
    console.log(`[SSR] 从数据库获取了 ${users.length} 条用户数据`);
  } catch (error) {
    console.error('[SSR] 数据库查询失败:', error.message);
  }

  // 使用 SSR 版本的组件渲染 HTML，传入用户数据
  const html = createApp({
    div: divSSR,
    button: buttonSSR,
    span: spanSSR,
    img: imgSSR,
  }, { users });

  // 获取 SSR 上下文中的处理器信息
  const context = getSSRContext();

  const state = JSON.stringify({
    handlers: Object.keys(context.handlers)
  });

  return { html, state };
}

