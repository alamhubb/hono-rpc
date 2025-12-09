import { RestController, RequestMapping, GetMapping } from 'hono-decorator';
import type { Context } from 'hono';

@RestController
@RequestMapping('/api')
export class HelloController {
  @GetMapping('/hello')
  static hello(c: Context) {
    return c.json({
      message: 'Hello from standalone Hono server!',
      timestamp: new Date().toISOString(),
      framework: 'Hono + hono-decorator',
      runtime: 'Node.js (no Vite)'
    });
  }

  @GetMapping('/status')
  static status(c: Context) {
    return c.json({
      status: 'ok',
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      version: process.version
    });
  }
}

