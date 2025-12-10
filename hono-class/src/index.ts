/**
 * hono-class
 * Spring Boot 风格的装饰器路由 for Hono (Legacy Decorators)
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

// 导出参数解析器
export { ParamResolver, BadRequestError } from './resolver/param-resolver';

// 导出全局配置和 Hooks
export { AppConfig, useHono } from './config/app-config';

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
