import { deserialize, serialize } from './serializer.js';

/**
 * 事件处理器模块 - Resumable + 响应式
 *
 * 🔑 核心思想：
 * 1. 第一次交互：从 data-{name} 读取序列化状态 → deserialize → 懒创建 signal
 * 2. 之后的交互：直接更新 signal，effect 自动更新所有绑定的 DOM
 */

/**
 * 点赞用户
 */
export async function likeUser(context) {
  const { element, getOrCreateSignal, setupSignalBindings, lazySignals } = context;

  // 获取用户信息
  const userId = element.dataset.userId;
  const nickname = element.dataset.nickname;
  const signalName = `like_${userId}`;

  console.log(`[Handler] 点赞用户: ${nickname} (ID: ${userId})`);

  // 🔑 调用后端接口
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

  // 🔑 查找或创建 signal
  let likeSignal = lazySignals.get(signalName);

  if (!likeSignal) {
    // 第一次点击，懒创建 signal
    const likeEl = element.querySelector(`[data-like_${userId}]`) ||
                   element.querySelector(`[data-like_${userId.toLowerCase()}]`);

    // 从 data 属性读取初始值
    let initialValue = 0;
    if (likeEl) {
      const attr = Object.keys(likeEl.dataset).find(k => k.startsWith('like_'));
      if (attr) {
        initialValue = deserialize(likeEl.dataset[attr]);
      }
    }

    console.log(`[Handler] 懒创建 signal: ${signalName} = ${initialValue}`);
    likeSignal = await getOrCreateSignal(signalName, initialValue);

    // 建立响应式绑定
    await setupSignalBindings(signalName, likeSignal, (v) => `${v}`);
  }

  // 🔑 更新点赞数
  const newValue = likeSignal() + 1;
  likeSignal(newValue);
  console.log(`[Handler] 点赞数更新: ${nickname} → ${newValue}`);
}

/**
 * 增加计数器（保留原有功能）
 */
export async function incrementCount(context) {
  const { element, getOrCreateSignal, setupSignalBindings, lazySignals } = context;

  let countSignal = lazySignals.get('count');

  if (!countSignal) {
    console.log('[Handler] 第一次点击 → 初始化响应式系统');

    const countEl = element.querySelector('[data-count]') || element;
    const serializedValue = countEl.dataset.count;
    const initialValue = deserialize(serializedValue);

    console.log(`[Handler] 从 data-count 读取: "${serializedValue}" → ${initialValue}`);

    countSignal = await getOrCreateSignal('count', initialValue);
    await setupSignalBindings('count', countSignal, (v) => `count is ${v}`);
  }

  const newValue = countSignal() + 1;
  countSignal(newValue);
  console.log(`[Handler] signal 更新: count = ${newValue}`);
}

/**
 * 加载更多用户
 */
export async function loadMoreUsers(context) {
  const { offset, limit, getOrCreateSignal, setupSignalBindings, lazySignals } = context;

  console.log(`[Handler] 加载更多用户: offset=${offset}, limit=${limit}`);

  try {
    // 1. 调用后端接口
    const response = await fetch(`/api/users?offset=${offset}&limit=${limit}`);
    const result = await response.json();

    if (!result.success || !result.users || result.users.length === 0) {
      console.log('[Handler] 没有更多数据了');
      return;
    }

    console.log(`[Handler] 获取到 ${result.users.length} 条新数据`);

    // 2. 找到用户列表容器
    const container = document.querySelector('.user-list') ||
                      document.querySelector('[style*="padding:0 20px"]');

    if (!container) {
      console.error('[Handler] 找不到用户列表容器');
      return;
    }

    // 3. 为每个新用户创建 DOM 并追加
    for (const user of result.users) {
      const userCard = createUserCardHTML(user);
      container.insertAdjacentHTML('beforeend', userCard);

      // 4. 为新添加的点赞按钮设置响应式
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
function createUserCardHTML(user) {
  const genderEmoji = user.gender === 'girl' ? '👩' : '👨';
  const statusStyle = user.status === '正常'
    ? 'background:#e8f5e9;color:#2e7d32'
    : 'background:#ffebee;color:#c62828';

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

