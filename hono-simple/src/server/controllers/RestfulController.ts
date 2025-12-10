import { 
  RestController, 
  RequestMapping, 
  GetMapping, 
  PostMapping, 
  PutMapping, 
  DeleteMapping, 
  PatchMapping 
} from 'hono-class';
import type { Context } from 'hono';

interface Todo {
  id: number;
  title: string;
  completed: boolean;
}

@RestController
@RequestMapping('/api/todos')
export class RestfulController {
  private static todos: Todo[] = [
    { id: 1, title: 'Learn Hono', completed: false },
    { id: 2, title: 'Learn hono-class', completed: false },
  ];

  private static nextId = 3;

  /**
   * GET /api/todos - 获取所有待办事项
   */
  @GetMapping('')
  static getAllTodos(c: Context) {
    return c.json({
      success: true,
      data: this.todos,
      total: this.todos.length
    });
  }

  /**
   * GET /api/todos/:id - 获取单个待办事项
   */
  @GetMapping('/:id')
  static getTodoById(c: Context) {
    const id = parseInt(c.req.param('id'));
    const todo = this.todos.find(t => t.id === id);

    if (!todo) {
      return c.json({ success: false, message: 'Todo not found' }, 404);
    }

    return c.json({ success: true, data: todo });
  }

  /**
   * POST /api/todos - 创建新待办事项
   */
  @PostMapping('')
  static async createTodo(body: { title: string }, c: Context) {
    const todo: Todo = {
      id: this.nextId++,
      title: body.title,
      completed: false
    };

    this.todos.push(todo);

    return c.json({
      success: true,
      message: 'Todo created',
      data: todo
    }, 201);
  }

  /**
   * PUT /api/todos/:id - 完全更新待办事项
   */
  @PutMapping('/:id')
  static async updateTodo(body: { title: string; completed: boolean }, c: Context) {
    const id = parseInt(c.req.param('id'));
    const index = this.todos.findIndex(t => t.id === id);

    if (index === -1) {
      return c.json({ success: false, message: 'Todo not found' }, 404);
    }

    this.todos[index] = {
      id,
      title: body.title,
      completed: body.completed
    };

    return c.json({
      success: true,
      message: 'Todo updated',
      data: this.todos[index]
    });
  }

  /**
   * PATCH /api/todos/:id - 部分更新待办事项
   */
  @PatchMapping('/:id')
  static async patchTodo(body: Partial<{ title: string; completed: boolean }>, c: Context) {
    const id = parseInt(c.req.param('id'));
    const todo = this.todos.find(t => t.id === id);

    if (!todo) {
      return c.json({ success: false, message: 'Todo not found' }, 404);
    }

    if (body.title !== undefined) {
      todo.title = body.title;
    }
    if (body.completed !== undefined) {
      todo.completed = body.completed;
    }

    return c.json({
      success: true,
      message: 'Todo patched',
      data: todo
    });
  }

  /**
   * DELETE /api/todos/:id - 删除待办事项
   */
  @DeleteMapping('/:id')
  static deleteTodo(c: Context) {
    const id = parseInt(c.req.param('id'));
    const index = this.todos.findIndex(t => t.id === id);

    if (index === -1) {
      return c.json({ success: false, message: 'Todo not found' }, 404);
    }

    const deleted = this.todos.splice(index, 1)[0];

    return c.json({
      success: true,
      message: 'Todo deleted',
      data: deleted
    });
  }
}

