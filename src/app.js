import { signal } from 'alien-signals';

/**
 * 创建应用 - 客户端版本
 */
export function createApp({ div, button }) {
  const count = signal(0);

  return div({
    children: [
      div({
        class: 'card',
        children: [
          button({
            type: 'button',
            children: [() => `count is ${count()}`],
            onclick: () => count(count() + 1)
          })
        ]
      })
    ]
  });
}

