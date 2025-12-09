/**
 * 创建应用 - 纯客户端渲染 (CSR) 模式
 */

/** 元素属性接口 */
export interface ElementProps {
  class?: string;
  style?: string;
  id?: string;
  children?: (string | number | Node)[];
  onclick?: () => void;
  [key: string]: unknown;
}

/** 元素创建函数类型 */
export type ElementCreator = (props: ElementProps) => HTMLElement;

/** 组件工厂接口 */
export interface ComponentFactory {
  div: ElementCreator;
  button: ElementCreator;
  span: ElementCreator;
  img: ElementCreator;
}

/** 用户数据接口 */
export interface UserData {
  id: number;
  nickname: string | null;
  avatar: string | null;
  age: number | null;
  gender: string | null;
  city: string | null;
}

/**
 * 创建用户卡片组件
 */
function UserCard(factory: ComponentFactory, user: UserData): HTMLElement {
  const { div, img, span, button } = factory;
  
  // 点赞处理器标记
  const handleLike = (): void => {};
  (handleLike as any)._handlerName = 'likeUser';

  return div({
    class: 'user-card',
    style: 'display:flex;align-items:center;padding:12px;margin:8px 0;background:#f5f5f5;border-radius:8px;',
    children: [
      // 头像
      img({
        src: user.avatar || 'https://via.placeholder.com/50',
        alt: user.nickname || '',
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
      // 点赞按钮
      button({
        type: 'button',
        'data-user-id': user.id,
        'data-nickname': user.nickname || '',
        'data-onclick': 'likeUser',
        style: 'display:flex;align-items:center;gap:4px;padding:8px 12px;border:none;background:#fff;border-radius:20px;cursor:pointer;box-shadow:0 1px 3px rgba(0,0,0,0.1);',
        children: [
          span({ style: 'font-size:18px;', children: ['👍'] }),
          span({ 
            [`data-like_${user.id}`]: 'n:0',
            children: ['0'] 
          })
        ]
      })
    ]
  });
}

/**
 * 创建应用
 */
export function createApp(factory: ComponentFactory, data: { users?: UserData[] } = {}): HTMLElement {
  const { div, span } = factory;
  const { users = [] } = data;

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
            children: [
              '数据来自 MySQL 数据库 (Drizzle ORM) - ',
              span({ children: [`${users.length} 位用户`] }),
              ' · 点击 👍 点赞'
            ]
          })
        ]
      }),

      // 用户列表
      div({
        class: 'user-list',
        style: 'padding:0 20px;',
        children: users.length > 0
          ? users.map(user => UserCard(factory, user))
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

