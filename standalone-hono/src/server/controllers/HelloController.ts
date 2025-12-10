import { 
  RestController, 
  RequestMapping, 
  GetMapping,
  RequestParam,
  RequestHeader
} from 'hono-class';

@RestController
@RequestMapping('/api')
export class HelloController {
  /**
   * 简单的 Hello 端点
   * 使用 @RequestParam 装饰器获取可选的 name 参数
   */
  @GetMapping('/hello')
  static hello(@RequestParam({ name: 'name', defaultValue: 'World' }) name: string) {
    return {
      message: `Hello, ${name}!`,
      timestamp: new Date().toISOString(),
      framework: 'Hono + hono-class',
      runtime: 'Node.js (no Vite)'
    };
  }

  /**
   * 服务器状态端点
   */
  @GetMapping('/status')
  static status() {
    return {
      status: 'ok',
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      version: process.version
    };
  }

  /**
   * 演示 @RequestHeader 装饰器
   * 获取请求头信息
   */
  @GetMapping('/headers')
  static getHeaders(
    @RequestHeader({ name: 'User-Agent', defaultValue: 'Unknown' }) userAgent: string,
    @RequestHeader({ name: 'Accept', defaultValue: '*/*' }) accept: string
  ) {
    return {
      userAgent,
      accept,
      timestamp: new Date().toISOString()
    };
  }
}
