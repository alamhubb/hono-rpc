import { RestController, RequestMapping, GetMapping } from 'hono-class';
import type { Context } from 'hono';

@RestController
@RequestMapping('/api')
export class HelloController {
  @GetMapping('/hello')
  static hello(c: Context) {
    return c.text('Hello World from static method');
  }
}

