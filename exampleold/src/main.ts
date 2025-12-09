import './style.css';
import { div, button, span, createElement, render, setupScrollListener, setupEventDelegation } from './solid-runtime';
import { createApp, type UserData } from './app';

/**
 * 客户端渲染入口 (CSR 模式)
 * 
 * 流程：
 * 1. 页面加载时调用 API 获取数据
 * 2. 使用客户端渲染函数渲染 UI
 * 3. 设置事件委托和滚动监听
 */
async function initApp(): Promise<void> {
  console.log('[CSR] 开始初始化应用...');
  
  const container = document.getElementById('app');
  if (!container) {
    console.error('[CSR] 找不到 #app 容器');
    return;
  }
  
  try {
    // 1. 调用 API 获取用户数据
    console.log('[CSR] 获取用户数据...');
    const response = await fetch('/api/users?offset=0&limit=10');
    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.message || '获取数据失败');
    }
    
    console.log(`[CSR] 获取到 ${result.users.length} 条用户数据`);
    
    // 2. 使用客户端渲染函数创建 UI
    const factory = {
      div,
      button,
      span,
      img: (props: Record<string, unknown>) => createElement('img', props)
    };
    
    const app = createApp(factory, { users: result.users as UserData[] });
    
    // 3. 渲染到容器
    render(app, container);
    
    // 4. 设置事件委托
    setupEventDelegation();
    
    // 5. 设置滚动监听（加载更多）
    setupScrollListener();
    
    console.log('[CSR] 应用初始化完成');
    
  } catch (error) {
    console.error('[CSR] 初始化失败:', error);
    container.innerHTML = `
      <div style="text-align:center;padding:40px;color:#c62828;">
        ❌ 加载失败: ${error instanceof Error ? error.message : String(error)}
      </div>
    `;
  }
}

// 启动应用
initApp();

