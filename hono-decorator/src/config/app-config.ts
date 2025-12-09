import { Hono, type Context } from 'hono';
import { getPrefix, getRoutes, type RouteInfo } from '../metadata/constants';

/**
 * 全局应用配置
 * 用于自动注册控制器
 */
export class AppConfig {
  private static _controllers: any[] = [];

  /**
   * 注册控制器类到待注册队列
   * @param ControllerClass - 控制器类
   */
  static registerController(ControllerClass: any): void {
    this._controllers.push(ControllerClass);
    console.log(`[AppConfig] 控制器 ${ControllerClass.name} 已加入待注册队列`);
  }

  /**
   * 创建 Hono 应用并注册所有控制器
   * @param app - Hono 应用实例
   */
  static buildApp(app: Hono): void {
    console.log(`[AppConfig] 开始注册 ${this._controllers.length} 个控制器...`);

    for (const ControllerClass of this._controllers) {
      this.registerControllerToApp(app, ControllerClass);
    }

    console.log(`[AppConfig] 所有控制器注册完成`);
  }

  /**
   * 将控制器注册到 Hono 应用（内联 RouteBuilder 逻辑以避免循环依赖）
   */
  private static registerControllerToApp(app: Hono, ControllerClass: any): void {
    // 创建控制器实例
    const instance = new ControllerClass();

    // 通过 TC39 Stage 3 标准的 Symbol.metadata 获取元数据
    const metadata = ControllerClass[Symbol.metadata];

    // 获取控制器的路由前缀
    const prefix = getPrefix(metadata);

    // 获取所有路由信息
    const routes = metadata ? getRoutes(metadata) : [];

    console.log(`[RestController] ${ControllerClass.name} -> ${prefix || '/'}`);

    for (const route of routes) {
      this.registerRoute(app, instance, route, prefix);
    }
  }

  /**
   * 注册单个路由
   */
  private static registerRoute(
    app: Hono,
    instance: any,
    route: RouteInfo,
    prefix: string
  ): void {
    const { methodName, path, httpMethod, hasBody } = route;

    // 构建完整路径
    const fullPath = (prefix + path) || '/';

    // 创建 Hono 处理函数
    const handler = this.createHandler(instance, methodName, hasBody);

    // 注册路由到 Hono
    const method = httpMethod.toLowerCase();
    (app as any)[method](fullPath, handler);

    console.log(`  ├─ ${httpMethod.padEnd(6)} ${fullPath} -> ${methodName}()`);
  }

  /**
   * 创建 Hono 路由处理函数
   */
  private static createHandler(instance: any, methodName: string, hasBody: boolean) {
    return async (c: Context) => {
      try {
        let result: any;

        if (hasBody) {
          // POST 等方法：解析 body 作为第一个参数，Context 作为第二个参数
          const body = await c.req.json();
          result = await instance[methodName](body, c);
        } else {
          // GET 等方法：只传 Context
          result = await instance[methodName](c);
        }

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
   * 重置配置（主要用于测试）
   */
  static reset(): void {
    this._controllers = [];
  }
}

/**
 * 创建并配置 Hono 应用实例
 * 自动注册所有使用装饰器的控制器
 *
 * @returns 配置好的 Hono 应用实例
 *
 * @example
 * ```typescript
 * import { useHono } from 'hono-decorator';
 * import './controllers/HelloController';
 *
 * const app = useHono();
 * export default app;
 * ```
 */
export function useHono(): Hono {
  const app = new Hono();
  AppConfig.buildApp(app);
  return app;
}

