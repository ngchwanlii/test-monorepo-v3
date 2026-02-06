import { serve } from '@hono/node-server';

import { createApp } from './app.js';
import { getConfig } from './config.js';
import { logger } from './logger.js';

const app = createApp();
const { PORT } = getConfig();

serve({
  fetch: app.fetch,
  port: PORT,
});

logger.info({ port: PORT }, 'Backend server listening');
