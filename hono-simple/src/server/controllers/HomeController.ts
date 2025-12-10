import { RestController, RequestMapping, GetMapping } from 'hono-class';
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
      description: 'A simple Hono server with hono-class',
      features: [
        'Zero configuration',
        'Auto controller scanning',
        'Spring Boot style decorators',
        'TypeScript support'
      ]
    });
  }
}

