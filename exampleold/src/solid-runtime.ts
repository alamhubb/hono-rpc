import { effect, Signal } from 'alien-signals';
import { serialize } from './serializer';

// ============== 类型定义 ==============

export interface ElementProps {
  class?: string;
  style?: string;
  id?: string;
  children?: (string | number | Node | (() => string))[];
  onclick?: EventListener;
  [key: string]: unknown;
}

// ============== 客户端渲染 ==============

/**
 * 设置元素属性
 */
function setAttribute(el: HTMLElement, key: string, value: string | null | undefined): void {
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
function handleChildren(parent: HTMLElement, children: ElementProps['children']): void {
  const list = Array.isArray(children) ? children : [children];

  for (const child of list) {
    if (typeof child === 'function') {
      const textNode = document.createTextNode('');
      effect(() => {
        textNode.textContent = (child as () => string)();
      });
      parent.appendChild(textNode);
    } else if (child instanceof Node) {
      parent.appendChild(child);
    } else if (child != null) {
      parent.appendChild(document.createTextNode(String(child)));
    }
  }
}

/**
 * 创建元素 - 核心函数（客户端）
 */
export function createElement(tag: string, props: ElementProps = {}): HTMLElement {
  const el = document.createElement(tag);

  for (const key in props) {
    if (key === 'children') {
      handleChildren(el, props.children);
    } else if (key.startsWith('on')) {
      const eventName = key.slice(2).toLowerCase();
      el.addEventListener(eventName, props[key] as EventListener);
    } else {
      const value = props[key];
      if (typeof value === 'function') {
        effect(() => {
          setAttribute(el, key, (value as () => string)());
        });
      } else {
        setAttribute(el, key, value as string);
      }
    }
  }

  return el;
}

/** 创建 div 元素 */
export function div(props: ElementProps): HTMLElement {
  return createElement('div', props);
}

/** 创建 button 元素 */
export function button(props: ElementProps): HTMLElement {
  return createElement('button', props);
}

/** 创建 span 元素 */
export function span(props: ElementProps): HTMLElement {
  return createElement('span', props);
}

/** 渲染到容器 */
export function render(element: HTMLElement, container: HTMLElement): void {
  container.innerHTML = '';
  container.appendChild(element);
}

// ============== 响应式运行时 ==============

/** 懒 Signal 存储 */
const lazySignals = new Map<string, Signal<unknown>>();

/** 获取或创建懒 Signal */
export async function getOrCreateSignal<T>(signalName: string, initialValue: T): Promise<Signal<T>> {
  if (lazySignals.has(signalName)) {
    console.log(`[Runtime] 复用已有 signal: ${signalName}`);
    return lazySignals.get(signalName) as Signal<T>;
  }

  const { signal } = await import('alien-signals');
  const sig = signal(initialValue);
  lazySignals.set(signalName, sig as Signal<unknown>);

  console.log(`[Runtime] 懒创建 signal: ${signalName} = ${initialValue}`);
  return sig;
}

/** 为 signal 建立响应式绑定 */
export async function setupSignalBindings<T>(
  signalName: string, 
  sig: Signal<T>, 
  formatter?: (v: T) => string
): Promise<void> {
  const { effect } = await import('alien-signals');

  const allElements = document.querySelectorAll('*');
  const elements = Array.from(allElements).filter(el => {
    return (el as HTMLElement).dataset && (el as HTMLElement).dataset[signalName] !== undefined;
  }) as HTMLElement[];

  if (elements.length === 0) {
    console.log(`[Runtime] 未找到 data-${signalName} 的元素`);
    return;
  }

  console.log(`[Runtime] 为 ${signalName} 建立 ${elements.length} 个响应式绑定`);

  elements.forEach(el => {
    effect(() => {
      const value = sig();
      el.textContent = formatter ? formatter(value) : String(value);
      el.dataset[signalName] = serialize(value);
    });
  });
}

/** 设置事件委托 */
export function setupEventDelegation(): void {
  const root = document.body;
  root.addEventListener('click', handleEvent('click'));
  console.log('[CSR] 事件委托已设置');
}

// 滚动加载状态
let isLoading = false;
let currentOffset = 10;
const PAGE_SIZE = 10;

/** 设置滚动监听 */
export function setupScrollListener(): void {
  window.addEventListener('scroll', async () => {
    const scrollTop = document.documentElement.scrollTop || document.body.scrollTop;
    const scrollHeight = document.documentElement.scrollHeight;
    const clientHeight = document.documentElement.clientHeight;

    if (scrollTop + clientHeight >= scrollHeight - 100) {
      if (isLoading) return;

      isLoading = true;
      console.log(`[Scroll] 滚动到底部，加载更多: offset=${currentOffset}`);

      try {
        const handlers = await import('./handlers');
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

/** 创建事件处理器 */
function handleEvent(eventType: string): (e: Event) => Promise<void> {
  return async (e: Event) => {
    let target = e.target as HTMLElement | null;
    const root = document.body;
    const dataAttr = `data-on${eventType}`;

    while (target && target !== root) {
      const handlerName = target.getAttribute(dataAttr);

      if (handlerName) {
        console.log(`[Runtime] 用户点击 → 懒加载 handler: ${handlerName}`);

        const handlers = await import('./handlers');
        const handler = (handlers as Record<string, Function>)[handlerName];

        if (handler) {
          handler({
            event: e,
            element: target,
            getOrCreateSignal,
            setupSignalBindings,
            lazySignals
          });
        } else {
          console.error(`[Runtime] Handler not found: ${handlerName}`);
        }

        break;
      }

      target = target.parentElement;
    }
  };
}

