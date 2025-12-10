/**
 * RPC 核心实现
 * 基于 Hono 的 hc 客户端
 * 
 * 参数设计：
 * - GET/DELETE: (query?) - 一个可选的 query 对象
 * - POST/PUT/PATCH: (body, query?) - body 对象 + 可选的 query 对象
 */
import { Hono, type Context } from 'hono';
import { hc } from 'hono/client';
import { isServer } from './env.ts';

/**
 * RPC 配置选项
 */
export interface RpcOptions {
  /** 基础 URL（客户端使用） */
  baseUrl?: string;
}

/**
 * 从 URL 解析 query 参数
 */
function parseQuery(url: string): Record<string, string> {
  return Object.fromEntries(new URL(url).searchParams.entries());
}

/**
 * 根据路径获取 hc 客户端的目标对象
 * '/api/users' → client['api']['users']
 */
function getClientTarget(client: any, path: string): any {
  const parts = path.split('/').filter(Boolean);
  let target = client;
  for (const part of parts) {
    target = target[part];
  }
  return target;
}

/**
 * HTTP 请求函数（兼容旧版，供 hono-class 使用）
 */
export async function httpRequest<T>(
  method: string,
  url: string,
  body?: unknown
): Promise<T> {
  const options: RequestInit = {
    method,
    headers: {},
  };

  if (body !== undefined && ['POST', 'PUT', 'PATCH'].includes(method)) {
    (options.headers as Record<string, string>)['Content-Type'] = 'application/json';
    options.body = JSON.stringify(body);
  }

  const response = await fetch(url, options);
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: response.statusText }));
    throw new Error(error.message || `HTTP ${response.status}`);
  }

  const contentType = response.headers.get('content-type');
  if (contentType?.includes('application/json')) {
    return response.json();
  }
  
  return response.text() as unknown as T;
}

/**
 * 创建 RPC 实例
 * 
 * @example
 * ```typescript
 * const rpc = useRpc();
 * 
 * export const getUsers = rpc.get('/api/users', async () => users);
 * export const createUser = rpc.post('/api/users', async (user) => ({ id: 1, ...user }));
 * 
 * export default rpc.hono;  // 服务端导出 Hono 应用
 * ```
 */
export function useRpc(options: RpcOptions = {}) {
  const app = new Hono();
  const { baseUrl = '' } = options;
  
  // 创建 Hono 客户端（客户端环境使用）
  const client = !isServer() ? hc(baseUrl) : null;

  return {
    /** Hono 应用实例（服务端使用） */
    hono: app,

    /**
     * GET 请求
     * @param path 路由路径
     * @param handler 处理函数，接收可选的 query 对象
     * 
     * @example
     * // 无参数
     * const getAll = rpc.get('/api/users', async () => users);
     * await getAll();
     * 
     * // 带 query 参数
     * const search = rpc.get('/api/users', async (query: { page: number; limit: number }) => users);
     * await search({ page: 1, limit: 10 });  // GET /api/users?page=1&limit=10
     */
    get<TQuery extends Record<string, any> | void, TOutput>(
      path: string,
      handler: (query: TQuery) => TOutput | Promise<TOutput>
    ): TQuery extends void ? () => Promise<TOutput> : (query: TQuery) => Promise<TOutput> {
      // 注册服务端路由
      app.get(path, async (c: Context) => {
        try {
          const query = parseQuery(c.req.url) as TQuery;
          const result = await handler(query);
          if (result instanceof Response) return result;
          return c.json(result);
        } catch (error) {
          console.error(`[RPC Error] GET ${path}:`, error);
          return c.json({ message: error instanceof Error ? error.message : 'Internal Server Error' }, 500);
        }
      });

      // 返回 RPC 函数
      const rpcFn = async (query?: TQuery): Promise<TOutput> => {
        if (isServer()) {
          return handler(query as TQuery);
        } else {
          // 使用 Hono 客户端
          const target = getClientTarget(client, path);
          const res = await target.$get({ query: query || {} });
          return res.json();
        }
      };

      return rpcFn as any;
    },

    /**
     * POST 请求
     * @param path 路由路径
     * @param handler 处理函数，接收 body 和可选的 query
     * @param statusCode 响应状态码（默认 200）
     */
    post<TBody, TQuery extends Record<string, any> | void, TOutput>(
      path: string,
      handler: TQuery extends void 
        ? (body: TBody) => TOutput | Promise<TOutput>
        : (body: TBody, query: TQuery) => TOutput | Promise<TOutput>,
      statusCode: number = 200
    ): TQuery extends void 
      ? (body: TBody) => Promise<TOutput> 
      : (body: TBody, query: TQuery) => Promise<TOutput> {
      // 注册服务端路由
      app.post(path, async (c: Context) => {
        try {
          const query = parseQuery(c.req.url);
          const body = await c.req.json().catch(() => ({})) as TBody;
          
          const result = handler.length >= 2
            ? await (handler as any)(body, query)
            : await (handler as any)(body);
          
          if (result instanceof Response) return result;
          return c.json(result, statusCode as any);
        } catch (error) {
          console.error(`[RPC Error] POST ${path}:`, error);
          return c.json({ message: error instanceof Error ? error.message : 'Internal Server Error' }, 500);
        }
      });

      // 返回 RPC 函数
      const rpcFn = async (body: TBody, query?: TQuery): Promise<TOutput> => {
        if (isServer()) {
          return handler.length >= 2
            ? (handler as any)(body, query)
            : (handler as any)(body);
        } else {
          // 使用 Hono 客户端
          const target = getClientTarget(client, path);
          const res = await target.$post({ 
            json: body,
            query: query || {}
          });
          return res.json();
        }
      };

      return rpcFn as any;
    },

    /**
     * PUT 请求
     * @param path 路由路径
     * @param handler 处理函数，接收 body 和可选的 query
     */
    put<TBody, TQuery extends Record<string, any> | void, TOutput>(
      path: string,
      handler: TQuery extends void 
        ? (body: TBody) => TOutput | Promise<TOutput>
        : (body: TBody, query: TQuery) => TOutput | Promise<TOutput>
    ): TQuery extends void 
      ? (body: TBody) => Promise<TOutput> 
      : (body: TBody, query: TQuery) => Promise<TOutput> {
      app.put(path, async (c: Context) => {
        try {
          const query = parseQuery(c.req.url);
          const body = await c.req.json().catch(() => ({})) as TBody;
          
          const result = handler.length >= 2
            ? await (handler as any)(body, query)
            : await (handler as any)(body);
          
          if (result instanceof Response) return result;
          return c.json(result);
        } catch (error) {
          console.error(`[RPC Error] PUT ${path}:`, error);
          return c.json({ message: error instanceof Error ? error.message : 'Internal Server Error' }, 500);
        }
      });

      const rpcFn = async (body: TBody, query?: TQuery): Promise<TOutput> => {
        if (isServer()) {
          return handler.length >= 2
            ? (handler as any)(body, query)
            : (handler as any)(body);
        } else {
          const target = getClientTarget(client, path);
          const res = await target.$put({ 
            json: body,
            query: query || {}
          });
          return res.json();
        }
      };

      return rpcFn as any;
    },

    /**
     * DELETE 请求
     * @param path 路由路径
     * @param handler 处理函数，接收可选的 query 对象
     */
    delete<TQuery extends Record<string, any> | void, TOutput>(
      path: string,
      handler: (query: TQuery) => TOutput | Promise<TOutput>
    ): TQuery extends void ? () => Promise<TOutput> : (query: TQuery) => Promise<TOutput> {
      app.delete(path, async (c: Context) => {
        try {
          const query = parseQuery(c.req.url) as TQuery;
          const result = await handler(query);
          if (result instanceof Response) return result;
          return c.json(result);
        } catch (error) {
          console.error(`[RPC Error] DELETE ${path}:`, error);
          return c.json({ message: error instanceof Error ? error.message : 'Internal Server Error' }, 500);
        }
      });

      const rpcFn = async (query?: TQuery): Promise<TOutput> => {
        if (isServer()) {
          return handler(query as TQuery);
        } else {
          const target = getClientTarget(client, path);
          const res = await target.$delete({ query: query || {} });
          return res.json();
        }
      };

      return rpcFn as any;
    },

    /**
     * PATCH 请求
     * @param path 路由路径
     * @param handler 处理函数，接收 body 和可选的 query
     */
    patch<TBody, TQuery extends Record<string, any> | void, TOutput>(
      path: string,
      handler: TQuery extends void 
        ? (body: TBody) => TOutput | Promise<TOutput>
        : (body: TBody, query: TQuery) => TOutput | Promise<TOutput>
    ): TQuery extends void 
      ? (body: TBody) => Promise<TOutput> 
      : (body: TBody, query: TQuery) => Promise<TOutput> {
      app.patch(path, async (c: Context) => {
        try {
          const query = parseQuery(c.req.url);
          const body = await c.req.json().catch(() => ({})) as TBody;
          
          const result = handler.length >= 2
            ? await (handler as any)(body, query)
            : await (handler as any)(body);
          
          if (result instanceof Response) return result;
          return c.json(result);
        } catch (error) {
          console.error(`[RPC Error] PATCH ${path}:`, error);
          return c.json({ message: error instanceof Error ? error.message : 'Internal Server Error' }, 500);
        }
      });

      const rpcFn = async (body: TBody, query?: TQuery): Promise<TOutput> => {
        if (isServer()) {
          return handler.length >= 2
            ? (handler as any)(body, query)
            : (handler as any)(body);
        } else {
          const target = getClientTarget(client, path);
          const res = await target.$patch({ 
            json: body,
            query: query || {}
          });
          return res.json();
        }
      };

      return rpcFn as any;
    },
  };
}
