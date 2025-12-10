/**
 * Class Decorators for Legacy Decorators (experimentalDecorators)
 * 使用 reflect-metadata 进行元数据存储
 */
import 'reflect-metadata';
import { METADATA_KEYS, type ControllerOptions, type CorsOptions } from '../metadata/constants.ts';
import { AppConfig } from '../config/app-config.ts';

/**
 * 标准化路径（确保以 / 开头，不以 / 结尾）
 */
function normalizePath(path: string): string {
  if (!path) return '';
  return (path.startsWith('/') ? path : `/${path}`).replace(/\/$/, '');
}

/**
 * RestController 装饰器（Legacy Decorators）
 * 标记一个类为 REST 控制器，并自动注册到 Hono 应用
 *
 * @example
 * ```typescript
 * @RestController
 * @RequestMapping('/api')
 * class UserController {
 *   // ...
 * }
 * ```
 */
export function RestController(target: Function): void {
  const options: ControllerOptions = { isRestController: true };
  Reflect.defineMetadata(METADATA_KEYS.CONTROLLER, options, target);
  
  console.log(`[RestController] ${target.name}`);
  
  // 自动注册控制器到全局配置
  AppConfig.registerController(target);
}

/**
 * RequestMapping 装饰器（Legacy Decorators）
 * 用于定义类级别的路由前缀
 *
 * @param path - 路由前缀，如 '/api'
 *
 * @example
 * ```typescript
 * @RestController
 * @RequestMapping('/api')
 * class UserController {
 *   // ...
 * }
 * ```
 */
export function RequestMapping(path: string = ''): ClassDecorator {
  return (target: Function) => {
    const normalizedPath = normalizePath(path);
    Reflect.defineMetadata(METADATA_KEYS.PREFIX, normalizedPath, target);
    
    console.log(`[RequestMapping] ${target.name} -> ${normalizedPath || '/'}`);
  };
}

/**
 * CrossOrigin 装饰器（Legacy Decorators）
 * 用于配置类级别的 CORS 设置
 *
 * @param options - CORS 配置选项
 *
 * @example
 * ```typescript
 * @RestController
 * @CrossOrigin({ origin: '*', methods: ['GET', 'POST'] })
 * class ApiController {
 *   // ...
 * }
 * ```
 */
export function CrossOrigin(options: CorsOptions = {}): ClassDecorator {
  return (target: Function) => {
    Reflect.defineMetadata(METADATA_KEYS.CORS, options, target);
    
    console.log(`[CrossOrigin] ${target.name} -> ${JSON.stringify(options)}`);
  };
}

/**
 * ControllerAdvice 装饰器（Legacy Decorators）
 * 标记一个类为全局异常处理器
 *
 * @example
 * ```typescript
 * @ControllerAdvice
 * class GlobalExceptionHandler {
 *   @ExceptionHandler(Error)
 *   handleError(error: Error, ctx: Context) {
 *     return { message: error.message };
 *   }
 * }
 * ```
 */
export function ControllerAdvice(target: Function): void {
  Reflect.defineMetadata(METADATA_KEYS.CONTROLLER_ADVICE, true, target);
  
  console.log(`[ControllerAdvice] ${target.name}`);
  
  // 注册到全局配置
  AppConfig.registerControllerAdvice(target);
}
