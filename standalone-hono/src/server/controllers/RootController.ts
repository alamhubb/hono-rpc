import { RestController, RequestMapping, GetMapping } from 'hono-class';

@RestController
@RequestMapping('')
export class RootController {
  @GetMapping('/')
  static index() {
    return {
      message: 'Welcome to Standalone Hono Server',
      version: '1.0.0',
      endpoints: {
        hello: '/api/hello',
        status: '/api/status',
        users: '/api/users',
        admin: '/api/admin/dashboard'
      }
    };
  }
}
