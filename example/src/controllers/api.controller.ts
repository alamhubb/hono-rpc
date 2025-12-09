import 'reflect-metadata';
import { Controller, Get, Post, Query, Body } from '../../../hono-decorator/src/index';
import { getUsers } from '../db/queries';

/**
 * API 控制器
 * 处理所有 /api 路由
 */
@Controller('/api')
export class ApiController {
  /**
   * 获取用户列表（分页）
   * GET /api/users?offset=0&limit=10
   */
  @Get('/users')
  async getUsers(
    @Query('offset') offsetStr,
    @Query('limit') limitStr
  ) {
    const offset = parseInt(offsetStr || '0') || 0;
    const limit = parseInt(limitStr || '10') || 10;

    console.log(`[API] 📋 获取用户列表: offset=${offset}, limit=${limit}`);

    try {
      const users = await getUsers(limit, offset);
      console.log(`[API] 返回 ${users.length} 条用户数据`);

      return {
        success: true,
        users,  // 🔑 返回用户数据数组
        count: users.length,
        offset,
        limit,
      };
    } catch (error) {
      console.error('[API] 查询失败:', error);
      throw error; // RouteBuilder 会自动处理错误
    }
  }

  /**
   * 点赞接口
   * POST /api/like
   */
  @Post('/like')
  async like(@Body() body) {
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

