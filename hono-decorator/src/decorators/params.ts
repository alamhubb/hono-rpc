import 'reflect-metadata';
import { METADATA_KEYS, ParamType } from '../metadata/constants';

/**
 * 创建参数装饰器的工厂函数
 */
function createParamDecorator(type, key) {
  return (target, propertyKey, parameterIndex) => {
    // 获取已有的参数元数据数组
    const existingParams =
      Reflect.getOwnMetadata(METADATA_KEYS.PARAM_METADATA, target, propertyKey) || [];
    
    // 添加新的参数元数据
    existingParams.push({
      index: parameterIndex,
      type,
      key,
    });
    
    // 保存更新后的参数元数据
    Reflect.defineMetadata(
      METADATA_KEYS.PARAM_METADATA,
      existingParams,
      target,
      propertyKey
    );
    
    console.log(`[Param] ${String(propertyKey)}[${parameterIndex}] -> ${type}${key ? `(${key})` : ''}`);
  };
}

/**
 * 获取 Hono Context 对象
 * @example
 * ```typescript
 * async handler(@Ctx() c: Context) { }
 * ```
 */
export const Ctx = (): ParameterDecorator => createParamDecorator(ParamType.CONTEXT);

/**
 * 获取查询参数
 * @param key - 查询参数的键名，如果不提供则返回所有查询参数
 * @example
 * ```typescript
 * async handler(@Query('page') page: string) { }
 * async handler(@Query() query: Record<string, string>) { }
 * ```
 */
export const Query = (key?: string): ParameterDecorator => createParamDecorator(ParamType.QUERY, key);

/**
 * 获取路径参数
 * @param key - 路径参数的键名
 * @example
 * ```typescript
 * @Get('/:id')
 * async handler(@Param('id') id: string) { }
 * ```
 */
export const Param = (key: string): ParameterDecorator => createParamDecorator(ParamType.PARAM, key);

/**
 * 获取请求体
 * @example
 * ```typescript
 * @Post('/')
 * async handler(@Body() body: any) { }
 * ```
 */
export const Body = (): ParameterDecorator => createParamDecorator(ParamType.BODY);

/**
 * 获取请求头
 * @param key - 请求头的键名
 * @example
 * ```typescript
 * async handler(@Header('authorization') auth: string) { }
 * ```
 */
export const Header = (key: string): ParameterDecorator => createParamDecorator(ParamType.HEADER, key);

/**
 * 获取 Cookie
 * @param key - Cookie 的键名
 * @example
 * ```typescript
 * async handler(@Cookie('session') session: string) { }
 * ```
 */
export const Cookie = (key: string): ParameterDecorator => createParamDecorator(ParamType.COOKIE, key);

/**
 * 获取 Request 对象
 * @example
 * ```typescript
 * async handler(@Req() req: Request) { }
 * ```
 */
export const Req = (): ParameterDecorator => createParamDecorator(ParamType.REQUEST);

