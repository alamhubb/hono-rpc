import { RestController, RequestMapping, GetMapping, PostMapping } from 'hono-decorator';
import type { Context } from 'hono';

interface Message {
  text: string;
  timestamp: string;
}

@RestController
@RequestMapping('/api')
export class ApiController {
  private static messages: Message[] = [];

  @GetMapping('/messages')
  static getMessages(c: Context) {
    return c.json({
      success: true,
      data: this.messages,
      total: this.messages.length
    });
  }

  @PostMapping('/messages')
  static async createMessage(body: { text: string }, c: Context) {
    const message: Message = {
      text: body.text,
      timestamp: new Date().toISOString()
    };

    this.messages.push(message);

    return c.json({
      success: true,
      message: 'Message created',
      data: message
    }, 201);
  }

  @GetMapping('/health')
  static health(c: Context) {
    return c.json({
      status: 'healthy',
      uptime: process.uptime(),
      timestamp: new Date().toISOString()
    });
  }
}

