import { index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const todos = sqliteTable(
  'todos',
  {
    id: text('id').primaryKey(),
    title: text('title', { length: 120 }).notNull(),
    description: text('description', { length: 1000 }),
    dueDate: text('due_date'),
    completed: integer('completed', { mode: 'boolean' }).notNull().default(false),
    createdAt: text('created_at').notNull(),
    updatedAt: text('updated_at').notNull(),
  },
  (table) => ({
    createdAtIdx: index('todos_created_at_idx').on(table.createdAt),
    completedIdx: index('todos_completed_idx').on(table.completed),
  }),
);

export type TodoRow = typeof todos.$inferSelect;
export type InsertTodoRow = typeof todos.$inferInsert;
