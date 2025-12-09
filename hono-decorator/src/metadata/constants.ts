/**
 * 元数据键常量
 */
export const METADATA_KEYS = {
  CONTROLLER_PREFIX: 'controller:prefix',
  CONTROLLER_MIDDLEWARES: 'controller:middlewares',
  ROUTE_PATH: 'route:path',
  ROUTE_METHOD: 'route:method',
  ROUTE_MIDDLEWARES: 'route:middlewares',
  PARAM_METADATA: 'param:metadata',
} as const;

/**
 * 参数类型枚举
 */
export enum ParamType {
  CONTEXT = 'context',
  QUERY = 'query',
  PARAM = 'param',
  BODY = 'body',
  HEADER = 'header',
  COOKIE = 'cookie',
  REQUEST = 'request',
}

/**
 * 参数元数据接口
 */
export interface ParamMetadata {
  index: number;        // 参数在方法中的索引位置
  type: ParamType;      // 参数类型
  key?: string;         // 参数键名（如 query key, param name）
}

/**
 * 路由元数据接口
 */
export interface RouteMetadata {
  path: string;
  method: string;
  methodName: string;
  paramMetadata: ParamMetadata[];
}

