/**
 * Parameter Resolver for Legacy Decorators
 * 根据参数元数据从 Hono Context 中解析参数值
 */
import type { Context } from 'hono';
import { getCookie } from 'hono/cookie';
import { ParamType, type ParamMetadata } from '../metadata/constants.ts';

/**
 * BadRequestError - 参数解析失败时抛出
 */
export class BadRequestError extends Error {
  public readonly statusCode = 400;

  constructor(message: string) {
    super(message);
    this.name = 'BadRequestError';
  }
}

/**
 * 参数解析器
 * 根据参数元数据从 Context 中提取值
 */
export class ParamResolver {
  /**
   * 解析所有参数
   * @param c - Hono Context
   * @param params - 参数元数据数组
   * @returns 解析后的参数值数组
   */
  static async resolve(c: Context, params: ParamMetadata[]): Promise<any[]> {
    if (!params || params.length === 0) {
      return [];
    }

    // 按 index 排序确保参数顺序正确
    const sortedParams = [...params].sort((a, b) => a.index - b.index);
    
    // 找出最大索引以确定数组大小
    const maxIndex = Math.max(...sortedParams.map(p => p.index));
    const args: any[] = new Array(maxIndex + 1).fill(undefined);

    for (const param of sortedParams) {
      let value: any;

      switch (param.type) {
        case ParamType.PATH_VARIABLE:
          value = param.name ? c.req.param(param.name) : undefined;
          break;

        case ParamType.REQUEST_PARAM:
          value = param.name ? c.req.query(param.name) : undefined;
          break;

        case ParamType.REQUEST_HEADER:
          value = param.name ? c.req.header(param.name) : undefined;
          break;

        case ParamType.REQUEST_BODY:
          try {
            value = await c.req.json();
          } catch {
            throw new BadRequestError('Invalid JSON body');
          }
          break;

        case ParamType.COOKIE_VALUE:
          value = param.name ? getCookie(c, param.name) : undefined;
          break;

        case ParamType.CONTEXT:
          value = c;
          break;

        default:
          value = undefined;
      }

      // 应用默认值
      if (value === undefined && param.defaultValue !== undefined) {
        value = param.defaultValue;
      }

      // 检查必填参数
      if (value === undefined && param.required) {
        const paramName = param.name || `parameter at index ${param.index}`;
        throw new BadRequestError(`Missing required parameter: ${paramName}`);
      }

      args[param.index] = value;
    }

    return args;
  }
}
