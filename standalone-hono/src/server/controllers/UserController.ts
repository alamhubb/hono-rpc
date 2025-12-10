import { RestController, RequestMapping, GetMapping, PostMapping } from 'hono-class';
import type { Context } from 'hono';

interface User {
  id: number;
  name: string;
  email: string;
}

@RestController
@RequestMapping('/api/users')
export class UserController {
  // 模拟数据库
  private static users: User[] = [
    { id: 1, name: 'Alice', email: 'alice@example.com' },
    { id: 2, name: 'Bob', email: 'bob@example.com' },
    { id: 3, name: 'Charlie', email: 'charlie@example.com' }
  ];

  @GetMapping('')
  static getAllUsers(c: Context) {
    return c.json({
      success: true,
      data: this.users,
      total: this.users.length
    });
  }

  @GetMapping('/:id')
  static getUserById(c: Context) {
    const id = parseInt(c.req.param('id'));
    const user = this.users.find(u => u.id === id);
    
    if (!user) {
      return c.json({ success: false, message: 'User not found' }, 404);
    }
    
    return c.json({ success: true, data: user });
  }

  @PostMapping('')
  static async createUser(body: User, c: Context) {
    const newUser: User = {
      id: this.users.length + 1,
      name: body.name,
      email: body.email
    };
    
    this.users.push(newUser);
    
    return c.json({
      success: true,
      message: 'User created',
      data: newUser
    }, 201);
  }
}

