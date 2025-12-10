/**
 * hono-class
 * Spring Boot 风格的装饰器路由 for Hono (Legacy Decorators)
 * 
 * 客户端/服务端通用入口
 * 注意：AppConfig 和 useHono 仅服务端可用，需从 'hono-class/server' 导入
 */

// 确保 reflect-metadata 在入口导入
import 'reflect-metadata';

// 导出类装饰器
export { 
  RestController, 
  RequestMapping, 
  CrossOrigin, 
  ControllerAdvice 
} from './decorators/controller';

// 导出方法装饰器
export {
  GetMapping,
  PostMapping,
  PutMapping,
  DeleteMapping,
  PatchMapping,
  ResponseStatus,
  ExceptionHandler,
} from './decorators/http-methods';

// 导出参数装饰器
export {
  PathVariable,
  RequestParam,
  RequestHeader,
  RequestBody,
  CookieValue,
  Ctx,
  getParamMetadata,
} from './decorators/params';

// 导出元数据常量和类型
export { 
  METADATA_KEYS, 
  ParamType,
  type ParamMetadata,
  type RouteMetadata,
  type CorsOptions,
  type ResponseStatusMetadata,
  type ControllerOptions,
  type RouteInfo,
} from './metadata/constants';

// ============================================================
// 服务端专用导出（动态导入，避免客户端加载 Node.js 模块）
// ============================================================

/**
 * 服务端专用：创建 Hono 应用并注册控制器
 * 客户端调用会抛出错误
 */
export async function useHono(packages?: string[]) {
  const { useHono: serverUseHono } = await import('./config/app-config.ts');
  return serverUseHono(packages);
}

/**
 * 服务端专用：获取 AppConfig
 * 客户端调用会抛出错误
 */
export async function getAppConfig() {
  const { AppConfig } = await import('./config/app-config.ts');
  return AppConfig;
}

/**
 * 服务端专用：获取 ParamResolver
 */
export async function getParamResolver() {
  const { ParamResolver, BadRequestError } = await import('./resolver/param-resolver.ts');
  return { ParamResolver, BadRequestError };
}
