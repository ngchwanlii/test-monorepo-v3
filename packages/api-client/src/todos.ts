import type { CreateTodoInput, Todo, TodoStatusFilter, UpdateTodoInput } from '@test-monorepo/types';
import {
  createTodoInputSchema,
  todoSchema,
  todoStatusFilterSchema,
  updateTodoInputSchema,
} from '@test-monorepo/types';
import { z } from 'zod';

import type { ApiClient } from './http-client.js';
import { createApiClient } from './http-client.js';

const envelopeSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({
    data: dataSchema,
    error: z.unknown().optional(),
  });

const listSchema = envelopeSchema(todoSchema.array());
const singleSchema = envelopeSchema(todoSchema);

type ListTodosOptions = {
  status?: TodoStatusFilter;
};

export class TodoApi {
  constructor(private readonly client: ApiClient) {}

  async listTodos(options: ListTodosOptions = {}): Promise<Todo[]> {
    const status = options.status ?? 'all';
    const parsedStatus = todoStatusFilterSchema.parse(status);

    return this.client.request<{ data: Todo[] }>({
      method: 'GET',
      path: '/todos',
      query: { status: parsedStatus },
      schema: listSchema,
    }).then((result) => result.data);
  }

  async getTodo(id: string): Promise<Todo> {
    return this.client
      .request<{ data: Todo }>({
        method: 'GET',
        path: `/todos/${id}`,
        schema: singleSchema,
      })
      .then((result) => result.data);
  }

  async createTodo(payload: CreateTodoInput): Promise<Todo> {
    const body = createTodoInputSchema.parse(payload);

    return this.client
      .request<{ data: Todo }>({
        method: 'POST',
        path: '/todos',
        body,
        schema: singleSchema,
        retryable: false,
      })
      .then((result) => result.data);
  }

  async updateTodo(id: string, payload: UpdateTodoInput): Promise<Todo> {
    const body = updateTodoInputSchema.parse(payload);

    return this.client
      .request<{ data: Todo }>({
        method: 'PATCH',
        path: `/todos/${id}`,
        body,
        schema: singleSchema,
        retryable: false,
      })
      .then((result) => result.data);
  }

  async toggleTodo(id: string): Promise<Todo> {
    return this.client
      .request<{ data: Todo }>({
        method: 'PATCH',
        path: `/todos/${id}/toggle`,
        schema: singleSchema,
        retryable: false,
      })
      .then((result) => result.data);
  }

  async deleteTodo(id: string): Promise<void> {
    await this.client.request({
      method: 'DELETE',
      path: `/todos/${id}`,
      retryable: false,
    });
  }
}

const defaultClient = createApiClient();
export const todoApi = new TodoApi(defaultClient);
export const createTodoApi = (client?: ApiClient) => new TodoApi(client ?? createApiClient());
export type { ListTodosOptions };
