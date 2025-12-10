/**
 * API 定义
 * 服务端和客户端共用
 */
import { useRpc } from 'hono-rpc';

export const rpc = useRpc();

// 用户类型
interface User {
  id: number;
  name: string;
  email: string;
}

// 模拟数据库
const users: User[] = [
  { id: 1, name: 'Alice', email: 'alice@example.com' },
  { id: 2, name: 'Bob', email: 'bob@example.com' },
];
let nextId = 3;

/**
 * 获取所有用户
 * GET /api/users
 */
export const getUsers = rpc.get('/api/users', async () => {
  return users;
});

/**
 * 获取用户（带分页）
 * GET /api/users/search?page=1&limit=10
 */
export const searchUsers = rpc.get('/api/users/search', async (query: { page: number; limit: number }) => {
  const page = Number(query.page) || 1;
  const limit = Number(query.limit) || 10;
  const start = (page - 1) * limit;
  return {
    users: users.slice(start, start + limit),
    total: users.length,
    page,
    limit,
  };
});

/**
 * 创建用户
 * POST /api/users
 */
export const createUser = rpc.post('/api/users', async (user: Omit<User, 'id'>) => {
  const newUser: User = { id: nextId++, ...user };
  users.push(newUser);
  return newUser;
}, 201);

/**
 * 更新用户
 * PUT /api/users
 */
export const updateUser = rpc.put('/api/users', async (user: User) => {
  const index = users.findIndex(u => u.id === user.id);
  if (index === -1) {
    throw new Error('User not found');
  }
  users[index] = user;
  return user;
});

/**
 * 删除用户
 * DELETE /api/users?id=1
 */
export const deleteUser = rpc.delete('/api/users', async (query: { id: number }) => {
  const index = users.findIndex(u => u.id === Number(query.id));
  if (index === -1) {
    return { success: false, message: 'User not found' };
  }
  users.splice(index, 1);
  return { success: true };
});
