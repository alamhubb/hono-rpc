import 'reflect-metadata';
import { METADATA_KEYS } from '../metadata/constants';

/**
 * 创建 HTTP 方法装饰器的工厂函数
 */
function createMethodDecorator(method: string) {
  return (path: string = ''): MethodDecorator => {
    return (target: any, propertyKey: string | symbol, descriptor: PropertyDescriptor) => {
      // 标准化路由路径
      const normalizedPath = path
        ? (path.startsWith('/') ? path : `/${path}`)
        : '';
      
      // 存储路由路径到方法的元数据
      Reflect.defineMetadata(
        METADATA_KEYS.ROUTE_PATH,
        normalizedPath,
        target,
        propertyKey
      );
      
      // 存储 HTTP 方法到方法的元数据
      Reflect.defineMetadata(
        METADATA_KEYS.ROUTE_METHOD,
        method.toUpperCase(),
        target,
        propertyKey
      );
      
      console.log(`[Route] ${method.toUpperCase()} ${normalizedPath} -> ${String(propertyKey)}`);
      
      return descriptor;
    };
  };
}

/**
 * GET 请求装饰器
 * @example
 * ```typescript
 * @Get('/users')
 * async getUsers() { }
 * ```
 */
export const Get = createMethodDecorator('GET');

/**
 * POST 请求装饰器
 */
export const Post = createMethodDecorator('POST');

/**
 * PUT 请求装饰器
 */
export const Put = createMethodDecorator('PUT');

/**
 * DELETE 请求装饰器
 */
export const Delete = createMethodDecorator('DELETE');

/**
 * PATCH 请求装饰器
 */
export const Patch = createMethodDecorator('PATCH');

/**
 * 所有 HTTP 方法装饰器
 */
export const All = createMethodDecorator('ALL');

