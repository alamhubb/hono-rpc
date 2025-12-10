import { 
  RestController, 
  RequestMapping, 
  GetMapping,
  RequestParam,
  CrossOrigin
} from 'hono-class';

@RestController
@RequestMapping('/api/admin')
@CrossOrigin({ origin: '*', methods: ['GET'] })
export class AdminController {
  /**
   * 管理员仪表板
   */
  @GetMapping('/dashboard')
  static getDashboard() {
    return {
      message: 'Admin Dashboard',
      stats: {
        totalUsers: 100,
        activeUsers: 85,
        totalRequests: 1234
      },
      scannedFromSubDirectory: true
    };
  }

  /**
   * 获取日志
   * 使用 @RequestParam 装饰器支持日志级别过滤
   */
  @GetMapping('/logs')
  static getLogs(
    @RequestParam({ name: 'level', defaultValue: 'all' }) level: string,
    @RequestParam({ name: 'limit', defaultValue: '10' }) limit: string
  ) {
    const allLogs = [
      { level: 'info', message: 'Server started', timestamp: new Date().toISOString() },
      { level: 'info', message: 'Controllers loaded', timestamp: new Date().toISOString() },
      { level: 'warn', message: 'High memory usage', timestamp: new Date().toISOString() },
      { level: 'error', message: 'Connection timeout', timestamp: new Date().toISOString() }
    ];

    const filteredLogs = level === 'all' 
      ? allLogs 
      : allLogs.filter(log => log.level === level);

    return {
      logs: filteredLogs.slice(0, parseInt(limit)),
      filter: { level, limit: parseInt(limit) }
    };
  }
}
