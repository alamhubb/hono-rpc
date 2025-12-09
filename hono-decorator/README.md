# hono-decorator

🎨 Decorator-based routing for [Hono](https://hono.dev/) - Bring NestJS-style decorators to Hono framework.

## Features

- ✨ **NestJS-style Decorators** - Familiar decorator syntax for defining routes
- 🚀 **Type-safe** - Full TypeScript support with type inference
- 🎯 **Parameter Decorators** - Extract query, body, headers, cookies easily
- 🔥 **Zero Dependencies** - Only requires Hono and reflect-metadata
- 📦 **Lightweight** - Minimal overhead, maximum performance

## Installation

```bash
npm install hono-decorator hono reflect-metadata
```

## Quick Start

### 1. Enable Decorators

Make sure your `tsconfig.json` has these settings:

```json
{
  "compilerOptions": {
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true
  }
}
```

### 2. Import reflect-metadata

At the top of your entry file:

```typescript
import 'reflect-metadata';
```

### 3. Create a Controller

```typescript
import { Controller, Get, Post, Query, Body } from 'hono-decorator';

@Controller('/api/users')
export class UserController {
  @Get('/')
  async getUsers(
    @Query('page') page: string,
    @Query('limit') limit: string
  ) {
    return {
      users: [],
      page: parseInt(page || '1'),
      limit: parseInt(limit || '10')
    };
  }

  @Post('/')
  async createUser(@Body() body: any) {
    return {
      success: true,
      user: body
    };
  }

  @Get('/:id')
  async getUser(@Param('id') id: string) {
    return {
      id,
      name: 'John Doe'
    };
  }
}
```

### 4. Register Routes

```typescript
import { Hono } from 'hono';
import { RouteBuilder } from 'hono-decorator';
import { UserController } from './controllers/user.controller';

const app = new Hono();

// Register all controllers
RouteBuilder.buildRoutes(app, [
  UserController
]);

export default app;
```

## API Reference

### Class Decorators

#### `@Controller(prefix?: string)`

Define a controller with an optional route prefix.

```typescript
@Controller('/api')
export class ApiController {
  // Routes will be prefixed with /api
}
```

### Method Decorators

#### HTTP Methods

- `@Get(path?: string)` - Handle GET requests
- `@Post(path?: string)` - Handle POST requests
- `@Put(path?: string)` - Handle PUT requests
- `@Delete(path?: string)` - Handle DELETE requests
- `@Patch(path?: string)` - Handle PATCH requests
- `@All(path?: string)` - Handle all HTTP methods

```typescript
@Get('/users')
async getUsers() {
  return { users: [] };
}

@Post('/users')
async createUser() {
  return { success: true };
}
```

### Parameter Decorators

#### `@Ctx()`

Inject the Hono context object.

```typescript
@Get('/')
async handler(@Ctx() c: Context) {
  return c.json({ message: 'Hello' });
}
```

#### `@Query(key?: string)`

Extract query parameters.

```typescript
@Get('/search')
async search(
  @Query('q') query: string,
  @Query('page') page: string
) {
  return { query, page };
}
```

#### `@Param(key: string)`

Extract route parameters.

```typescript
@Get('/:id')
async getById(@Param('id') id: string) {
  return { id };
}
```

#### `@Body()`

Extract request body (automatically parsed as JSON).

```typescript
@Post('/')
async create(@Body() body: any) {
  return { received: body };
}
```

#### `@Header(key: string)`

Extract request headers.

```typescript
@Get('/')
async handler(@Header('authorization') auth: string) {
  return { auth };
}
```

#### `@Cookie(key: string)`

Extract cookies.

```typescript
@Get('/')
async handler(@Cookie('session') session: string) {
  return { session };
}
```

#### `@Req()`

Inject the raw request object.

```typescript
@Get('/')
async handler(@Req() req: Request) {
  return { url: req.url };
}
```

## Advanced Usage

### Multiple Controllers

```typescript
RouteBuilder.buildRoutes(app, [
  UserController,
  PostController,
  CommentController
]);
```

### Error Handling

The RouteBuilder automatically wraps handlers with try-catch and returns appropriate error responses.

## License

MIT

