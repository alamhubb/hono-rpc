import { serialize } from './serializer.js';

/**
 * 创建应用 - Resumable + 响应式 SSR + 数据库
 */

/**
 * 创建带 signal 绑定的动态内容
 */
export function bindSignal(signalName, value, formatter = (v) => v) {
  const fn = () => formatter(value);
  fn._signalMeta = {
    name: signalName,
    value,
    serialized: serialize(value)
  };
  return fn;
}

/**
 * 创建用户卡片组件
 */
function UserCard({ div, img, span, button }, user) {
  // 🔑 点赞事件处理器
  const handleLike = () => {};
  handleLike._handlerName = 'likeUser';

  // 🔑 绑定点赞数（初始为 0）
  const likeCount = bindSignal(`like_${user.id}`, 0, (v) => `${v}`);

  return div({
    class: 'user-card',
    style: 'display:flex;align-items:center;padding:12px;margin:8px 0;background:#f5f5f5;border-radius:8px;',
    children: [
      // 头像
      img({
        src: user.avatar || 'https://via.placeholder.com/50',
        alt: user.nickname,
        style: 'width:50px;height:50px;border-radius:50%;margin-right:12px;object-fit:cover;'
      }),
      // 用户信息
      div({
        style: 'flex:1;',
        children: [
          div({
            style: 'font-weight:bold;font-size:16px;',
            children: [user.nickname || '未知用户']
          }),
          div({
            style: 'color:#666;font-size:14px;margin-top:4px;',
            children: [
              span({ children: [user.gender === 'girl' ? '👩' : '👨'] }),
              ` ${user.age || '?'}岁 · `,
              span({ children: [user.city || '未知'] })
            ]
          })
        ]
      }),
      // 🔑 点赞按钮
      button({
        type: 'button',
        'data-user-id': user.id,
        'data-nickname': user.nickname,
        onclick: handleLike,
        style: 'display:flex;align-items:center;gap:4px;padding:8px 12px;border:none;background:#fff;border-radius:20px;cursor:pointer;box-shadow:0 1px 3px rgba(0,0,0,0.1);',
        children: [
          span({ style: 'font-size:18px;', children: ['👍'] }),
          span({ children: [likeCount] })
        ]
      })
    ]
  });
}

/**
 * 创建应用
 */
export function createApp({ div, button, span, img }, data = {}) {
  const { users = [] } = data;

  // 绑定用户列表数据
  const usersDisplay = bindSignal('users', users, (v) => `${v.length} 位用户`);

  return div({
    children: [
      // 标题
      div({
        style: 'padding:20px;',
        children: [
          div({
            style: 'font-size:24px;font-weight:bold;margin-bottom:8px;',
            children: ['📊 用户列表']
          }),
          div({
            style: 'color:#666;margin-bottom:16px;',
            children: ['数据来自 MySQL 数据库 (Drizzle ORM) - ', span({ children: [usersDisplay] }), ' · 点击 👍 点赞']
          })
        ]
      }),

      // 用户列表
      div({
        class: 'user-list',  // 🔑 添加 class 便于查找
        style: 'padding:0 20px;',
        children: users.length > 0
          ? users.map(user => UserCard({ div, img, span, button }, user))
          : [div({
              style: 'text-align:center;padding:40px;color:#999;',
              children: ['暂无用户数据']
            })]
      }),

      // 加载提示
      div({
        id: 'load-more-indicator',
        style: 'text-align:center;padding:20px;color:#999;',
        children: ['⬇️ 滚动加载更多']
      })
    ]
  });
}

