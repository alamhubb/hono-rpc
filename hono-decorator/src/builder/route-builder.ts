import { Hono, Context } from 'hono';
import { getPrefix, getRoutes, type RouteInfo } from '../metadata/constants';

/**
 * 路由构建器（TC39 Stage 3 Symbol.metadata 标准）
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
   * @param instance - 控制器实例
   * @param methodName - 方法名
   * @param hasBody - 是否需要解析请求体
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
}

