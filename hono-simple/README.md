# Hono with hono-decorator

使用 Spring Boot 风格的装饰器路由的 Hono 项目。

## 📁 项目结构

```
hono-simple/
├── src/
│   └── server/
│       ├── index.ts              # 服务器入口
│       └── controllers/          # 控制器目录
│           ├── HomeController.ts # 首页控制器
│           └── ApiController.ts  # API 控制器
├── package.json
├── tsconfig.json
└── README.md
```

## 🚀 快速开始

### 安装依赖

```bash
npm install
```

### 开发模式

```bash
npm run dev
```

服务器将在 http://localhost:3001 启动

## 📡 API 端点

### HomeController

- `GET /` - 首页
- `GET /about` - 关于信息

### ApiController

- `GET /api/messages` - 获取所有消息
- `POST /api/messages` - 创建新消息
- `GET /api/health` - 健康检查

## 🧪 测试 API

```bash
# 获取首页
curl http://localhost:3001/

# 获取关于信息
curl http://localhost:3001/about

# 获取所有消息
curl http://localhost:3001/api/messages

# 创建消息
curl -X POST http://localhost:3001/api/messages \
  -H "Content-Type: application/json" \
  -d '{"text":"Hello World"}'

# 健康检查
curl http://localhost:3001/api/health
```

## ✨ 特性

- ✅ **零配置** - 自动扫描 `src/server/controllers` 目录
- ✅ **装饰器路由** - Spring Boot 风格的装饰器
- ✅ **自动注册** - 控制器自动注册
- ✅ **类型安全** - 完整的 TypeScript 支持
- ✅ **热重载** - 开发模式下自动重启
