import { effect } from 'alien-signals';
import { serialize } from './serializer.js';

// ============== 客户端渲染 ==============

/**
 * 设置元素属性
 */
function setAttribute(el, key, value) {
  if (key === 'class') {
    el.className = value ?? '';
  } else if (key === 'style') {
    el.style.cssText = value ?? '';
  } else {
    if (value == null) {
      el.removeAttribute(key);
    } else {
      el.setAttribute(key, value);
    }
  }
}

/**
 * 处理子元素
 */
function handleChildren(parent, children) {
  const list = Array.isArray(children) ? children : [children];

  for (const child of list) {
    if (typeof child === 'function') {
      // 动态内容：用 effect 追踪依赖
      const textNode = document.createTextNode('');
      effect(() => {
        textNode.textContent = child();
      });
      parent.appendChild(textNode);
    } else if (child instanceof Node) {
      // 已经是 DOM 节点
      parent.appendChild(child);
    } else if (child != null) {
      // 静态文本/数字
      parent.appendChild(document.createTextNode(String(child)));
    }
  }
}

/**
 * 创建元素 - 核心函数（客户端）
 */
export function createElement(tag, props = {}) {
  const el = document.createElement(tag);

  for (const key in props) {
    if (key === 'children') {
      handleChildren(el, props.children);
    } else if (key.startsWith('on')) {
      // 事件处理：onclick -> click
      const eventName = key.slice(2).toLowerCase();
      el.addEventListener(eventName, props[key]);
    } else {
      // 属性处理
      const value = props[key];
      if (typeof value === 'function') {
        // 响应式属性：用 effect 追踪
        effect(() => {
          setAttribute(el, key, value());
        });
      } else {
        // 静态属性
        setAttribute(el, key, value);
      }
    }
  }

  return el;
}

/**
 * 创建 div 元素（客户端）
 */
export function div(props) {
  return createElement('div', props);
}

/**
 * 创建 button 元素（客户端）
 */
export function button(props) {
  return createElement('button', props);
}

/**
 * 创建 span 元素（客户端）
 */
export function span(props) {
  return createElement('span', props);
}

/**
 * 渲染到容器（客户端 - 传统方式）
 */
export function render(element, container) {
  container.innerHTML = '';
  container.appendChild(element);
}

// ============== Resumable + 响应式 客户端运行时 ==============
// 核心思想：
// 1. 页面加载后什么都不做（零 JS 执行）
// 2. 用户交互时懒创建 signal 和 effect
// 3. 之后走响应式系统自动更新

/**
 * 🔑 懒 Signal 存储
 * 只在第一次交互时创建，之后复用
 */
const lazySignals = new Map();

/**
 * 获取或创建懒 Signal
 * @param {string} signalName - signal 名称
 * @param {any} initialValue - 初始值（从 DOM 读取）
 */
export async function getOrCreateSignal(signalName, initialValue) {
  if (lazySignals.has(signalName)) {
    console.log(`[Resumable] 复用已有 signal: ${signalName}`);
    return lazySignals.get(signalName);
  }

  // 🔑 懒加载 alien-signals
  const { signal } = await import('alien-signals');

  // 创建新 signal
  const sig = signal(initialValue);
  lazySignals.set(signalName, sig);

  console.log(`[Resumable] 懒创建 signal: ${signalName} = ${initialValue}`);
  return sig;
}

/**
 * 为 signal 建立响应式绑定
 * 找到所有 data-{signalName} 的 DOM 元素，建立 effect
 */
export async function setupSignalBindings(signalName, sig, formatter) {
  const { effect } = await import('alien-signals');
  const { serialize } = await import('./serializer.js');

  // 🔑 将 signal 名称转换为 dataset 属性名（下划线需要保留）
  // 例如：like_1 → like_1
  // 注意：data-like_1 在 dataset 中会变成 like_1
  const datasetKey = signalName;

  // 查找所有带有该 data 属性的元素
  // CSS 选择器中需要转义特殊字符，或者遍历查找
  const allElements = document.querySelectorAll('*');
  const elements = Array.from(allElements).filter(el => {
    return el.dataset && el.dataset[datasetKey] !== undefined;
  });

  if (elements.length === 0) {
    console.log(`[Resumable] 未找到 data-${signalName} 的元素`);
    return;
  }

  console.log(`[Resumable] 为 ${signalName} 建立 ${elements.length} 个响应式绑定`);

  // 为每个元素建立 effect
  elements.forEach(el => {
    effect(() => {
      const value = sig();
      // 更新文本内容
      el.textContent = formatter ? formatter(value) : value;
      // 🔑 同时更新 data 属性（使用序列化保持类型信息）
      el.dataset[datasetKey] = serialize(value);
    });
  });
}

/**
 * 初始化 Resumable 运行时
 *
 * 🔑 关键：只做一件事 - 设置事件委托
 * 不创建 signal，不建立 effect，不遍历 DOM
 */
export function initResumable() {
  setupEventDelegation();
  console.log('[Resumable] 初始化完成 - 零 JS 执行，等待用户交互...');
}

/**
 * 设置事件委托
 */
function setupEventDelegation() {
  const root = document.body;
  root.addEventListener('click', handleEvent('click'));
}

// 滚动加载状态
let isLoading = false;
let currentOffset = 10;  // 初始已加载 10 条
const PAGE_SIZE = 10;

/**
 * 设置滚动监听 - 滚动到底部时加载更多
 */
export function setupScrollListener() {
  window.addEventListener('scroll', async () => {
    // 检查是否滚动到底部附近（距离底部 100px 内）
    const scrollTop = document.documentElement.scrollTop || document.body.scrollTop;
    const scrollHeight = document.documentElement.scrollHeight;
    const clientHeight = document.documentElement.clientHeight;

    if (scrollTop + clientHeight >= scrollHeight - 100) {
      if (isLoading) return;  // 防止重复加载

      isLoading = true;
      console.log(`[Scroll] 滚动到底部，加载更多: offset=${currentOffset}`);

      try {
        // 调用 loadMore handler
        const handlers = await import('./handlers.js');
        await handlers.loadMoreUsers({
          offset: currentOffset,
          limit: PAGE_SIZE,
          getOrCreateSignal,
          setupSignalBindings,
          lazySignals
        });

        currentOffset += PAGE_SIZE;
      } catch (error) {
        console.error('[Scroll] 加载失败:', error);
      } finally {
        isLoading = false;
      }
    }
  });

  console.log('[Scroll] 滚动监听已设置');
}

/**
 * 创建事件处理器
 */
function handleEvent(eventType) {
  return async (e) => {
    let target = e.target;
    const root = document.body;
    const dataAttr = `data-on${eventType}`;

    while (target && target !== root) {
      const handlerName = target.getAttribute(dataAttr);

      if (handlerName) {
        console.log(`[Resumable] 用户点击 → 懒加载 handler: ${handlerName}`);

        const handlers = await import('./handlers.js');
        const handler = handlers[handlerName];

        if (handler) {
          // 传入 context，包含懒 signal 工具函数
          handler({
            event: e,
            element: target,
            getOrCreateSignal,
            setupSignalBindings,
            lazySignals
          });
        } else {
          console.error(`[Resumable] Handler not found: ${handlerName}`);
        }

        break;
      }

      target = target.parentElement;
    }
  };
}

// ============== 服务端渲染 (SSR) - Resumable ==============

// 全局状态收集器
let ssrContext = null;

/**
 * 初始化 SSR 上下文
 */
export function initSSRContext() {
  ssrContext = {
    signals: {}, // 存储 signal 的值
    handlers: {}, // 存储事件处理器映射
    signalCounter: 0
  };
  return ssrContext;
}

/**
 * 获取当前 SSR 上下文
 */
export function getSSRContext() {
  return ssrContext;
}

/**
 * 注册 signal 到 SSR 上下文
 */
function registerSignal(signalFn) {
  if (!ssrContext) return null;

  const signalId = `s${ssrContext.signalCounter++}`;
  const value = signalFn();
  ssrContext.signals[signalId] = value;

  return signalId;
}

/**
 * 注册事件处理器到 SSR 上下文
 */
function registerHandler(handlerName) {
  if (!ssrContext) return null;

  ssrContext.handlers[handlerName] = true;
  return handlerName;
}

/**
 * HTML 转义，防止 XSS
 */
function escapeHtml(str) {
  if (typeof str !== 'string') return String(str);
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * 渲染子元素为字符串
 */
function renderChildrenToString(children) {
  if (children == null) return '';

  const list = Array.isArray(children) ? children : [children];
  let html = '';

  for (const child of list) {
    if (typeof child === 'function') {
      // 动态内容：执行一次获取显示值
      const displayValue = child();

      // 🔑 检查是否有 signal 元数据
      const signalMeta = child._signalMeta;

      if (signalMeta) {
        // 🔑 使用序列化后的值存储状态
        // 例如：<span data-count="n:0">count is 0</span>
        // n: 表示 number 类型
        const serializedValue = escapeHtml(signalMeta.serialized);
        html += `<span data-${signalMeta.name}="${serializedValue}">${escapeHtml(displayValue)}</span>`;
      } else {
        html += `<span>${escapeHtml(displayValue)}</span>`;
      }
    } else if (typeof child === 'string') {
      if (child.startsWith('<')) {
        html += child;
      } else {
        html += escapeHtml(child);
      }
    } else if (typeof child === 'number') {
      html += String(child);
    }
  }

  return html;
}

/**
 * 创建元素为 HTML 字符串（服务端 - Resumable）
 */
export function createElementSSR(tag, props = {}) {
  let html = `<${tag}`;
  let hasHandler = false;
  let handlerName = null;

  // 处理属性
  for (const key in props) {
    if (key === 'children') continue;

    if (key.startsWith('on')) {
      // 记录事件处理器
      const eventType = key.slice(2).toLowerCase(); // onclick -> click
      handlerName = props[key]?._handlerName; // 从处理器函数获取名称

      if (handlerName) {
        registerHandler(handlerName);
        html += ` data-on${eventType}="${handlerName}"`;
        hasHandler = true;
      }
      continue;
    }

    const value = props[key];
    const attrValue = typeof value === 'function' ? value() : value;

    if (attrValue != null) {
      html += ` ${key}="${escapeHtml(attrValue)}"`;
    }
  }

  html += '>';
  html += renderChildrenToString(props.children);
  html += `</${tag}>`;

  return html;
}

/**
 * 创建 div 元素（服务端）
 */
export function divSSR(props) {
  return createElementSSR('div', props);
}

/**
 * 创建 button 元素（服务端）
 */
export function buttonSSR(props) {
  return createElementSSR('button', props);
}

/**
 * 创建 span 元素（服务端）
 */
export function spanSSR(props) {
  return createElementSSR('span', props);
}

/**
 * 创建 img 元素（服务端）
 */
export function imgSSR(props) {
  return createElementSSR('img', props);
}

