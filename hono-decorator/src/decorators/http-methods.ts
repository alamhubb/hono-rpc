import { METADATA_KEYS, MetadataStorage } from '../metadata/constants';

/**
 * 创建 HTTP 方法装饰器的工厂函数（Stage 3）
 * @param method - HTTP 方法
 * @param hasBody - 是否自动注入请求体（用于 POST 等方法）
 */
function createMethodDecorator(method: string, hasBody: boolean = false) {
  return (path: string = '') => {
    return <T extends (...args: any[]) => any>(
      target: T,
      context: ClassMethodDecoratorContext<any, T>
    ): T => {
      const propertyKey = context.name as string;

      // 标准化路由路径
      const normalizedPath = path
        ? (path.startsWith('/') ? path : `/${path}`)
        : '';

      // 在类初始化时存储元数据
      context.addInitializer(function(this: any) {
        const proto = Object.getPrototypeOf(this);

        // 存储路由路径
        MetadataStorage.define(METADATA_KEYS.ROUTE_PATH, normalizedPath, proto, propertyKey);

        // 存储 HTTP 方法
        MetadataStorage.define(METADATA_KEYS.ROUTE_METHOD, method.toUpperCase(), proto, propertyKey);

        // 存储是否需要解析 body
        MetadataStorage.define(METADATA_KEYS.HAS_BODY, hasBody, proto, propertyKey);
      });

      console.log(`[${method.toUpperCase()}Mapping] ${normalizedPath || '/'} -> ${propertyKey}()`);

      return target;
    };
  };
}

/**
 * GetMapping - 处理 GET 请求
 * 方法签名: (c: Context) => any
 *
 * @example
 * ```typescript
 * @GetMapping('/users')
 * getUsers(c: Context) {
 *   return { users: [] };
 * }
 * ```
 */
export const GetMapping = createMethodDecorator('GET', false);

/**
 * PostMapping - 处理 POST 请求
 * 方法签名: (body: any, c: Context) => any
 * 自动注入请求体作为第一个参数（相当于 @RequestBody）
 *
 * @example
 * ```typescript
 * @PostMapping('/users')
 * createUser(body: any, c: Context) {
 *   return { success: true, user: body };
 * }
 * ```
 */
export const PostMapping = createMethodDecorator('POST', true);

