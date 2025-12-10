import { 
  RestController, 
  RequestMapping, 
  GetMapping, 
  PostMapping,
  ResponseStatus,
  PathVariable,
  RequestParam,
  RequestBody
} from 'hono-class';

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

  /**
   * 获取所有用户，支持分页
   * 使用 @RequestParam 装饰器获取查询参数
   */
  @GetMapping('')
  static getAllUsers(
    @RequestParam({ name: 'page', defaultValue: '1' }) page: string,
    @RequestParam({ name: 'limit', defaultValue: '10' }) limit: string
  ) {
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const start = (pageNum - 1) * limitNum;
    const paginatedUsers = this.users.slice(start, start + limitNum);
    
    return {
      success: true,
      data: paginatedUsers,
      total: this.users.length,
      page: pageNum,
      limit: limitNum
    };
  }

  /**
   * 根据 ID 获取用户
   * 使用 @PathVariable 装饰器获取路径参数
   */
  @GetMapping('/:id')
  static getUserById(@PathVariable('id') id: string) {
    const userId = parseInt(id);
    const user = this.users.find(u => u.id === userId);
    
    if (!user) {
      return { success: false, message: 'User not found' };
    }
    
    return { success: true, data: user };
  }

  /**
   * 创建新用户
   * 使用 @RequestBody 装饰器获取请求体
   * 使用 @ResponseStatus 装饰器设置响应状态码为 201
   */
  @PostMapping('')
  @ResponseStatus(201, 'Created')
  static createUser(@RequestBody() body: Omit<User, 'id'>) {
    const newUser: User = {
      id: this.users.length + 1,
      name: body.name,
      email: body.email
    };
    
    this.users.push(newUser);
    
    return {
      success: true,
      message: 'User created',
      data: newUser
    };
  }
}
