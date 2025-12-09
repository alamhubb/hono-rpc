import {Hono, type Context} from 'hono';
import {getPrefix, getRoutes, type RouteInfo} from '../metadata/constants';
import path from 'path';
import fs from 'fs';

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
     * 递归扫描目录并导入所有 .ts 和 .js 文件
     * @param dirPath - 目录路径
     */
    static scanDirectory(dirPath: string) {
        if (!fs.existsSync(dirPath)) {
            console.warn(`[AppConfig] 目录不存在: ${dirPath}`);
            return;
        }

        const entries = fs.readdirSync(dirPath, {withFileTypes: true});

        for (const entry of entries) {
            const fullPath = path.join(dirPath, entry.name);

            if (entry.isDirectory()) {
                // 递归扫描子目录
                this.scanDirectory(fullPath);
            } else if (entry.isFile()) {
                // 只处理 .ts 和 .js 文件，排除 .d.ts
                if ((entry.name.endsWith('.ts') || entry.name.endsWith('.js')) && !entry.name.endsWith('.d.ts')) {
                    console.log(`[AppConfig] 加载文件: ${fullPath}`);

                    try {
                        // 动态导入文件
                        import(fullPath);
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
        const {methodName, path, httpMethod, hasBody} = route;

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
 * import { useHono } from 'hono-decorator';
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

