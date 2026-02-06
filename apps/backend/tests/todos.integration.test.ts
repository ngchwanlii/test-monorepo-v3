import { describe, expect, it, beforeEach } from 'vitest';

import { createApp } from '../src/app.js';
import { TodoRepository } from '../src/repositories/todo-repository.js';
import { TodoService } from '../src/services/todo-service.js';
import { createInMemoryDb } from './test-utils.js';

let app: ReturnType<typeof createApp>;

describe('Todos API integration', () => {
  beforeEach(async () => {
    const db = await createInMemoryDb();
    const repository = new TodoRepository(db);
    const service = new TodoService(repository);
    app = createApp({ todoService: service });
  });

  it('performs CRUD lifecycle', async () => {
    const createResponse = await app.request('/todos', {
      method: 'POST',
      body: JSON.stringify({ title: 'Write integration tests' }),
      headers: { 'Content-Type': 'application/json' },
    });
    expect(createResponse.status).toBe(201);
    const createdBody = await createResponse.json();
    const todoId = createdBody.data.id;

    const listResponse = await app.request('/todos');
    expect(listResponse.status).toBe(200);
    const listBody = await listResponse.json();
    expect(listBody.data).toHaveLength(1);

    const updateResponse = await app.request(`/todos/${todoId}`, {
      method: 'PATCH',
      body: JSON.stringify({ description: 'Updated via integration test' }),
      headers: { 'Content-Type': 'application/json' },
    });
    expect(updateResponse.status).toBe(200);

    const toggleResponse = await app.request(`/todos/${todoId}/toggle`, { method: 'PATCH' });
    expect(toggleResponse.status).toBe(200);
    const toggledBody = await toggleResponse.json();
    expect(toggledBody.data.completed).toBe(true);

    const deleteResponse = await app.request(`/todos/${todoId}`, { method: 'DELETE' });
    expect(deleteResponse.status).toBe(204);
  });

  it('applies the configured CORS allow list', async () => {
    const allowedResponse = await app.request('/todos', {
      method: 'GET',
      headers: {
        Origin: 'http://localhost:3000',
      },
    });

    expect(allowedResponse.headers.get('access-control-allow-origin')).toBe('http://localhost:3000');

    const blockedResponse = await app.request('/todos', {
      method: 'GET',
      headers: {
        Origin: 'https://malicious.example.com',
      },
    });

    expect(blockedResponse.headers.get('access-control-allow-origin')).toBeNull();
  });
});
