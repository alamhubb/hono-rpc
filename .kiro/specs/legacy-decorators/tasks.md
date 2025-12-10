 # Implementation Plan

## Phase 1: 基础架构迁移

- [x] 1. 配置和依赖更新





  - [x] 1.1 更新 hono-class/package.json 添加 reflect-metadata 依赖


    - 添加 `reflect-metadata` 到 dependencies
    - _Requirements: 1.1_
  - [x] 1.2 更新 hono-class/tsconfig.json 启用旧版装饰器


    - 添加 `experimentalDecorators: true`
    - 添加 `emitDecoratorMetadata: true`
    - _Requirements: 1.4_
  - [x] 1.3 更新 standalone-hono/tsconfig.json 启用旧版装饰器


    - 添加 `experimentalDecorators: true`
    - 添加 `emitDecoratorMetadata: true`
    - _Requirements: 1.4_

- [x] 2. 重写元数据常量模块





  - [x] 2.1 重写 hono-class/src/metadata/constants.ts


    - 移除 Symbol.metadata polyfill
    - 添加 reflect-metadata import
    - 定义 METADATA_KEYS 常量（使用字符串键）
    - 定义 ParamType 枚举
    - 定义 ParamMetadata, RouteMetadata, CorsOptions 接口
    - _Requirements: 1.1, 1.2, 1.3_
  - [x] 2.2 编写元数据存储属性测试


    - **Property 1: Metadata Storage Consistency**
    - **Validates: Requirements 1.2, 1.3**

## Phase 2: 类装饰器重写

- [x] 3. 重写类装饰器





  - [x] 3.1 重写 hono-class/src/decorators/controller.ts


    - 使用 Reflect.defineMetadata 替代 context.metadata
    - 实现 @RestController 装饰器
    - 实现 @RequestMapping 装饰器
    - _Requirements: 2.1, 2.2_
  - [x] 3.2 编写类装饰器属性测试


    - **Property 2: Controller Registration**
    - **Property 3: Path Prefix Storage**
    - **Validates: Requirements 2.1, 2.2**
  - [x] 3.3 实现 @CrossOrigin 装饰器


    - 创建新文件或添加到 controller.ts
    - 存储 CORS 配置到元数据
    - _Requirements: 2.3_
  - [x] 3.4 实现 @ControllerAdvice 装饰器


    - 标记类为全局异常处理器
    - 注册到 AppConfig
    - _Requirements: 7.1_

## Phase 3: 方法装饰器重写

- [x] 4. 重写方法装饰器





  - [x] 4.1 重写 hono-class/src/decorators/http-methods.ts


    - 使用 Reflect.defineMetadata 存储路由信息
    - 重写 @GetMapping, @PostMapping, @PutMapping, @DeleteMapping, @PatchMapping
    - 支持 consumes/produces 选项
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_
  - [x] 4.2 编写方法装饰器属性测试


    - **Property 4: Route Registration**
    - **Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5**

  - [x] 4.3 实现 @ResponseStatus 装饰器









    - 存储状态码到方法元数据

    - _Requirements: 3.6, 6.1_
  - [x] 4.4 实现 @ExceptionHandler 装饰器


    - 存储异常类型到方法元数据
    - _Requirements: 7.2_

- [x] 5. Checkpoint - 确保所有测试通过





  - Ensure all tests pass, ask the user if questions arise.

## Phase 4: 参数装饰器实现

- [x] 6. 创建参数装饰器模块






  - [x] 6.1 创建 hono-class/src/decorators/params.ts

    - 实现 createParamDecorator 工厂函数
    - 实现 @PathVariable 装饰器
    - 实现 @RequestParam 装饰器
    - 实现 @RequestHeader 装饰器
    - 实现 @RequestBody 装饰器
    - 实现 @CookieValue 装饰器
    - 实现 @Ctx 装饰器（注入整个 Context）
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

  - [x] 6.2 编写参数装饰器属性测试

    - **Property 5: Parameter Resolution - PathVariable**
    - **Property 6: Parameter Resolution - RequestParam**
    - **Property 7: Parameter Resolution - RequestHeader**
    - **Property 8: Parameter Resolution - RequestBody**
    - **Validates: Requirements 4.1, 4.2, 4.3, 4.4**
  - [x] 6.3 实现默认值支持


    - 参数装饰器支持 defaultValue 选项
    - _Requirements: 4.6_
  - [x] 6.4 编写默认值属性测试


    - **Property 9: Default Value Application**
    - **Validates: Requirements 4.6**

## Phase 5: 参数解析器实现

- [x] 7. 创建参数解析器






  - [x] 7.1 创建 hono-class/src/resolver/param-resolver.ts

    - 实现 ParamResolver.resolve() 方法
    - 根据 ParamType 从 Context 提取值
    - 处理默认值和必填校验
    - _Requirements: 5.1, 5.2, 5.3_

## Phase 6: 路由构建器重写

- [x] 8. 重写路由构建器和应用配置








  - [x] 8.1 重写 hono-class/src/config/app-config.ts




    - 使用 Reflect.getMetadata 读取元数据
    - 集成 ParamResolver 解析参数
    - 应用 @ResponseStatus 元数据
    - 实现异常处理器注册和查找
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 7.3, 7.4_


  - [x] 8.2 编写响应状态属性测试


    - **Property 10: Response Status Application**
    - **Validates: Requirements 5.4, 6.1**



  - [x] 8.3 编写异常处理属性测试

    - **Property 11: Exception Handler Matching**
    - **Validates: Requirements 7.2, 7.3**

- [x] 9. Checkpoint - 确保所有测试通过
  - All 36 tests pass (5 test files)

## Phase 7: 导出和集成

- [x] 10. 更新导出和集成
  - [x] 10.1 更新 hono-class/src/index.ts
    - 导出所有新装饰器
    - 导出 ParamResolver（可选）
    - 确保 reflect-metadata 在入口导入
    - _Requirements: 1.1_
  - [x] 10.2 更新 standalone-hono 示例控制器
    - 更新 HelloController 使用新装饰器
    - 更新 UserController 使用参数装饰器
    - 更新 AdminController 使用新装饰器
    - _Requirements: 4.1, 4.2, 4.3, 4.4_

## Phase 8: 文档和清理

- [x] 11. 更新文档
  - [x] 11.1 更新 hono-class/README.md
    - 更新 tsconfig.json 配置说明
    - 添加参数装饰器使用示例
    - 添加异常处理使用示例
    - _Requirements: All_
  - [x] 11.2 更新 standalone-hono/README.md
    - 更新 API 端点文档
    - 添加新功能说明
    - _Requirements: All_

- [x] 12. Final Checkpoint - 确保所有测试通过
  - All 36 tests pass (5 test files)
