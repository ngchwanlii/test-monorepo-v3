import type {
  CreateTodoInput,
  Todo,
  TodoStatusFilter,
  UpdateTodoInput,
} from '@test-monorepo/types';
import { todoStatusFilterSchema } from '@test-monorepo/types';
import { desc, eq } from 'drizzle-orm';
import { uuidv7 } from 'uuidv7';

import type { DatabaseClient } from '../db/client.js';
import { todos } from '../db/schema.js';
import type { InsertTodoRow } from '../db/schema.js';

export class TodoRepository {
  constructor(private readonly db: DatabaseClient) {}

  async list(status: TodoStatusFilter = 'all'): Promise<Todo[]> {
    const parsedStatus = todoStatusFilterSchema.parse(status);

    let query = this.db.select().from(todos);
    if (parsedStatus !== 'all') {
      query = query.where(eq(todos.completed, parsedStatus === 'completed'));
    }

    const rows = await query.orderBy(desc(todos.createdAt));

    return rows.map(mapRowToDomain);
  }

  async findById(id: string): Promise<Todo | null> {
    const [row] = await this.db.select().from(todos).where(eq(todos.id, id)).limit(1);
    return row ? mapRowToDomain(row) : null;
  }

  async create(input: CreateTodoInput): Promise<Todo> {
    const now = new Date().toISOString();
    const record: InsertTodoRow = {
      id: uuidv7(),
      title: input.title,
      description: input.description ?? null,
      dueDate: input.dueDate ?? null,
      completed: false,
      createdAt: now,
      updatedAt: now,
    };

    const [row] = await this.db.insert(todos).values(record).returning();
    return mapRowToDomain(row);
  }

  async update(id: string, patch: UpdateTodoInput): Promise<Todo | null> {
    const now = new Date().toISOString();
    const updates: Partial<InsertTodoRow> = {
      updatedAt: now,
    };

    if (Object.prototype.hasOwnProperty.call(patch, 'title') && patch.title !== undefined) {
      updates.title = patch.title;
    }

    if (Object.prototype.hasOwnProperty.call(patch, 'description')) {
      updates.description = patch.description ?? null;
    }

    if (Object.prototype.hasOwnProperty.call(patch, 'dueDate')) {
      updates.dueDate = patch.dueDate ?? null;
    }

    if (Object.prototype.hasOwnProperty.call(patch, 'completed') && patch.completed !== undefined) {
      updates.completed = patch.completed;
    }

    const [row] = await this.db.update(todos).set(updates).where(eq(todos.id, id)).returning();

    return row ? mapRowToDomain(row) : null;
  }

  async toggle(id: string): Promise<Todo | null> {
    const existing = await this.findById(id);
    if (!existing) {
      return null;
    }

    return this.update(id, { completed: !existing.completed });
  }

  async delete(id: string): Promise<boolean> {
    const deleted = await this.db.delete(todos).where(eq(todos.id, id)).returning({ id: todos.id });
    return deleted.length > 0;
  }
}

const mapRowToDomain = (row: typeof todos.$inferSelect): Todo => ({
  id: row.id,
  title: row.title,
  description: row.description,
  dueDate: row.dueDate,
  completed: !!row.completed,
  createdAt: row.createdAt,
  updatedAt: row.updatedAt,
});
