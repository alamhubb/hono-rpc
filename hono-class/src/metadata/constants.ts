/**
 * Symbol.metadata Polyfill
 * TC39 Stage 3 Decorator Metadata 标准
 * https://github.com/tc39/proposal-decorator-metadata
 */
(Symbol as any).metadata ??= Symbol('Symbol.metadata');

/**
 * 元数据键常量（使用 Symbol 确保唯一性和私有性）
 */
export const METADATA_KEYS = {
  /** 控制器路由前缀 */
  PREFIX: Symbol('hono:prefix'),
  /** 路由列表 */
  ROUTES: Symbol('hono:routes'),
} as const;

/**
 * 路由信息接口
 */
export interface RouteInfo {
  /** 方法名 */
  methodName: string;
  /** 路由路径 */
  path: string;
  /** HTTP 方法 */
  httpMethod: string;
  /** 是否需要解析请求体 */
  hasBody: boolean;
}

/**
 * 获取或初始化路由列表
 */
export function getRoutes(metadata: DecoratorMetadataObject): RouteInfo[] {
  if (!metadata[METADATA_KEYS.ROUTES]) {
    metadata[METADATA_KEYS.ROUTES] = [];
  }
  return metadata[METADATA_KEYS.ROUTES] as RouteInfo[];
}

/**
 * 添加路由信息
 */
export function addRoute(metadata: DecoratorMetadataObject, route: RouteInfo): void {
  getRoutes(metadata).push(route);
}

/**
 * 设置控制器前缀
 */
export function setPrefix(metadata: DecoratorMetadataObject, prefix: string): void {
  metadata[METADATA_KEYS.PREFIX] = prefix;
}

/**
 * 获取控制器前缀
 */
export function getPrefix(metadata: DecoratorMetadataObject | null | undefined): string {
  return (metadata?.[METADATA_KEYS.PREFIX] as string) || '';
}



