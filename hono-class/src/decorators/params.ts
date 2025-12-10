/**
 * Parameter Decorators for Legacy Decorators (experimentalDecorators)
 * 使用 reflect-metadata 进行元数据存储
 */
import 'reflect-metadata';
import { METADATA_KEYS, ParamType, type ParamMetadata } from '../metadata/constants.ts';

/**
 * 参数装饰器选项接口
 */
interface ParamDecoratorOptions {
  /** 参数名称（用于从请求中提取值） */
  name?: string;
  /** 是否必填 */
  required?: boolean;
  /** 默认值 */
  defaultValue?: any;
}

/**
 * 创建参数装饰器的工厂函数
 * @param type - 参数类型
 */
function createParamDecorator(type: ParamType) {
  return (nameOrOptions?: string | ParamDecoratorOptions): ParameterDecorator => {
    return (target: Object, propertyKey: string | symbol | undefined, parameterIndex: number) => {
      // 解析选项
      const options: ParamDecoratorOptions = typeof nameOrOptions === 'string'
        ? { name: nameOrOptions }
        : nameOrOptions || {};

      // 判断是静态方法还是实例方法
      // 静态方法：target 是类本身
      // 实例方法：target 是类的原型，target.constructor 是类
      const targetClass = typeof target === 'function' ? target : target.constructor;

      // 获取现有参数元数据或创建新数组
      const existingParams: ParamMetadata[] =
        Reflect.getMetadata(METADATA_KEYS.PARAMS, targetClass, propertyKey!) || [];

      // 创建参数元数据
      const paramMetadata: ParamMetadata = {
        type,
        index: parameterIndex,
        name: options.name,
        required: options.required ?? true,
        defaultValue: options.defaultValue,
      };

      // 添加到参数列表
      existingParams.push(paramMetadata);

      // 存储参数元数据到方法
      Reflect.defineMetadata(METADATA_KEYS.PARAMS, existingParams, targetClass, propertyKey!);
    };
  };
}


/**
 * PathVariable 装饰器
 * 从 URL 路径参数中提取值
 *
 * @param nameOrOptions - 参数名称或配置选项
 *
 * @example
 * ```typescript
 * @GetMapping('/users/:id')
 * getUser(@PathVariable('id') id: string) {
 *   return { id };
 * }
 * ```
 */
export const PathVariable = createParamDecorator(ParamType.PATH_VARIABLE);

/**
 * RequestParam 装饰器
 * 从 URL 查询参数中提取值
 *
 * @param nameOrOptions - 参数名称或配置选项
 *
 * @example
 * ```typescript
 * @GetMapping('/users')
 * getUsers(@RequestParam('page') page: string, @RequestParam({ name: 'limit', defaultValue: '10' }) limit: string) {
 *   return { page, limit };
 * }
 * ```
 */
export const RequestParam = createParamDecorator(ParamType.REQUEST_PARAM);

/**
 * RequestHeader 装饰器
 * 从请求头中提取值
 *
 * @param nameOrOptions - 头名称或配置选项
 *
 * @example
 * ```typescript
 * @GetMapping('/protected')
 * protectedRoute(@RequestHeader('Authorization') auth: string) {
 *   return { auth };
 * }
 * ```
 */
export const RequestHeader = createParamDecorator(ParamType.REQUEST_HEADER);

/**
 * RequestBody 装饰器
 * 解析并注入请求体（JSON）
 *
 * @param options - 配置选项（可选）
 *
 * @example
 * ```typescript
 * @PostMapping('/users')
 * createUser(@RequestBody() body: CreateUserDto) {
 *   return { user: body };
 * }
 * ```
 */
export const RequestBody = createParamDecorator(ParamType.REQUEST_BODY);

/**
 * CookieValue 装饰器
 * 从 Cookie 中提取值
 *
 * @param nameOrOptions - Cookie 名称或配置选项
 *
 * @example
 * ```typescript
 * @GetMapping('/session')
 * getSession(@CookieValue('sessionId') sessionId: string) {
 *   return { sessionId };
 * }
 * ```
 */
export const CookieValue = createParamDecorator(ParamType.COOKIE_VALUE);

/**
 * Ctx 装饰器
 * 注入整个 Hono Context 对象
 *
 * @example
 * ```typescript
 * @GetMapping('/info')
 * getInfo(@Ctx() ctx: Context) {
 *   return { url: ctx.req.url };
 * }
 * ```
 */
export function Ctx(): ParameterDecorator {
  return createParamDecorator(ParamType.CONTEXT)();
}

/**
 * 获取方法的参数元数据
 * @param target - 目标类
 * @param methodName - 方法名
 */
export function getParamMetadata(target: Function, methodName: string | symbol): ParamMetadata[] {
  return Reflect.getMetadata(METADATA_KEYS.PARAMS, target, methodName) || [];
}
