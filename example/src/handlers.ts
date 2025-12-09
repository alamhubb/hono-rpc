import { deserialize, serialize } from './serializer';
import type { Signal } from 'alien-signals';

/**
 * 事件处理器上下文
 */
export interface HandlerContext {
  event?: Event;
  element?: HTMLElement;
  offset?: number;
  limit?: number;
  getOrCreateSignal: (name: string, value: unknown) => Promise<Signal<unknown>>;
  setupSignalBindings: (name: string, sig: Signal<unknown>, formatter?: (v: unknown) => string) => Promise<void>;
  lazySignals: Map<string, Signal<unknown>>;
}

/**
 * 点赞用户
 */
export async function likeUser(context: HandlerContext): Promise<void> {
  const { element, getOrCreateSignal, setupSignalBindings, lazySignals } = context;
  if (!element) return;

  const userId = element.dataset.userId;
  const nickname = element.dataset.nickname;
  const signalName = `like_${userId}`;

  console.log(`[Handler] 点赞用户: ${nickname} (ID: ${userId})`);

  // 调用后端接口
  try {
    const response = await fetch('/api/like', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, nickname })
    });
    const result = await response.json();
    console.log(`[Handler] 后端响应:`, result);
  } catch (error) {
    console.error(`[Handler] 调用接口失败:`, error);
  }

  // 查找或创建 signal
  let likeSignal = lazySignals.get(signalName) as Signal<number> | undefined;

  if (!likeSignal) {
    // 第一次点击，懒创建 signal
    const likeEl = element.querySelector(`[data-like_${userId}]`) as HTMLElement | null;

    let initialValue = 0;
    if (likeEl) {
      const attr = Object.keys(likeEl.dataset).find(k => k.startsWith('like_'));
      if (attr) {
        initialValue = deserialize(likeEl.dataset[attr] || '0') as number;
      }
    }

    console.log(`[Handler] 懒创建 signal: ${signalName} = ${initialValue}`);
    likeSignal = await getOrCreateSignal(signalName, initialValue) as Signal<number>;

    await setupSignalBindings(signalName, likeSignal as Signal<unknown>, (v) => `${v}`);
  }

  // 更新点赞数
  const newValue = (likeSignal() as number) + 1;
  likeSignal(newValue);
  console.log(`[Handler] 点赞数更新: ${nickname} → ${newValue}`);
}

/**
 * 加载更多用户
 */
export async function loadMoreUsers(context: HandlerContext): Promise<void> {
  const { offset = 0, limit = 10, getOrCreateSignal, setupSignalBindings } = context;

  console.log(`[Handler] 加载更多用户: offset=${offset}, limit=${limit}`);

  try {
    const response = await fetch(`/api/users?offset=${offset}&limit=${limit}`);
    const result = await response.json();

    if (!result.success || !result.users || result.users.length === 0) {
      console.log('[Handler] 没有更多数据了');
      return;
    }

    console.log(`[Handler] 获取到 ${result.users.length} 条新数据`);

    const container = document.querySelector('.user-list');
    if (!container) {
      console.error('[Handler] 找不到用户列表容器');
      return;
    }

    for (const user of result.users) {
      const userCard = createUserCardHTML(user);
      container.insertAdjacentHTML('beforeend', userCard);

      const signalName = `like_${user.id}`;
      const likeSignal = await getOrCreateSignal(signalName, 0);
      await setupSignalBindings(signalName, likeSignal, (v) => `${v}`);
    }

    console.log(`[Handler] 已追加 ${result.users.length} 个用户卡片`);

  } catch (error) {
    console.error('[Handler] 加载更多失败:', error);
  }
}

/**
 * 创建用户卡片 HTML
 */
function createUserCardHTML(user: { id: number; nickname?: string; avatar?: string; age?: number; gender?: string; city?: string }): string {
  const genderEmoji = user.gender === 'girl' ? '👩' : '👨';

  return `
    <div class="user-card" style="display:flex;align-items:center;padding:12px;margin:8px 0;background:#f5f5f5;border-radius:8px;">
      <img src="${user.avatar || 'https://via.placeholder.com/50'}" alt="${user.nickname}" style="width:50px;height:50px;border-radius:50%;margin-right:12px;object-fit:cover;">
      <div style="flex:1;">
        <div style="font-weight:bold;font-size:16px;">${user.nickname || '未知用户'}</div>
        <div style="color:#666;font-size:14px;margin-top:4px;">
          <span>${genderEmoji}</span> ${user.age || '?'}岁 · <span>${user.city || '未知'}</span>
        </div>
      </div>
      <button type="button" data-user-id="${user.id}" data-nickname="${user.nickname}" data-onclick="likeUser" style="display:flex;align-items:center;gap:4px;padding:8px 12px;border:none;background:#fff;border-radius:20px;cursor:pointer;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
        <span style="font-size:18px;">👍</span>
        <span><span data-like_${user.id}="n:0">0</span></span>
      </button>
    </div>
  `;
}

