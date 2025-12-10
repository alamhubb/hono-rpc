/**
 * Class Decorators for Legacy Decorators (experimentalDecorators)
 * 支持服务端（注册路由）和客户端（存储元数据）双模式
 */
import 'reflect-metadata';
import { METADATA_KEYS, type ControllerOptions, type CorsOptions } from '../metadata/constants.ts';

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
 * 动态导入 AppConfig（仅服务端）
 */
async function getAppConfig() {
  const { AppConfig } = await import('../config/app-config.ts');
  return AppConfig;
}

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
    // 动态导入 AppConfig，避免客户端加载 Node.js 模块
    getAppConfig().then(AppConfig => {
      AppConfig.registerController(target);
      console.log(`[RestController] ${target.name}`);
    });
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
  
  // 动态导入 AppConfig，避免客户端加载 Node.js 模块
  getAppConfig().then(AppConfig => {
    AppConfig.registerControllerAdvice(target);
    console.log(`[ControllerAdvice] ${target.name}`);
  });
}
