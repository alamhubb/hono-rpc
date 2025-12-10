/**
 * Class Decorators for Legacy Decorators (experimentalDecorators)
 * 支持服务端（注册路由）和客户端（存储元数据）双模式
 * 
 * 基于 hono-rpc 的 isServer
 */
import 'reflect-metadata';
import { METADATA_KEYS, type ControllerOptions, type CorsOptions } from '../metadata/constants.ts';
import { isServer } from 'hono-rpc';
import { AppConfig } from '../config/app-config.ts';

/**
 * 标准化路径（确保以 / 开头，不以 / 结尾）
 */
function normalizePath(path: string): string {
  if (!path) return '';
  return (path.startsWith('/') ? path : `/${path}`).replace(/\/$/, '');
}

/**
 * RestController 装饰器
 * 服务端：标记类为控制器并注册到 AppConfig
 * 客户端：仅存储元数据
 */
export function RestController(target: Function): void {
  const options: ControllerOptions = { isRestController: true };
  Reflect.defineMetadata(METADATA_KEYS.CONTROLLER, options, target);
  
  if (isServer()) {
    AppConfig.registerController(target);
    console.log(`[RestController] ${target.name}`);
  }
}

/**
 * RequestMapping 装饰器
 * 定义类级别的路由前缀（客户端和服务端都需要）
 */
export function RequestMapping(path: string = ''): ClassDecorator {
  return (target: Function) => {
    const normalizedPath = normalizePath(path);
    Reflect.defineMetadata(METADATA_KEYS.PREFIX, normalizedPath, target);
    
    if (isServer()) {
      console.log(`[RequestMapping] ${target.name} -> ${normalizedPath || '/'}`);
    }
  };
}

/**
 * CrossOrigin 装饰器
 * 配置 CORS（仅服务端生效）
 */
export function CrossOrigin(options: CorsOptions = {}): ClassDecorator {
  return (target: Function) => {
    if (!isServer()) return;
    
    Reflect.defineMetadata(METADATA_KEYS.CORS, options, target);
    console.log(`[CrossOrigin] ${target.name} -> ${JSON.stringify(options)}`);
  };
}

/**
 * ControllerAdvice 装饰器
 * 全局异常处理器（仅服务端生效）
 */
export function ControllerAdvice(target: Function): void {
  if (!isServer()) return;
  
  Reflect.defineMetadata(METADATA_KEYS.CONTROLLER_ADVICE, true, target);
  
  AppConfig.registerControllerAdvice(target);
  console.log(`[ControllerAdvice] ${target.name}`);
}
