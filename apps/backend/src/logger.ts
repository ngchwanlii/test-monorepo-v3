import pinoLogger from 'pino';

const isTest = process.env.NODE_ENV === 'test';

export const logger = pinoLogger({
  level: process.env.LOG_LEVEL ?? (isTest ? 'silent' : 'info'),
  base: undefined,
});

export type Logger = typeof logger;
