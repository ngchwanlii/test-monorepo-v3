import { Hono } from 'hono';

import { sendSuccess } from '../http/response.js';
import type { Logger } from '../logger.js';
import type { AppEnv } from '../types.js';

export const createHealthRoutes = (logger: Logger) => {
  const router = new Hono<AppEnv>();

  router.get('/health', (c) => {
    logger.debug('health check invoked');
    return sendSuccess(c, { status: 'ok', timestamp: new Date().toISOString() });
  });

  return router;
};
