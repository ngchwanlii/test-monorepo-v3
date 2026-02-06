import { beforeEach, describe, expect, it } from 'vitest';

import { TodoRepository } from '../src/repositories/todo-repository.js';
import { TodoService } from '../src/services/todo-service.js';
import { createInMemoryDb } from './test-utils.js';
import { NotFoundError } from '../src/errors.js';

let service: TodoService;

describe('TodoService', () => {
  beforeEach(async () => {
    const db = await createInMemoryDb();
    const repository = new TodoRepository(db);
    service = new TodoService(repository);
  });

  it('creates and lists todos', async () => {
    const todo = await service.create({ title: 'Integration Test' });
    expect(todo.id).toBeDefined();

    const todos = await service.list('all');
    expect(todos).toHaveLength(1);
    expect(todos[0]?.title).toBe('Integration Test');
  });

  it('updates and toggles completion state', async () => {
    const todo = await service.create({ title: 'Toggle me' });
    const updated = await service.update(todo.id, { description: 'Updated description' });
    expect(updated.description).toBe('Updated description');

    const toggled = await service.toggle(todo.id);
    expect(toggled.completed).toBe(true);
  });

  it('throws NotFoundError when deleting missing todo', async () => {
    await expect(service.delete('00000000-0000-0000-0000-000000000000')).rejects.toBeInstanceOf(
      NotFoundError,
    );
  });
});
