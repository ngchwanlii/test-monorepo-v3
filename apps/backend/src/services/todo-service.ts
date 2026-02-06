import type {
  CreateTodoInput,
  Todo,
  TodoStatusFilter,
  UpdateTodoInput,
} from '@test-monorepo/types';
import { todoIdSchema, todoStatusFilterSchema } from '@test-monorepo/types';

import { DomainValidationError, NotFoundError } from '../errors.js';
import type { TodoRepository } from '../repositories/todo-repository.js';

export class TodoService {
  constructor(private readonly repository: TodoRepository) {}

  async list(status: TodoStatusFilter = 'all'): Promise<Todo[]> {
    const parsed = todoStatusFilterSchema.parse(status);
    return this.repository.list(parsed);
  }

  async getById(id: string): Promise<Todo> {
    const parsedId = this.parseId(id);
    const todo = await this.repository.findById(parsedId);
    if (!todo) {
      throw new NotFoundError('Todo not found');
    }

    return todo;
  }

  async create(input: CreateTodoInput): Promise<Todo> {
    return this.repository.create(input);
  }

  async update(id: string, patch: UpdateTodoInput): Promise<Todo> {
    const parsedId = this.parseId(id);
    const updated = await this.repository.update(parsedId, patch);
    if (!updated) {
      throw new NotFoundError('Todo not found');
    }

    return updated;
  }

  async toggle(id: string): Promise<Todo> {
    const parsedId = this.parseId(id);
    const toggled = await this.repository.toggle(parsedId);
    if (!toggled) {
      throw new NotFoundError('Todo not found');
    }

    return toggled;
  }

  async delete(id: string): Promise<void> {
    const parsedId = this.parseId(id);
    const deleted = await this.repository.delete(parsedId);
    if (!deleted) {
      throw new NotFoundError('Todo not found');
    }
  }

  private parseId(id: string) {
    const result = todoIdSchema.safeParse(id);
    if (!result.success) {
      throw new DomainValidationError('Invalid todo id', result.error.flatten());
    }

    return result.data;
  }
}
