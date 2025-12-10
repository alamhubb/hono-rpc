/**
 * HTTP Method Decorators for Legacy Decorators (experimentalDecorators)
 * 支持服务端（注册路由）和客户端（发送 HTTP 请求）双模式
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
 * 判断是否为服务端环境
 */
function isServer(): boolean {
  // Vite 环境
  if (typeof import.meta !== 'undefined' && (import.meta as any).env?.SSR !== undefined) {
    return (import.meta as any).env.SSR === true;
  }
  // Node.js 环境（无 window）
  return typeof window === 'undefined';
}

/**
 * 客户端 HTTP 请求函数
 */
async function httpRequest(
  method: string,
  url: string,
  body?: any,
  pathParams?: Record<string, string>,
  queryParams?: Record<string, string>
): Promise<any> {
  // 替换路径参数 :id -> 实际值
  let finalUrl = url;
  if (pathParams) {
    for (const [key, value] of Object.entries(pathParams)) {
      finalUrl = finalUrl.replace(`:${key}`, encodeURIComponent(value));
    }
  }

  // 添加查询参数
  if (queryParams && Object.keys(queryParams).length > 0) {
    const searchParams = new URLSearchParams();
    for (const [key, value] of Object.entries(queryParams)) {
      if (value !== undefined) {
        searchParams.append(key, value);
      }
    }
    finalUrl += `?${searchParams.toString()}`;
  }

  const options: RequestInit = {
    method,
    headers: {},
  };

  if (body && ['POST', 'PUT', 'PATCH'].includes(method)) {
    (options.headers as Record<string, string>)['Content-Type'] = 'application/json';
    options.body = JSON.stringify(body);
  }

  const response = await fetch(finalUrl, options);
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: response.statusText }));
    throw new Error(error.message || `HTTP ${response.status}`);
  }

  return response.json();
}

/**
 * 创建 HTTP 方法装饰器的工厂函数
 * 服务端：注册路由元数据
 * 客户端：替换方法为 HTTP 请求
 */
function createMethodDecorator(httpMethod: string) {
  return (path: string = '', options?: MappingOptions): MethodDecorator => {
    return (target: Object, propertyKey: string | symbol, descriptor: PropertyDescriptor) => {
      const methodName = propertyKey as string;
      const normalizedPath = normalizePath(path);
      const targetClass = typeof target === 'function' ? target : target.constructor;

      if (isServer()) {
        // ========== 服务端：注册路由元数据 ==========
        const routes: RouteMetadata[] = Reflect.getMetadata(METADATA_KEYS.ROUTES, targetClass) || [];
        
        routes.push({
          path: normalizedPath,
          httpMethod: httpMethod.toUpperCase(),
          methodName,
          consumes: options?.consumes,
          produces: options?.produces,
        });
        
        Reflect.defineMetadata(METADATA_KEYS.ROUTES, routes, targetClass);
        console.log(`[${httpMethod.toUpperCase()}Mapping] ${normalizedPath || '/'} -> ${methodName}()`);
      } else {
        // ========== 客户端：替换为 HTTP 请求 ==========
        const originalMethod = descriptor.value;
        
        descriptor.value = async function(...args: any[]) {
          // 获取类的路由前缀
          const prefix: string = Reflect.getMetadata(METADATA_KEYS.PREFIX, targetClass) || '';
          const fullPath = prefix + normalizedPath;
          
          // 解析参数（根据参数装饰器元数据）
          const paramMetadata = Reflect.getMetadata(METADATA_KEYS.PARAMS, targetClass, methodName) || [];
          
          let body: any;
          const pathParams: Record<string, string> = {};
          const queryParams: Record<string, string> = {};
          
          // 按参数元数据分类
          for (const param of paramMetadata) {
            const value = args[param.index];
            if (value === undefined) continue;
            
            switch (param.type) {
              case 'body':
                body = value;
                break;
              case 'path':
                if (param.name) pathParams[param.name] = String(value);
                break;
              case 'query':
                if (param.name) queryParams[param.name] = String(value);
                break;
            }
          }
          
          // 如果没有参数元数据，第一个参数作为 body（POST/PUT/PATCH）
          if (paramMetadata.length === 0 && args.length > 0) {
            if (['POST', 'PUT', 'PATCH'].includes(httpMethod.toUpperCase())) {
              body = args[0];
            }
          }
          
          return httpRequest(httpMethod.toUpperCase(), fullPath, body, pathParams, queryParams);
        };
      }
      
      return descriptor;
    };
  };
}


/**
 * GetMapping - 处理 GET 请求
 * 服务端：注册 GET 路由
 * 客户端：发送 GET 请求
 */
export const GetMapping = createMethodDecorator('GET');

/**
 * PostMapping - 处理 POST 请求
 * 服务端：注册 POST 路由
 * 客户端：发送 POST 请求
 */
export const PostMapping = createMethodDecorator('POST');

/**
 * PutMapping - 处理 PUT 请求
 * 服务端：注册 PUT 路由
 * 客户端：发送 PUT 请求
 */
export const PutMapping = createMethodDecorator('PUT');

/**
 * DeleteMapping - 处理 DELETE 请求
 * 服务端：注册 DELETE 路由
 * 客户端：发送 DELETE 请求
 */
export const DeleteMapping = createMethodDecorator('DELETE');

/**
 * PatchMapping - 处理 PATCH 请求
 * 服务端：注册 PATCH 路由
 * 客户端：发送 PATCH 请求
 */
export const PatchMapping = createMethodDecorator('PATCH');

/**
 * ResponseStatus 装饰器
 * 用于指定方法成功响应时的 HTTP 状态码（仅服务端生效）
 */
export function ResponseStatus(code: number, reason?: string): MethodDecorator {
  return (target: Object, propertyKey: string | symbol, descriptor: PropertyDescriptor) => {
    if (!isServer()) return descriptor;
    
    const targetClass = typeof target === 'function' ? target : target.constructor;
    const metadata: ResponseStatusMetadata = { code, reason };
    Reflect.defineMetadata(METADATA_KEYS.RESPONSE_STATUS, metadata, targetClass, propertyKey);
    
    console.log(`[ResponseStatus] ${String(propertyKey)} -> ${code}${reason ? ` (${reason})` : ''}`);
    
    return descriptor;
  };
}

/**
 * ExceptionHandler 装饰器
 * 用于标记方法为异常处理器（仅服务端生效）
 */
export function ExceptionHandler(...errorTypes: Function[]): MethodDecorator {
  return (target: Object, propertyKey: string | symbol, descriptor: PropertyDescriptor) => {
    if (!isServer()) return descriptor;
    
    const targetClass = typeof target === 'function' ? target : target.constructor;
    Reflect.defineMetadata(METADATA_KEYS.EXCEPTION_HANDLER, errorTypes, targetClass, propertyKey);
    
    console.log(`[ExceptionHandler] ${String(propertyKey)} -> [${errorTypes.map(e => e.name).join(', ')}]`);
    
    return descriptor;
  };
}
