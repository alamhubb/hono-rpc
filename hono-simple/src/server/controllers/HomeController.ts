import { RestController, RequestMapping, GetMapping } from 'hono-decorator';
import type { Context } from 'hono';

@RestController
@RequestMapping('')
export class HomeController {
  @GetMapping('/')
  static home(c: Context) {
    return c.text('Hello Hono with Decorator!');
  }

  @GetMapping('/about')
  static about(c: Context) {
    return c.json({
      name: 'Hono Simple',
      version: '1.0.0',
      description: 'A simple Hono server with hono-decorator',
      features: [
        'Zero configuration',
        'Auto controller scanning',
        'Spring Boot style decorators',
        'TypeScript support'
      ]
    });
  }
}

