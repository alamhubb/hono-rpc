import 'reflect-metadata';
import { Hono, Context } from 'hono';
import { METADATA_KEYS, ParamType, ParamMetadata } from '../metadata/constants';

/**
 * 路由构建器
 * 负责将装饰器标记的控制器转换为 Hono 路由
 */
export class RouteBuilder {
  /**
   * 构建并注册所有控制器的路由
   * @param app - Hono 应用实例
   * @param controllers - 控制器类数组
   */
  static buildRoutes(app: Hono, controllers: any[]): void {
    console.log(`\n[RouteBuilder] 开始构建路由，共 ${controllers.length} 个控制器\n`);
    
    for (const ControllerClass of controllers) {
      this.registerController(app, ControllerClass);
    }
    
    console.log('\n[RouteBuilder] 路由构建完成\n');
  }
  
  /**
   * 注册单个控制器
   */
  private static registerController(app: Hono, ControllerClass: any): void {
    // 创建控制器实例
    const instance = new ControllerClass();
    
    // 获取控制器的路由前缀
    const prefix = Reflect.getMetadata(METADATA_KEYS.CONTROLLER_PREFIX, ControllerClass) || '';
    
    // 获取原型对象
    const prototype = Object.getPrototypeOf(instance);
    
    // 获取所有方法名（排除构造函数）
    const methodNames = Object.getOwnPropertyNames(prototype)
      .filter(name => name !== 'constructor' && typeof prototype[name] === 'function');
    
    console.log(`[Controller] ${ControllerClass.name} (${prefix || '/'})`);
    
    for (const methodName of methodNames) {
      this.registerRoute(app, instance, prototype, methodName, prefix);
    }
  }
  
  /**
   * 注册单个路由
   */
  private static registerRoute(
    app: Hono,
    instance: any,
    prototype: any,
    methodName: string,
    prefix: string
  ): void {
    // 获取路由元数据
    const routePath = Reflect.getMetadata(METADATA_KEYS.ROUTE_PATH, prototype, methodName);
    const routeMethod = Reflect.getMetadata(METADATA_KEYS.ROUTE_METHOD, prototype, methodName);
    
    // 如果没有路由元数据，跳过
    if (routePath === undefined || !routeMethod) {
      return;
    }
    
    // 构建完整路径
    const fullPath = (prefix + routePath) || '/';
    
    // 创建 Hono 处理函数
    const handler = this.createHandler(instance, methodName, prototype);
    
    // 注册路由到 Hono
    const method = routeMethod.toLowerCase();
    if (method === 'all') {
      app.all(fullPath, handler);
    } else {
      (app as any)[method](fullPath, handler);
    }
    
    console.log(`  ├─ ${routeMethod.padEnd(6)} ${fullPath} -> ${methodName}()`);
  }
  
  /**
   * 创建 Hono 路由处理函数
   */
  private static createHandler(instance: any, methodName: string, prototype: any) {
    return async (c: Context) => {
      try {
        // 获取参数元数据
        const paramMetadata: ParamMetadata[] =
          Reflect.getMetadata(METADATA_KEYS.PARAM_METADATA, prototype, methodName) || [];
        
        // 构建方法参数
        const args = await this.buildMethodArgs(c, paramMetadata);
        
        // 调用控制器方法
        const result = await instance[methodName](...args);
        
        // 如果结果已经是 Response 对象，直接返回
        if (result instanceof Response) {
          return result;
        }
        
        // 否则返回 JSON
        return c.json(result);
      } catch (error) {
        console.error(`[Error] ${methodName}:`, error);
        return c.json(
          {
            success: false,
            message: error instanceof Error ? error.message : 'Internal Server Error',
          },
          500
        );
      }
    };
  }
  
  /**
   * 根据参数元数据构建方法参数数组
   */
  private static async buildMethodArgs(c: Context, paramMetadata: ParamMetadata[]): Promise<any[]> {
    const args: any[] = [];
    
    // 按参数索引排序
    const sortedParams = [...paramMetadata].sort((a, b) => a.index - b.index);
    
    for (const param of sortedParams) {
      let value: any;
      
      switch (param.type) {
        case ParamType.CONTEXT:
          value = c;
          break;
          
        case ParamType.QUERY:
          value = param.key ? c.req.query(param.key) : c.req.query();
          break;
          
        case ParamType.PARAM:
          value = c.req.param(param.key!);
          break;
          
        case ParamType.BODY:
          value = await c.req.json();
          break;
          
        case ParamType.HEADER:
          value = c.req.header(param.key!);
          break;
          
        case ParamType.COOKIE:
          value = c.req.cookie(param.key!);
          break;
          
        case ParamType.REQUEST:
          value = c.req.raw;
          break;
          
        default:
          value = undefined;
      }
      
      args[param.index] = value;
    }
    
    return args;
  }
}

