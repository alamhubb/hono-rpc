/**
 * hono-rpc
 * 函数式 RPC 框架 - 定义一次，服务端/客户端双用
 * 
 * @example
 * ```typescript
 * // api.ts - 定义 API
 * import { createRpc } from 'hono-rpc';
 * 
 * const rpc = createRpc();
 * 
 * export const getUsers = rpc.get('/api/users', async () => {
 *   return [{ id: 1, name: 'Alice' }];
 * });
 * 
 * export const createUser = rpc.post('/api/users', async (body: { name: string }) => {
 *   return { id: 2, name: body.name };
 * });
 * 
 * export const app = rpc.hono;  // 服务端使用
 * 
 * // client.ts - 客户端调用
 * import { getUsers, createUser } from './api';
 * 
 * const users = await getUsers();
 * const newUser = await createUser({ name: 'Bob' });
 * ```
 */

export { useRpc, httpRequest, type RpcOptions } from './rpc.ts';
export { isServer, setEnvironment } from './env.ts';
