import fs from 'node:fs';
import path from 'node:path';

import { config as loadEnv } from 'dotenv';
import { z } from 'zod';

const candidateEnvFiles = [
  path.resolve(process.cwd(), '.env'),
  path.resolve(process.cwd(), '.env.local'),
  path.resolve(process.cwd(), '..', '.env'),
  path.resolve(process.cwd(), '..', '.env.local'),
  path.resolve(process.cwd(), '..', '..', '.env'),
];

for (const file of candidateEnvFiles) {
  if (fs.existsSync(file)) {
    loadEnv({ path: file, override: false });
  }
}

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3001),
  DATABASE_URL: z.string().default('file:./data/app.db'),
  CORS_ALLOWED_ORIGINS: z.string().default('http://localhost:3000,exp://localhost'),
});

type Env = z.infer<typeof envSchema>;

let cachedConfig: Env | null = null;

export const getConfig = (): Env => {
  if (cachedConfig) {
    return cachedConfig;
  }

  cachedConfig = envSchema.parse(process.env);
  return cachedConfig;
};
