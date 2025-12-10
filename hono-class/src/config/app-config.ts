/**
 * Application Configuration for Legacy Decorators
 * 使用 reflect-metadata 进行元数据读取
 * 集成 ParamResolver 解析参数
 * 支持 @ResponseStatus 和异常处理
 */
import 'reflect-metadata';
import { Hono, type Context } from 'hono';
import type { ContentfulStatusCode } from 'hono/utils/http-status';
import { cors } from 'hono/cors';
import { 
  METADATA_KEYS, 
  type RouteMetadata, 
  type ParamMetadata,
  type CorsOptions,
  type ResponseStatusMetadata 
} from '../metadata/constants.ts';
import { ParamResolver, BadRequestError } from '../resolver/param-resolver.ts';
import path from 'path';
import fs from 'fs';
import { pathToFileURL } from 'url';

/**
 * 异常处理器信息接口
 */
interface ExceptionHandlerInfo {
  errorTypes: Function[];
  handler: Function;
  instance: any;
  methodName: string;
}

/**
 * 全局应用配置
 * 用于自动注册控制器和异常处理器
 */
export class AppConfig {
  private static _controllers: any[] = [];
  private static _controllerAdvices: any[] = [];
  private static _exceptionHandlers: ExceptionHandlerInfo[] = [];

  /**
   * 注册控制器类到待注册队列
   * @param ControllerClass - 控制器类
   */
  static registerController(ControllerClass: any): void {
    this._controllers.push(ControllerClass);
    console.log(`[AppConfig] 控制器 ${ControllerClass.name} 已加入待注册队列`);
  }

  /**
   * 注册 ControllerAdvice 类（全局异常处理器）
   * @param AdviceClass - ControllerAdvice 类
   */
  static registerControllerAdvice(AdviceClass: any): void {
    this._controllerAdvices.push(AdviceClass);
    console.log(`[AppConfig] ControllerAdvice ${AdviceClass.name} 已注册`);
  }


  /**
   * 获取所有注册的 ControllerAdvice
   */
  static getControllerAdvices(): any[] {
    return this._controllerAdvices;
  }

  /**
   * 初始化异常处理器
   * 扫描所有 ControllerAdvice 类，提取 @ExceptionHandler 方法
   */
  private static initializeExceptionHandlers(): void {
    this._exceptionHandlers = [];

    for (const AdviceClass of this._controllerAdvices) {
      const instance = new AdviceClass();
      const prototype = AdviceClass.prototype;
      
      // 获取所有方法名
      const methodNames = Object.getOwnPropertyNames(prototype)
        .filter(name => name !== 'constructor' && typeof prototype[name] === 'function');

      for (const methodName of methodNames) {
        // 检查是否有 @ExceptionHandler 元数据
        const errorTypes: Function[] | undefined = Reflect.getMetadata(
          METADATA_KEYS.EXCEPTION_HANDLER,
          AdviceClass,
          methodName
        );

        if (errorTypes && errorTypes.length > 0) {
          this._exceptionHandlers.push({
            errorTypes,
            handler: prototype[methodName],
            instance,
            methodName,
          });
          console.log(`[AppConfig] 异常处理器 ${AdviceClass.name}.${methodName} -> [${errorTypes.map(e => e.name).join(', ')}]`);
        }
      }
    }
  }

  /**
   * 查找匹配的异常处理器
   * @param error - 抛出的异常
   * @returns 匹配的处理器信息，或 undefined
   */
  static findExceptionHandler(error: unknown): ExceptionHandlerInfo | undefined {
    if (!error) return undefined;

    for (const handlerInfo of this._exceptionHandlers) {
      for (const errorType of handlerInfo.errorTypes) {
        if (error instanceof (errorType as any)) {
          return handlerInfo;
        }
      }
    }

    return undefined;
  }

  /**
   * 递归扫描目录并导入所有 .ts 和 .js 文件
   * @param dirPath - 目录路径
   */
  static async scanDirectory(dirPath: string): Promise<void> {
    if (!fs.existsSync(dirPath)) {
      console.warn(`[AppConfig] 目录不存在: ${dirPath}`);
      return;
    }

    const entries = fs.readdirSync(dirPath, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);

      if (entry.isDirectory()) {
        // 递归扫描子目录
        await this.scanDirectory(fullPath);
      } else if (entry.isFile()) {
        // 只处理 .ts 和 .js 文件，排除 .d.ts
        if ((entry.name.endsWith('.ts') || entry.name.endsWith('.js')) && !entry.name.endsWith('.d.ts')) {
          console.log(`[AppConfig] 加载文件: ${fullPath}`);

          try {
            // 动态导入文件
            // 在 Windows 上需要转换为 file:// URL
            const fileUrl = pathToFileURL(fullPath).href;
            console.log(`[AppConfig] 导入 URL: ${fileUrl}`);
            await import(fileUrl);
            // 导入后，如果文件中有 @RestController 装饰器，会自动注册
          } catch (error) {
            console.error(`[AppConfig] 加载文件失败: ${fullPath}`, error);
          }
        }
      }
    }
  }


  /**
   * 创建 Hono 应用并注册所有控制器
   * @param app - Hono 应用实例
   */
  static buildApp(app: Hono): void {
    console.log(`[AppConfig] 开始注册 ${this._controllers.length} 个控制器...`);

    // 初始化异常处理器
    this.initializeExceptionHandlers();

    for (const ControllerClass of this._controllers) {
      this.registerControllerToApp(app, ControllerClass);
    }

    console.log(`[AppConfig] 所有控制器注册完成`);
  }

  /**
   * 将控制器注册到 Hono 应用（使用 reflect-metadata）
   */
  private static registerControllerToApp(app: Hono, ControllerClass: any): void {
    // 创建控制器实例
    const instance = new ControllerClass();

    // 使用 Reflect.getMetadata 获取元数据
    const prefix: string = Reflect.getMetadata(METADATA_KEYS.PREFIX, ControllerClass) || '';
    const routes: RouteMetadata[] = Reflect.getMetadata(METADATA_KEYS.ROUTES, ControllerClass) || [];
    const corsOptions: CorsOptions | undefined = Reflect.getMetadata(METADATA_KEYS.CORS, ControllerClass);

    console.log(`[RestController] ${ControllerClass.name} -> ${prefix || '/'}`);

    // 如果有 CORS 配置，应用 CORS 中间件
    if (corsOptions) {
      const corsPath = prefix ? `${prefix}/*` : '/*';
      app.use(corsPath, cors(this.convertCorsOptions(corsOptions)));
      console.log(`  ├─ CORS: ${JSON.stringify(corsOptions)}`);
    }

    for (const route of routes) {
      this.registerRoute(app, ControllerClass, instance, route, prefix);
    }
  }

  /**
   * 转换 CorsOptions 为 Hono cors 中间件格式
   */
  private static convertCorsOptions(options: CorsOptions): any {
    return {
      origin: options.origin || '*',
      allowMethods: options.methods,
      allowHeaders: options.allowedHeaders,
      exposeHeaders: options.exposedHeaders,
      credentials: options.credentials,
      maxAge: options.maxAge,
    };
  }

  /**
   * 注册单个路由
   */
  private static registerRoute(
    app: Hono,
    ControllerClass: any,
    instance: any,
    route: RouteMetadata,
    prefix: string
  ): void {
    const { methodName, path: routePath, httpMethod } = route;

    // 构建完整路径
    const fullPath = (prefix + routePath) || '/';

    // 检查是否为静态方法
    const isStatic = typeof ControllerClass[methodName] === 'function';

    // 创建 Hono 处理函数
    const handler = this.createHandler(ControllerClass, instance, methodName, isStatic);

    // 注册路由到 Hono
    const method = httpMethod.toLowerCase();
    (app as any)[method](fullPath, handler);

    const methodType = isStatic ? 'static' : 'instance';
    console.log(`  ├─ ${httpMethod.padEnd(6)} ${fullPath} -> ${methodName}() [${methodType}]`);
  }


  /**
   * 创建 Hono 路由处理函数
   * 集成 ParamResolver 解析参数，应用 @ResponseStatus 元数据
   */
  private static createHandler(
    ControllerClass: any,
    instance: any,
    methodName: string,
    isStatic: boolean
  ) {
    return async (c: Context) => {
      try {
        // 获取参数元数据
        const paramMetadata: ParamMetadata[] = 
          Reflect.getMetadata(METADATA_KEYS.PARAMS, ControllerClass, methodName) || [];

        // 根据是否为静态方法选择调用目标
        const target = isStatic ? ControllerClass : instance;

        let args: any[];

        if (paramMetadata.length > 0) {
          // 使用 ParamResolver 解析参数
          args = await ParamResolver.resolve(c, paramMetadata);
        } else {
          // 向后兼容：如果没有参数装饰器，默认传入 Context
          args = [c];
        }

        // 调用方法
        const result = await target[methodName].apply(target, args);

        // 如果结果已经是 Response 对象，直接返回
        if (result instanceof Response) {
          return result;
        }

        // 获取响应状态码元数据
        const statusMeta: ResponseStatusMetadata | undefined = 
          Reflect.getMetadata(METADATA_KEYS.RESPONSE_STATUS, ControllerClass, methodName);
        const statusCode = (statusMeta?.code || 200) as ContentfulStatusCode;

        // 返回 JSON 响应
        return c.json(result, statusCode);

      } catch (error) {
        return this.handleException(c, error);
      }
    };
  }

  /**
   * 处理异常
   * 查找匹配的 @ExceptionHandler，或返回默认错误响应
   */
  private static async handleException(c: Context, error: unknown): Promise<Response> {
    // 查找匹配的 ExceptionHandler
    const handlerInfo = this.findExceptionHandler(error);
    
    if (handlerInfo) {
      try {
        const result = await handlerInfo.handler.call(handlerInfo.instance, error, c);
        
        // 如果返回 Response，直接返回
        if (result instanceof Response) {
          return result;
        }
        
        // 获取处理器的 @ResponseStatus
        const statusMeta: ResponseStatusMetadata | undefined = 
          Reflect.getMetadata(
            METADATA_KEYS.RESPONSE_STATUS, 
            handlerInfo.instance.constructor, 
            handlerInfo.methodName
          );
        
        // 使用 @ResponseStatus 或 result.status 或默认 500
        const statusCode = (statusMeta?.code || result?.status || 500) as ContentfulStatusCode;
        
        return c.json(result, statusCode);
      } catch (handlerError) {
        console.error(`[Error] ExceptionHandler failed:`, handlerError);
      }
    }

    // 处理 BadRequestError
    if (error instanceof BadRequestError) {
      return c.json({
        success: false,
        message: error.message,
      }, 400);
    }

    // 默认错误处理
    console.error(`[Error]`, error);
    return c.json({
      success: false,
      message: error instanceof Error ? error.message : 'Internal Server Error',
    }, 500);
  }


  /**
   * 重置配置（主要用于测试）
   */
  static reset(): void {
    this._controllers = [];
    this._controllerAdvices = [];
    this._exceptionHandlers = [];
  }

  /**
   * 获取所有注册的控制器
   */
  static getControllers(): any[] {
    return this._controllers;
  }

  /**
   * 获取所有异常处理器（用于测试）
   */
  static getExceptionHandlers(): ExceptionHandlerInfo[] {
    return this._exceptionHandlers;
  }
}

/**
 * 创建并配置 Hono 应用实例
 * 自动扫描并注册所有使用装饰器的控制器
 *
 * 类似 Spring Boot 的 @ComponentScan
 *
 * 约定优于配置：
 * - 约定调用位置：src/server/index.ts
 * - 约定控制器目录：./controllers（相对于 src/server/）
 * - 支持相对路径（相对于 src/server/）
 * - 支持绝对路径
 *
 * @param packages 包路径数组，支持相对路径和绝对路径
 *                 - 相对路径：相对于 src/server/ 目录
 *                 - 绝对路径：直接使用
 *                 - 默认：['./controllers']
 *
 * @returns 配置好的 Hono 应用实例
 *
 * @example
 * ```typescript
 * // 文件位置：src/server/index.ts
 * import { useHono } from 'hono-class';
 *
 * // 使用默认配置：扫描 ./controllers（相对于 src/server/）
 * const app = await useHono();
 *
 * // 自定义相对路径（相对于 src/server/）
 * const app = await useHono(['./controllers', './api']);
 *
 * // 使用绝对路径
 * const app = await useHono(['/absolute/path/to/controllers']);
 *
 * export default app;
 * ```
 */
export async function useHono(packages?: string[]): Promise<Hono> {
  const app = new Hono();

  // 默认扫描 ./controllers（相对于 src/server/）
  const packagePaths = packages || ['./controllers'];

  // 约定的调用位置：src/server/index.ts
  // 所以基础目录是：项目根目录/src/server
  const projectRoot = process.cwd();
  const baseDir = path.resolve(projectRoot, 'src/server');

  console.log(`[useHono] 项目根目录: ${projectRoot}`);
  console.log(`[useHono] 基础目录: ${baseDir}`);
  console.log(`[useHono] 扫描包路径: ${packagePaths.join(', ')}`);

  // 处理包路径：相对路径转绝对路径
  const absolutePaths = packagePaths.map(pkg => {
    if (path.isAbsolute(pkg)) {
      return pkg;
    } else {
      // 相对路径相对于 src/server/
      return path.resolve(baseDir, pkg);
    }
  });

  // 扫描并加载控制器
  for (const absolutePath of absolutePaths) {
    await AppConfig.scanDirectory(absolutePath);
  }

  AppConfig.buildApp(app);
  return app;
}
