/**
 * UserControllerFun - 函数式 RPC 控制器
 * 使用 hono-rpc 实现，定义一次，服务端/客户端双用
 */
import { createRpc } from '../../../../hono-rpc/src/index.ts';

// 用户类型定义
export interface UserFun {
  id: number;
  name: string;
  email: string;
}

// 模拟数据库
const users: UserFun[] = [
  { id: 1, name: 'FunAlice', email: 'funalice@example.com' },
  { id: 2, name: 'FunBob', email: 'funbob@example.com' },
];

let nextId = 3;

// 创建 RPC 实例
const rpc = createRpc();

/**
 * 获取所有用户
 * GET /api/fun/users
 */
export const getFunUsers = rpc.get('/api/fun/users', async () => {
  return users;
});

/**
 * 根据 ID 获取用户
 * GET /api/fun/users/:id (需要手动处理路径参数)
 */
export const getFunUserById = rpc.post<{ id: number }, UserFun | null>(
  '/api/fun/users/get',
  async (input) => {
    return users.find(u => u.id === input.id) || null;
  }
);

/**
 * 创建用户
 * POST /api/fun/users
 */
export const createFunUser = rpc.post<Omit<UserFun, 'id'>, UserFun>(
  '/api/fun/users',
  async (input) => {
    const newUser: UserFun = {
      id: nextId++,
      ...input,
    };
    users.push(newUser);
    return newUser;
  },
  201
);

/**
 * 更新用户
 * PUT /api/fun/users
 */
export const updateFunUser = rpc.put<UserFun, UserFun | null>(
  '/api/fun/users',
  async (input) => {
    const index = users.findIndex(u => u.id === input.id);
    if (index >= 0) {
      users[index] = input;
      return input;
    }
    return null;
  }
);

/**
 * 删除用户
 * DELETE /api/fun/users
 */
export const deleteFunUser = rpc.post<{ id: number }, { success: boolean }>(
  '/api/fun/users/delete',
  async (input) => {
    const index = users.findIndex(u => u.id === input.id);
    if (index >= 0) {
      users.splice(index, 1);
      return { success: true };
    }
    return { success: false };
  }
);

// 导出 Hono 应用（服务端挂载用）
export const funUsersApp = rpc.hono;
