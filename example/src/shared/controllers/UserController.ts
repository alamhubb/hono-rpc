/**
 * UserController - 共享控制器
 * 服务端：注册路由处理请求
 * 客户端：直接调用静态方法发送 HTTP 请求
 */
import { RestController, RequestMapping, GetMapping, PostMapping, PathVariable, RequestBody } from 'hono-class';
import type { Context } from 'hono';

// 用户类型定义
export interface User {
  id: number;
  name: string;
  email: string;
}

// 模拟数据库
const users: User[] = [
  { id: 1, name: 'Alice', email: 'alice@example.com' },
  { id: 2, name: 'Bob', email: 'bob@example.com' },
];

@RestController
@RequestMapping('/api/users')
export class UserController {
  /**
   * 获取所有用户
   * GET /api/users
   */
  @GetMapping('')
  static getAll(c?: Context): User[] | Response {
    if (c) {
      // 服务端：返回 Response
      return c.json(users);
    }
    // 客户端：返回数据（由装饰器处理）
    return users;
  }

  /**
   * 根据 ID 获取用户
   * GET /api/users/:id
   */
  @GetMapping('/:id')
  static getById(
    @PathVariable('id') id: string,
    c?: Context
  ): User | Response | null {
    const user = users.find(u => u.id === Number(id));
    if (c) {
      return user ? c.json(user) : c.json({ error: 'User not found' }, 404);
    }
    return user || null;
  }

  /**
   * 创建用户
   * POST /api/users
   */
  @PostMapping('')
  static async create(
    @RequestBody() body: Omit<User, 'id'>,
    c?: Context
  ): Promise<User | Response> {
    const newUser: User = {
      id: users.length + 1,
      ...body,
    };
    users.push(newUser);
    
    if (c) {
      return c.json(newUser, 201);
    }
    return newUser;
  }
}
