/**
 * 环境检测模块
 */

let _forceEnvironment: 'server' | 'client' | null = null;

/**
 * 强制设置环境（用于测试）
 */
export function setEnvironment(env: 'server' | 'client' | null): void {
  _forceEnvironment = env;
}

/**
 * 判断是否为服务端环境
 */
export function isServer(): boolean {
  // 强制环境（测试用）
  if (_forceEnvironment !== null) {
    return _forceEnvironment === 'server';
  }
  
  // Vite 环境
  if (typeof import.meta !== 'undefined' && (import.meta as any).env?.SSR !== undefined) {
    return (import.meta as any).env.SSR === true;
  }
  
  // Node.js 环境（无 window）
  return typeof window === 'undefined';
}
