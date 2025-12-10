import { RestController, RequestMapping, GetMapping, PostMapping } from '../../../hono-class/src/index';
import { getUsers } from '../db/queries';
import type { Context } from 'hono';

/**
 * API 控制器
 * 处理所有 /api 路由
 */
@RestController
@RequestMapping('/api')
export class ApiController {
  /**
   * 获取用户列表（分页）
   * GET /api/users?offset=0&limit=10
   */
  @GetMapping('/users')
  async getUsers(c: Context) {
    const offsetStr = c.req.query('offset');
    const limitStr = c.req.query('limit');
    const offset = parseInt(offsetStr || '0') || 0;
    const limit = parseInt(limitStr || '10') || 10;

    console.log(`[API] 📋 获取用户列表: offset=${offset}, limit=${limit}`);

    try {
      const users = await getUsers(limit, offset);
      console.log(`[API] 返回 ${users.length} 条用户数据`);

      return {
        success: true,
        users,
        count: users.length,
        offset,
        limit,
      };
    } catch (error) {
      console.error('[API] 查询失败:', error);
      throw error;
    }
  }

  /**
   * 点赞接口
   * POST /api/like
   * body 自动注入（相当于 @RequestBody）
   */
  @PostMapping('/like')
  async like(body: { userId: string; nickname: string }, c: Context) {
    const { userId, nickname } = body;

    console.log(
      `[API] 👍 收到点赞请求: userId=${userId}, nickname=${nickname}, time=${new Date().toISOString()}`
    );

    return {
      success: true,
      message: '点赞成功（仅日志）',
    };
  }
}

