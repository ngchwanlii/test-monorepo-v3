import { zValidator } from '@hono/zod-validator';
import {
  createTodoInputSchema,
  todoStatusFilterSchema,
  updateTodoInputSchema,
} from '@test-monorepo/types';
import { Hono } from 'hono';
import type { Context } from 'hono';
import type { SafeParseReturnType } from 'zod';

import { sendError, sendSuccess } from '../http/response.js';
import type { AppEnv } from '../types.js';

export const createTodoRoutes = () => {
  const router = new Hono<AppEnv>();

  router.get('/', async (c) => {
    const parsedStatus = todoStatusFilterSchema.safeParse(c.req.query('status') ?? 'all');
    if (!parsedStatus.success) {
      return sendError(c, 400, 'Invalid status filter', parsedStatus.error.flatten());
    }

    const todos = await c.get('todoService').list(parsedStatus.data);
    return sendSuccess(c, todos);
  });

  router.get('/:id', async (c) => {
    const todo = await c.get('todoService').getById(c.req.param('id'));
    return sendSuccess(c, todo);
  });

  router.post(
    '/',
    zValidator('json', createTodoInputSchema, validationHook),
    async (c) => {
      const payload = c.req.valid('json');
      const todo = await c.get('todoService').create(payload);
      return sendSuccess(c, todo, 201);
    },
  );

  router.patch(
    '/:id',
    zValidator('json', updateTodoInputSchema, validationHook),
    async (c) => {
      const payload = c.req.valid('json');
      const todo = await c.get('todoService').update(c.req.param('id'), payload);
      return sendSuccess(c, todo);
    },
  );

  router.patch('/:id/toggle', async (c) => {
    const todo = await c.get('todoService').toggle(c.req.param('id'));
    return sendSuccess(c, todo);
  });

  router.delete('/:id', async (c) => {
    await c.get('todoService').delete(c.req.param('id'));
    return c.body(null, 204);
  });

  return router;
};

const validationHook = <T>(result: SafeParseReturnType<T, T>, c: Context) => {
  if (!result.success) {
    return sendError(c, 400, 'Validation error', result.error.flatten());
  }
};
