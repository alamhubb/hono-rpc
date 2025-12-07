import { divSSR, buttonSSR } from './solid-runtime.js'
import { createApp } from './app.js'

/**
 * 服务端渲染入口
 * 返回 HTML 字符串
 */
export function renderApp() {
  // 使用 SSR 版本的组件
  const html = createApp({ 
    div: divSSR, 
    button: buttonSSR 
  });
  
  return html;
}

