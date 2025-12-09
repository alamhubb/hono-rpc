# 🚀 快速启动指南

## 步骤 1: 安装依赖

```bash
cd standalone-hono
npm install
```

## 步骤 2: 启动开发服务器

```bash
npm run dev
```

你应该看到：

```
[useHono] 项目根目录: D:\project\openproject\signal-solidjs
[useHono] 基础目录: D:\project\openproject\signal-solidjs\src\server
[useHono] 扫描包路径: ./controllers
[AppConfig] 加载文件: D:\project\openproject\signal-solidjs\src\server\controllers\HelloController.ts
[AppConfig] 加载文件: D:\project\openproject\signal-solidjs\src\server\controllers\UserController.ts
[AppConfig] 加载文件: D:\project\openproject\signal-solidjs\src\server\controllers\admin\AdminController.ts
[AppConfig] 控制器 HelloController 已加入待注册队列
[AppConfig] 控制器 UserController 已加入待注册队列
[AppConfig] 控制器 AdminController 已加入待注册队列
[AppConfig] 开始注册 3 个控制器...
[RestController] HelloController -> /api
  ├─ GET    /api/hello -> hello() [static]
  ├─ GET    /api/status -> status() [static]
[RestController] UserController -> /api/users
  ├─ GET    /api/users/ -> getAllUsers() [static]
  ├─ GET    /api/users/:id -> getUserById() [static]
  ├─ POST   /api/users/ -> createUser() [static]
[RestController] AdminController -> /api/admin
  ├─ GET    /api/admin/dashboard -> getDashboard() [static]
  ├─ GET    /api/admin/logs -> getLogs() [static]
[AppConfig] 所有控制器注册完成
🚀 Server is running on http://localhost:3000
```

## 步骤 3: 测试 API

### 在浏览器中访问

- http://localhost:3000/api/hello
- http://localhost:3000/api/status
- http://localhost:3000/api/users
- http://localhost:3000/api/admin/dashboard

### 使用 curl

```bash
# 获取欢迎消息
curl http://localhost:3000/api/hello

# 获取所有用户
curl http://localhost:3000/api/users

# 获取指定用户
curl http://localhost:3000/api/users/1

# 创建用户
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{"name":"David","email":"david@example.com"}'

# 管理员仪表板
curl http://localhost:3000/api/admin/dashboard
```

### 使用 PowerShell（Windows）

```powershell
# 获取欢迎消息
Invoke-RestMethod http://localhost:3000/api/hello

# 获取所有用户
Invoke-RestMethod http://localhost:3000/api/users

# 创建用户
Invoke-RestMethod -Method POST -Uri http://localhost:3000/api/users `
  -ContentType "application/json" `
  -Body '{"name":"David","email":"david@example.com"}'
```

## 🎯 预期响应

### GET /api/hello

```json
{
  "message": "Hello from standalone Hono server!",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "framework": "Hono + hono-decorator",
  "runtime": "Node.js (no Vite)"
}
```

### GET /api/users

```json
{
  "success": true,
  "data": [
    { "id": 1, "name": "Alice", "email": "alice@example.com" },
    { "id": 2, "name": "Bob", "email": "bob@example.com" },
    { "id": 3, "name": "Charlie", "email": "charlie@example.com" }
  ],
  "total": 3
}
```

### POST /api/users

```json
{
  "success": true,
  "message": "User created",
  "data": {
    "id": 4,
    "name": "David",
    "email": "david@example.com"
  }
}
```

## 🔧 故障排除

### 端口已被占用

如果看到 `EADDRINUSE` 错误，修改 `src/server/index.ts` 中的端口：

```typescript
const port = 3001;  // 改为其他端口
```

### 控制器未加载

确保：
1. 控制器文件在 `src/server/controllers/` 目录下
2. 使用了 `@RestController` 装饰器
3. 文件扩展名是 `.ts` 或 `.js`

### TypeScript 错误

运行：

```bash
npm run build
```

查看详细的编译错误。

## 📝 下一步

- 添加更多控制器
- 实现数据库连接
- 添加身份验证
- 添加日志系统
- 部署到生产环境

祝你使用愉快！🎉

