import type { Todo } from '@test-monorepo/types';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ApiError, TodoApi, createApiClient } from '../src/index.js';

const buildTodo = (overrides: Partial<Todo> = {}): Todo => ({
  id: '38ae6fd5-5fe6-4cf8-9e6e-9d370c1f1111',
  title: 'Test todo',
  description: null,
  dueDate: null,
  completed: false,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides,
});

describe('TodoApi client', () => {
  const fetchMock = vi.fn<Parameters<typeof fetch>, ReturnType<typeof fetch>>();
  let api: TodoApi;

  beforeEach(() => {
    fetchMock.mockReset();
    api = new TodoApi(
      createApiClient({
        baseUrl: 'http://localhost:3001',
        fetchFn: fetchMock as typeof fetch,
      }),
    );
  });

  it('lists todos with query params and parses envelope', async () => {
    const todo = buildTodo();
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ data: [todo] }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );

    const todos = await api.listTodos({ status: 'active' });

    expect(todos).toEqual([todo]);
    const [url] = fetchMock.mock.calls[0] ?? [];
    expect(String(url)).toContain('status=active');
  });

  it('throws ApiError when server responds with error', async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ error: { message: 'Not found' } }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      }),
    );

    await expect(api.getTodo('missing')).rejects.toBeInstanceOf(ApiError);
  });

  it('validates payload before sending create request', async () => {
    await expect(api.createTodo({ title: 'x' })).rejects.toThrowError();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('retries GET requests with exponential backoff', async () => {
    const todo = buildTodo({ id: 'c40af9fd-5bdd-42a5-9048-07b1fd1b9e16' });
    fetchMock
      .mockResolvedValueOnce(new Response(JSON.stringify({ error: 'boom' }), { status: 500 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ error: 'boom' }), { status: 502 }))
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ data: [todo] }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
      );

    vi.useFakeTimers();
    const promise = api.listTodos();
    await vi.runAllTimersAsync();
    await expect(promise).resolves.toEqual([todo]);
    vi.useRealTimers();
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });
});
