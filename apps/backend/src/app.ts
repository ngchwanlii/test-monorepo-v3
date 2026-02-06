import { performance } from 'node:perf_hooks';

import { Hono } from 'hono';
import { cors } from 'hono/cors';

import { getConfig } from './config.js';
import { createDbConnection } from './db/client.js';
import { AppError } from './errors.js';
import { sendError } from './http/response.js';
import { logger as defaultLogger } from './logger.js';
import { TodoRepository } from './repositories/todo-repository.js';
import { createHealthRoutes } from './routes/health.js';
import { createTodoRoutes } from './routes/todos.js';
import { TodoService } from './services/todo-service.js';
import type { AppEnv } from './types.js';

export type AppDependencies = {
  todoService?: TodoService;
};

export const createApp = (deps: AppDependencies = {}) => {
  const app = new Hono<AppEnv>();
  const config = getConfig();
  const appLogger = defaultLogger;
  const todoService =
    deps.todoService ?? new TodoService(new TodoRepository(createDbConnection(config.DATABASE_URL)));

  const allowedOrigins = config.CORS_ALLOWED_ORIGINS.split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  if (allowedOrigins.length > 0) {
    app.use(
      '*',
      cors({
        origin: allowedOrigins,
        allowMethods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
        allowHeaders: ['Content-Type'],
      }),
    );
  }

  app.use('*', async (c, next) => {
    c.set('logger', appLogger);
    c.set('todoService', todoService);
    const start = performance.now();
    try {
      await next();
      const duration = Number((performance.now() - start).toFixed(2));
      appLogger.info(
        {
          method: c.req.method,
          path: c.req.path,
          status: c.res.status,
          durationMs: duration,
        },
        'request completed',
      );
    } catch (error) {
      appLogger.error(
        {
          err: error,
          method: c.req.method,
          path: c.req.path,
        },
        'request failed',
      );
      throw error;
    }
  });

  app.route('/', createHealthRoutes(appLogger));
  app.route('/todos', createTodoRoutes());

  app.notFound((c) => sendError(c, 404, 'Route not found'));
  app.onError((err, c) => {
    if (err instanceof AppError) {
      return sendError(c, err.status, err.message, err.details);
    }

    appLogger.error({ err }, 'Unhandled application error');
    return sendError(c, 500, 'Internal server error');
  });

  return app;
};
