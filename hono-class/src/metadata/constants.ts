/**
 * Legacy Decorators Metadata Constants
 * 使用 reflect-metadata 进行元数据存储
 */
import 'reflect-metadata';

/**
 * 元数据键常量（使用字符串键）
 */
export const METADATA_KEYS = {
  // 类级别
  /** 控制器配置 */
  CONTROLLER: 'hono:controller',
  /** 控制器路由前缀 */
  PREFIX: 'hono:prefix',
  /** CORS 配置 */
  CORS: 'hono:cors',
  /** 全局异常处理器标记 */
  CONTROLLER_ADVICE: 'hono:controllerAdvice',

  // 方法级别
  /** 路由列表 */
  ROUTES: 'hono:routes',
  /** 响应状态码 */
  RESPONSE_STATUS: 'hono:responseStatus',
  /** 响应头 */
  RESPONSE_HEADERS: 'hono:responseHeaders',
  /** 异常处理器 */
  EXCEPTION_HANDLER: 'hono:exceptionHandler',

  // 参数级别
  /** 参数元数据 */
  PARAMS: 'hono:params',
} as const;

/**
 * 参数类型枚举
 */
export enum ParamType {
  PATH_VARIABLE = 'path',
  REQUEST_PARAM = 'query',
  REQUEST_HEADER = 'header',
  REQUEST_BODY = 'body',
  COOKIE_VALUE = 'cookie',
  CONTEXT = 'context',
}

/**
 * 参数元数据接口
 */
export interface ParamMetadata {
  type: ParamType;
  index: number;
  name?: string;
  required?: boolean;
  defaultValue?: any;
}

/**
 * 路由元数据接口
 */
export interface RouteMetadata {
  path: string;
  httpMethod: string;
  methodName: string;
  consumes?: string;
  produces?: string;
}

/**
 * CORS 配置接口
 */
export interface CorsOptions {
  origin?: string | string[];
  methods?: string[];
  allowedHeaders?: string[];
  exposedHeaders?: string[];
  credentials?: boolean;
  maxAge?: number;
}

/**
 * 响应状态元数据接口
 */
export interface ResponseStatusMetadata {
  code: number;
  reason?: string;
}

/**
 * 控制器配置接口
 */
export interface ControllerOptions {
  isRestController: boolean;
}

// 保留向后兼容的 RouteInfo 接口（别名）
export type RouteInfo = RouteMetadata & { hasBody?: boolean };
