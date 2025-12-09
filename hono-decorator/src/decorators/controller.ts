import { METADATA_KEYS, MetadataStorage } from '../metadata/constants';

/**
 * RestController 装饰器（Stage 3）
 * 标记一个类为 REST 控制器
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
export function RestController<T extends new (...args: any[]) => any>(
  target: T,
  context: ClassDecoratorContext<T>
): T {
  // 标记为 REST 控制器
  MetadataStorage.define(METADATA_KEYS.IS_REST_CONTROLLER, true, target);
  console.log(`[RestController] ${context.name?.toString() || target.name}`);
  return target;
}

/**
 * RequestMapping 装饰器（Stage 3）
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
export function RequestMapping(path: string = '') {
  return <T extends new (...args: any[]) => any>(
    target: T,
    context: ClassDecoratorContext<T>
  ): T => {
    // 标准化路由前缀（确保以 / 开头，不以 / 结尾）
    const normalizedPath = path
      ? (path.startsWith('/') ? path : `/${path}`).replace(/\/$/, '')
      : '';

    // 将路由前缀存储到类的元数据中
    MetadataStorage.define(METADATA_KEYS.CONTROLLER_PREFIX, normalizedPath, target);

    console.log(`[RequestMapping] ${context.name?.toString() || target.name} -> ${normalizedPath || '/'}`);

    return target;
  };
}

