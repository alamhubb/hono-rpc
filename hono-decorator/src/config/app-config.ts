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
   * 扫描指定目录下的所有控制器文件
   * 注意：此方法由调用方传入扫描结果，因为 import.meta.glob 必须在调用处使用
   * @param modules - import.meta.glob 的扫描结果
   */
  static loadControllers(modules: Record<string, any>): void {
    const fileCount = Object.keys(modules).length;
    console.log(`[AppConfig] 加载 ${fileCount} 个控制器文件`);

    // 模块已经被导入（eager: true），装饰器已经执行
    // 控制器已经通过 @RestController 装饰器注册到队列
    // 这里不需要额外处理
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
      this.registerRoute(app, ControllerClass, instance, route, prefix);
    }
  }

  /**
   * 注册单个路由
   */
  private static registerRoute(
    app: Hono,
    ControllerClass: any,
    instance: any,
    route: RouteInfo,
    prefix: string
  ): void {
    const { methodName, path, httpMethod, hasBody } = route;

    // 构建完整路径
    const fullPath = (prefix + path) || '/';

    // 检查是否为静态方法
    const isStatic = typeof ControllerClass[methodName] === 'function';

    // 创建 Hono 处理函数
    const handler = this.createHandler(ControllerClass, instance, methodName, hasBody, isStatic);

    // 注册路由到 Hono
    const method = httpMethod.toLowerCase();
    (app as any)[method](fullPath, handler);

    const methodType = isStatic ? 'static' : 'instance';
    console.log(`  ├─ ${httpMethod.padEnd(6)} ${fullPath} -> ${methodName}() [${methodType}]`);
  }

  /**
   * 创建 Hono 路由处理函数
   */
  private static createHandler(
    ControllerClass: any,
    instance: any,
    methodName: string,
    hasBody: boolean,
    isStatic: boolean
  ) {
    return async (c: Context) => {
      try {
        let result: any;

        // 根据是否为静态方法选择调用方式
        const target = isStatic ? ControllerClass : instance;

        if (hasBody) {
          // POST 等方法：解析 body 作为第一个参数，Context 作为第二个参数
          const body = await c.req.json();
          result = await target[methodName](body, c);
        } else {
          // GET 等方法：只传 Context
          result = await target[methodName](c);
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
 * @param options 配置选项
 * @param options.controllers 通过 import.meta.glob 扫描的控制器模块
 *
 * @returns 配置好的 Hono 应用实例
 *
 * @example
 * ```typescript
 * import { useHono } from 'hono-decorator';
 *
 * // 自动扫描 src/server/controllers 下的所有控制器
 * const app = useHono({
 *   controllers: import.meta.glob('./controllers/**\/*.ts', { eager: true })
 * });
 * ```
 */
export function useHono(options?: {
  controllers?: Record<string, any>;
}): Hono {
  const app = new Hono();

  // 如果提供了控制器模块，加载它们
  if (options?.controllers) {
    AppConfig.loadControllers(options.controllers);
  }

  AppConfig.buildApp(app);
  return app;
}

