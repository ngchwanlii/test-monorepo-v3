import fs from 'node:fs';
import path from 'node:path';

import Database from 'better-sqlite3';
import { drizzle, type BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';

import * as schema from './schema.js';

export type DatabaseClient = BetterSQLite3Database<typeof schema>;

export const createDbConnection = (url: string): DatabaseClient => {
  const resolvedPath = resolveSqlitePath(url);
  const sqlite = new Database(resolvedPath);
  sqlite.pragma('journal_mode = WAL');
  return drizzle(sqlite, { schema });
};

const resolveSqlitePath = (url: string): string => {
  if (url === ':memory:' || url.startsWith('file::memory')) {
    return ':memory:';
  }

  const cleaned = url.startsWith('file:') ? url.replace('file:', '') : url;
  const absolutePath = path.isAbsolute(cleaned)
    ? cleaned
    : path.resolve(process.cwd(), cleaned);

  fs.mkdirSync(path.dirname(absolutePath), { recursive: true });
  return absolutePath;
};
