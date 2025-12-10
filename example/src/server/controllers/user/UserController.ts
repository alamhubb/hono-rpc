import { RestController, RequestMapping, GetMapping } from 'hono-class';
import type { Context } from 'hono';

@RestController
@RequestMapping('/api/user')
export class UserController {
  @GetMapping('/list')
  static getUserList(c: Context) {
    return c.json({
      users: [
        { id: 1, name: 'Alice' },
        { id: 2, name: 'Bob' },
        { id: 3, name: 'Charlie' }
      ],
      total: 3,
      scannedFromSubDir: true
    });
  }
}

