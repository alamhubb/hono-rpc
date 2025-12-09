import { RestController, GetMapping } from 'hono-decorator';
import type { Context } from 'hono';

@RestController('/api')
export class HelloController {
  @GetMapping('/hello')
  hello(c: Context) {
    return c.text('Hello World');
  }
}

