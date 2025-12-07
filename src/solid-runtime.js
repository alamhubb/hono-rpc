import { effect } from 'alien-signals';

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
 * 创建元素 - 核心函数
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
 * 创建 div 元素
 */
export function div(props) {
  return createElement('div', props);
}

/**
 * 创建 button 元素
 */
export function button(props) {
  return createElement('button', props);
}

/**
 * 创建 span 元素
 */
export function span(props) {
  return createElement('span', props);
}

/**
 * 渲染到容器
 */
export function render(element, container) {
  container.innerHTML = '';
  container.appendChild(element);
}

