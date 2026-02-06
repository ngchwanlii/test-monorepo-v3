import path from 'node:path';

import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';

import * as schema from '../src/db/schema.js';

export const createInMemoryDb = async () => {
  const sqlite = new Database(':memory:');
  const db = drizzle(sqlite, { schema });
  await migrate(db, { migrationsFolder: path.resolve(process.cwd(), 'drizzle') });
  return db;
};
