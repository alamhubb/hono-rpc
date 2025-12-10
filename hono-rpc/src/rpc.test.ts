/**
 * RPC 测试
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { useRpc, setEnvironment } from './index.ts';

interface User {
  id: number;
  name: string;
  email: string;
}

describe('hono-rpc', () => {
  beforeEach(() => {
    setEnvironment(null);
  });

  describe('服务端模式', () => {
    beforeEach(() => {
      setEnvironment('server');
    });

    it('GET 无参数', async () => {
      const rpc = useRpc();
      const users: User[] = [{ id: 1, name: 'Alice', email: 'alice@test.com' }];

      const getUsers = rpc.get('/api/users', async () => users);

      const result = await getUsers();
      expect(result).toEqual(users);
    });

    it('GET 带 query 参数', async () => {
      const rpc = useRpc();

      const search = rpc.get('/api/search', async (query: { page: number; limit: number }) => {
        return { page: query.page, limit: query.limit };
      });

      const result = await search({ page: 1, limit: 10 });
      expect(result).toEqual({ page: 1, limit: 10 });
    });

    it('POST 只有 body', async () => {
      const rpc = useRpc();

      const createUser = rpc.post('/api/users', async (user: Omit<User, 'id'>) => {
        return { id: 1, ...user };
      });

      const result = await createUser({ name: 'Bob', email: 'bob@test.com' });
      expect(result).toEqual({ id: 1, name: 'Bob', email: 'bob@test.com' });
    });

    it('POST body + query', async () => {
      const rpc = useRpc();

      const createUser = rpc.post('/api/users', async (user: Omit<User, 'id'>, query: { notify: boolean }) => {
        return { id: 1, ...user, notified: query.notify };
      });

      const result = await createUser({ name: 'Bob', email: 'bob@test.com' }, { notify: true });
      expect(result).toEqual({ id: 1, name: 'Bob', email: 'bob@test.com', notified: true });
    });
  });

  describe('Hono 路由测试', () => {
    it('GET 路由注册正确', async () => {
      const rpc = useRpc();
      
      rpc.get('/api/hello', async () => ({ message: 'Hello' }));

      const res = await rpc.hono.request('/api/hello');
      expect(res.status).toBe(200);
      expect(await res.json()).toEqual({ message: 'Hello' });
    });

    it('GET 带 query string', async () => {
      const rpc = useRpc();
      
      rpc.get('/api/search', async (query: { q: string }) => ({ query: query.q }));

      const res = await rpc.hono.request('/api/search?q=test');
      expect(res.status).toBe(200);
      expect(await res.json()).toEqual({ query: 'test' });
    });

    it('POST 路由注册正确', async () => {
      const rpc = useRpc();
      
      rpc.post('/api/echo', async (body: { text: string }) => body);

      const res = await rpc.hono.request('/api/echo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: 'hello' }),
      });
      expect(res.status).toBe(200);
      expect(await res.json()).toEqual({ text: 'hello' });
    });

    it('POST 自定义状态码', async () => {
      const rpc = useRpc();
      
      rpc.post('/api/users', async (user: { name: string }) => ({ id: 1, ...user }), 201);

      const res = await rpc.hono.request('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Test' }),
      });
      expect(res.status).toBe(201);
    });

    it('错误处理', async () => {
      const rpc = useRpc();
      
      rpc.get('/api/error', async () => {
        throw new Error('Something went wrong');
      });

      const res = await rpc.hono.request('/api/error');
      expect(res.status).toBe(500);
      expect(await res.json()).toEqual({ message: 'Something went wrong' });
    });
  });

  describe('完整 CRUD', () => {
    it('用户 CRUD 操作', async () => {
      setEnvironment('server');
      
      const rpc = useRpc();
      const users: User[] = [];
      let nextId = 1;

      const getUsers = rpc.get('/api/users', async () => users);
      
      const createUser = rpc.post('/api/users', async (user: Omit<User, 'id'>) => {
        const newUser = { id: nextId++, ...user };
        users.push(newUser);
        return newUser;
      }, 201);

      const updateUser = rpc.put('/api/users', async (user: User) => {
        const index = users.findIndex(u => u.id === user.id);
        if (index >= 0) {
          users[index] = user;
          return user;
        }
        throw new Error('User not found');
      });

      const deleteUser = rpc.delete('/api/users', async (query: { id: number }) => {
        const index = users.findIndex(u => u.id === query.id);
        if (index >= 0) {
          users.splice(index, 1);
          return { success: true };
        }
        return { success: false };
      });

      // 测试
      expect(await getUsers()).toEqual([]);

      const alice = await createUser({ name: 'Alice', email: 'alice@test.com' });
      expect(alice.id).toBe(1);
      expect(await getUsers()).toHaveLength(1);

      const bob = await createUser({ name: 'Bob', email: 'bob@test.com' });
      expect(bob.id).toBe(2);
      expect(await getUsers()).toHaveLength(2);

      const updatedAlice = await updateUser({ id: 1, name: 'Alice Updated', email: 'alice@test.com' });
      expect(updatedAlice.name).toBe('Alice Updated');

      const deleted = await deleteUser({ id: 1 });
      expect(deleted.success).toBe(true);
      expect(await getUsers()).toHaveLength(1);
    });
  });
});
