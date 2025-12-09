/**
 * hono-decorator
 * Spring Boot 风格的装饰器路由 for Hono (Stage 3 Decorators)
 */

// 导出装饰器
export { RestController, RequestMapping } from './decorators/controller';
export { GetMapping, PostMapping } from './decorators/http-methods';

// 导出构建器
export { RouteBuilder } from './builder/route-builder';

// 导出全局配置和 Hooks
export { AppConfig, useHono } from './config/app-config';

