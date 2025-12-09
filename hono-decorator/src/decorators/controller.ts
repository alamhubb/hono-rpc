import { setPrefix } from '../metadata/constants';

/**
 * RestController 装饰器（TC39 Stage 3 Symbol.metadata 标准）
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
  // Symbol.metadata 标准会自动创建 metadata 对象
  console.log(`[RestController] ${context.name?.toString() || target.name}`);
  return target;
}

/**
 * RequestMapping 装饰器（TC39 Stage 3 Symbol.metadata 标准）
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

    // 使用 TC39 Stage 3 标准的 context.metadata 存储前缀
    setPrefix(context.metadata, normalizedPath);

    console.log(`[RequestMapping] ${context.name?.toString() || target.name} -> ${normalizedPath || '/'}`);

    return target;
  };
}

