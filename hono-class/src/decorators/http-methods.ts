/**
 * HTTP Method Decorators for Legacy Decorators (experimentalDecorators)
 * 使用 reflect-metadata 进行元数据存储
 */
import 'reflect-metadata';
import { METADATA_KEYS, type RouteMetadata, type ResponseStatusMetadata } from '../metadata/constants.ts';

/**
 * HTTP 方法装饰器选项
 */
interface MappingOptions {
  /** 接受的 Content-Type */
  consumes?: string;
  /** 响应的 Content-Type */
  produces?: string;
}

/**
 * 标准化路径（确保以 / 开头）
 */
function normalizePath(path: string): string {
  if (!path) return '';
  return path.startsWith('/') ? path : `/${path}`;
}

/**
 * 创建 HTTP 方法装饰器的工厂函数（Legacy Decorators）
 * @param httpMethod - HTTP 方法
 */
function createMethodDecorator(httpMethod: string) {
  return (path: string = '', options?: MappingOptions): MethodDecorator => {
    return (target: Object, propertyKey: string | symbol, descriptor: PropertyDescriptor) => {
      const methodName = propertyKey as string;
      const normalizedPath = normalizePath(path);
      
      // 判断是静态方法还是实例方法
      // 静态方法：target 是类本身
      // 实例方法：target 是类的原型，target.constructor 是类
      const targetClass = typeof target === 'function' ? target : target.constructor;
      
      // 获取现有路由列表或创建新列表
      const routes: RouteMetadata[] = Reflect.getMetadata(METADATA_KEYS.ROUTES, targetClass) || [];
      
      // 添加新路由
      routes.push({
        path: normalizedPath,
        httpMethod: httpMethod.toUpperCase(),
        methodName,
        consumes: options?.consumes,
        produces: options?.produces,
      });
      
      // 存储路由元数据到类
      Reflect.defineMetadata(METADATA_KEYS.ROUTES, routes, targetClass);
      
      console.log(`[${httpMethod.toUpperCase()}Mapping] ${normalizedPath || '/'} -> ${methodName}()`);
      
      return descriptor;
    };
  };
}


/**
 * GetMapping - 处理 GET 请求
 * 
 * @param path - 路由路径
 * @param options - 可选配置（consumes/produces）
 *
 * @example
 * ```typescript
 * @GetMapping('/users')
 * getUsers(c: Context) {
 *   return { users: [] };
 * }
 * ```
 */
export const GetMapping = createMethodDecorator('GET');

/**
 * PostMapping - 处理 POST 请求
 * 
 * @param path - 路由路径
 * @param options - 可选配置（consumes/produces）
 *
 * @example
 * ```typescript
 * @PostMapping('/users', { consumes: 'application/json' })
 * createUser(@RequestBody body: any, c: Context) {
 *   return { success: true, user: body };
 * }
 * ```
 */
export const PostMapping = createMethodDecorator('POST');

/**
 * PutMapping - 处理 PUT 请求
 * 
 * @param path - 路由路径
 * @param options - 可选配置（consumes/produces）
 *
 * @example
 * ```typescript
 * @PutMapping('/users/:id', { consumes: 'application/json' })
 * updateUser(@PathVariable('id') id: string, @RequestBody body: any) {
 *   return { success: true, id, user: body };
 * }
 * ```
 */
export const PutMapping = createMethodDecorator('PUT');

/**
 * DeleteMapping - 处理 DELETE 请求
 * 
 * @param path - 路由路径
 * @param options - 可选配置（consumes/produces）
 *
 * @example
 * ```typescript
 * @DeleteMapping('/users/:id')
 * deleteUser(@PathVariable('id') id: string) {
 *   return { success: true, deleted: id };
 * }
 * ```
 */
export const DeleteMapping = createMethodDecorator('DELETE');

/**
 * PatchMapping - 处理 PATCH 请求
 * 
 * @param path - 路由路径
 * @param options - 可选配置（consumes/produces）
 *
 * @example
 * ```typescript
 * @PatchMapping('/users/:id', { consumes: 'application/json' })
 * patchUser(@PathVariable('id') id: string, @RequestBody body: any) {
 *   return { success: true, id, updated: body };
 * }
 * ```
 */
export const PatchMapping = createMethodDecorator('PATCH');

/**
 * ResponseStatus 装饰器
 * 用于指定方法成功响应时的 HTTP 状态码
 *
 * @param code - HTTP 状态码
 * @param reason - 可选的状态原因描述
 *
 * @example
 * ```typescript
 * @PostMapping('/users')
 * @ResponseStatus(201, 'Created')
 * createUser(@RequestBody body: any) {
 *   return { user: body };
 * }
 * ```
 */
export function ResponseStatus(code: number, reason?: string): MethodDecorator {
  return (target: Object, propertyKey: string | symbol, descriptor: PropertyDescriptor) => {
    const targetClass = typeof target === 'function' ? target : target.constructor;
    const metadata: ResponseStatusMetadata = { code, reason };
    Reflect.defineMetadata(METADATA_KEYS.RESPONSE_STATUS, metadata, targetClass, propertyKey);
    
    console.log(`[ResponseStatus] ${String(propertyKey)} -> ${code}${reason ? ` (${reason})` : ''}`);
    
    return descriptor;
  };
}

/**
 * ExceptionHandler 装饰器
 * 用于标记方法为异常处理器，处理指定类型的异常
 *
 * @param errorTypes - 要处理的异常类型列表
 *
 * @example
 * ```typescript
 * @ControllerAdvice
 * class GlobalExceptionHandler {
 *   @ExceptionHandler(ValidationError, BadRequestError)
 *   handleValidationError(error: Error, ctx: Context) {
 *     return { message: error.message, status: 400 };
 *   }
 * }
 * ```
 */
export function ExceptionHandler(...errorTypes: Function[]): MethodDecorator {
  return (target: Object, propertyKey: string | symbol, descriptor: PropertyDescriptor) => {
    const targetClass = typeof target === 'function' ? target : target.constructor;
    Reflect.defineMetadata(METADATA_KEYS.EXCEPTION_HANDLER, errorTypes, targetClass, propertyKey);
    
    console.log(`[ExceptionHandler] ${String(propertyKey)} -> [${errorTypes.map(e => e.name).join(', ')}]`);
    
    return descriptor;
  };
}
