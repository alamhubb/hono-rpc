/**
 * 元数据键常量（使用 Symbol 确保唯一性）
 */
export const METADATA_KEYS = {
  IS_REST_CONTROLLER: Symbol('is:rest:controller'),
  CONTROLLER_PREFIX: Symbol('controller:prefix'),
  ROUTE_PATH: Symbol('route:path'),
  ROUTE_METHOD: Symbol('route:method'),
  HAS_BODY: Symbol('has:body'),
  ROUTES: Symbol('routes'),
} as const;

/**
 * 元数据存储工具
 * 用于在类和方法上存储和读取元数据（替代 reflect-metadata）
 */
export const MetadataStorage = {
  /**
   * 在目标对象上定义元数据
   */
  define<T>(key: symbol, value: T, target: any, propertyKey?: string | symbol): void {
    if (propertyKey !== undefined) {
      // 方法级别元数据
      if (!target[METADATA_KEYS.ROUTES]) {
        target[METADATA_KEYS.ROUTES] = {};
      }
      if (!target[METADATA_KEYS.ROUTES][propertyKey]) {
        target[METADATA_KEYS.ROUTES][propertyKey] = {};
      }
      target[METADATA_KEYS.ROUTES][propertyKey][key] = value;
    } else {
      // 类级别元数据
      target[key] = value;
    }
  },

  /**
   * 从目标对象获取元数据
   */
  get<T>(key: symbol, target: any, propertyKey?: string | symbol): T | undefined {
    if (propertyKey !== undefined) {
      // 方法级别元数据
      return target[METADATA_KEYS.ROUTES]?.[propertyKey]?.[key];
    } else {
      // 类级别元数据
      return target[key];
    }
  },

  /**
   * 获取所有路由方法名
   */
  getRouteMethods(target: any): string[] {
    const routes = target[METADATA_KEYS.ROUTES];
    return routes ? Object.keys(routes) : [];
  }
};



