# hono-decorator Example

这是一个使用 `hono-decorator` 装饰器框架的完整示例应用。

## 功能特性

- 📊 **用户列表展示** - 从 MySQL 数据库读取用户数据
- 🚀 **Resumable SSR** - 服务端渲染 + 客户端懒恢复
- ⚡ **响应式系统** - 基于 alien-signals 的轻量级响应式状态管理
- 🔄 **无限滚动** - 滚动到底部自动加载更多数据
- 👍 **点赞功能** - 演示 POST 请求处理

## 技术栈

- **[hono-decorator](../hono-decorator)** - 装饰器路由框架
- **[Hono](https://hono.dev/)** - Web 框架
- **[Vite](https://vitejs.dev/)** - 构建工具
- **[Drizzle ORM](https://orm.drizzle.team/)** - 数据库 ORM
- **[alien-signals](https://github.com/stackblitz/alien-signals)** - 响应式系统

## 快速开始

### 1. 配置数据库

修改 `src/db/index.js` 中的数据库连接配置：

```javascript
const connection = mysql.createConnection({
  host: 'localhost',
  user: 'your_username',
  password: 'your_password',
  database: 'your_database'
});
```

### 2. 启动开发服务器

从项目根目录运行：

```bash
cd packages/example
npm run dev
```

访问 http://localhost:5173

## 项目结构

```
example/
├── server.ts              # Hono 应用入口
├── index.html            # HTML 模板
├── vite.config.js        # Vite 配置
├── src/
│   ├── controllers/      # 控制器
│   │   ├── api.controller.ts    # API 路由
│   │   └── ssr.controller.ts    # SSR 路由
│   ├── db/              # 数据库
│   │   ├── index.js     # 数据库连接
│   │   ├── schema.js    # 表结构
│   │   └── queries.js   # 查询函数
│   ├── app.js           # 应用组件
│   ├── entry-server.js  # SSR 入口
│   ├── main.js          # 客户端入口
│   ├── solid-runtime.js # 响应式运行时
│   └── serializer.js    # 数据序列化
└── package.json
```

## 控制器示例

### API 控制器

```typescript
@Controller('/api')
export class ApiController {
  @Get('/users')
  async getUsers(
    @Query('offset') offsetStr,
    @Query('limit') limitStr
  ) {
    const users = await getUsers(limit, offset);
    return { success: true, users };
  }

  @Post('/like')
  async like(@Body() body) {
    return { success: true, message: '点赞成功' };
  }
}
```

### SSR 控制器

```typescript
@Controller('')
export class SsrController {
  @Get('/')
  async renderIndex(@Ctx() c: Context) {
    // 读取模板
    let template = readFileSync(resolve('index.html'), 'utf-8');
    
    // Vite 转换
    const vite = c.get('vite');
    if (vite) {
      template = await vite.transformIndexHtml('/', template);
    }
    
    // 渲染应用
    const { html, state } = await renderApp();
    
    return c.html(template.replace('<!--ssr-outlet-->', html));
  }
}
```

## API 接口

### GET /api/users

获取用户列表（分页）

**参数：**
- `offset` - 偏移量（默认：0）
- `limit` - 每页数量（默认：10）

**响应：**
```json
{
  "success": true,
  "users": [...],
  "count": 10,
  "offset": 0,
  "limit": 10
}
```

### POST /api/like

用户点赞

**请求体：**
```json
{
  "userId": 123,
  "nickname": "张三"
}
```

**响应：**
```json
{
  "success": true,
  "message": "点赞成功（仅日志）"
}
```

## 学习要点

1. **装饰器路由** - 查看 `src/controllers/` 了解如何使用装饰器定义路由
2. **SSR 实现** - 查看 `src/entry-server.js` 了解服务端渲染流程
3. **响应式系统** - 查看 `src/solid-runtime.js` 了解响应式实现
4. **数据库集成** - 查看 `src/db/` 了解 Drizzle ORM 使用

## 许可证

MIT

