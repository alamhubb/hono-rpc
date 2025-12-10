import { RestController, RequestMapping, GetMapping } from 'hono-class';
import type { Context } from 'hono';

@RestController
@RequestMapping('/api/admin')
export class AdminController {
  @GetMapping('/dashboard')
  static getDashboard(c: Context) {
    return c.json({
      message: 'Admin Dashboard',
      stats: {
        totalUsers: 100,
        activeUsers: 85,
        totalRequests: 1234
      },
      scannedFromSubDirectory: true
    });
  }

  @GetMapping('/logs')
  static getLogs(c: Context) {
    return c.json({
      logs: [
        { level: 'info', message: 'Server started', timestamp: new Date().toISOString() },
        { level: 'info', message: 'Controllers loaded', timestamp: new Date().toISOString() }
      ]
    });
  }
}

