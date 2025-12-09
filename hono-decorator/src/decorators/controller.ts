import 'reflect-metadata';
import { METADATA_KEYS } from '../metadata/constants';

/**
 * 控制器装饰器
 * 用于定义控制器类和路由前缀
 * 
 * @param prefix - 路由前缀，如 '/api/users'
 * 
 * @example
 * ```typescript
 * @Controller('/api/users')
 * class UserController {
 *   // ...
 * }
 * ```
 */
export function Controller(prefix: string = ''): ClassDecorator {
  return (target: any) => {
    // 标准化路由前缀（确保以 / 开头，不以 / 结尾）
    const normalizedPrefix = prefix
      ? (prefix.startsWith('/') ? prefix : `/${prefix}`).replace(/\/$/, '')
      : '';
    
    // 将路由前缀存储到类的元数据中
    Reflect.defineMetadata(
      METADATA_KEYS.CONTROLLER_PREFIX,
      normalizedPrefix,
      target
    );
    
    console.log(`[Controller] 注册控制器: ${target.name}, 前缀: ${normalizedPrefix || '/'}`);
  };
}

