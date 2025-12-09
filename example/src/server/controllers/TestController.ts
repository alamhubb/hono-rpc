import { RestController, RequestMapping, GetMapping } from 'hono-decorator';
import type { Context } from 'hono';

@RestController
@RequestMapping('/api/test')
export class TestController {
  @GetMapping('/info')
  static getInfo(c: Context) {
    return c.json({
      message: 'This is a test controller',
      autoScanned: true,
      timestamp: new Date().toISOString()
    });
  }
}

