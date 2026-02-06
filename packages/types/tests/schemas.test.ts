import { describe, expect, it } from 'vitest';

import {
  createTodoInputSchema,
  todoDueDateSchema,
  todoTitleSchema,
  updateTodoInputSchema,
} from '../src/index.js';

describe('todo schemas', () => {
  it('enforces title length boundaries', () => {
    expect(() => todoTitleSchema.parse('ab')).toThrowError(/at least 3/i);
    expect(() => todoTitleSchema.parse('a'.repeat(121))).toThrowError(/120 characters or fewer/i);
    expect(todoTitleSchema.parse('Valid Title')).toBe('Valid Title');
  });

  it('enforces description max length on create', () => {
    const result = createTodoInputSchema.safeParse({
      title: 'Valid',
      description: 'a'.repeat(1001),
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toMatch(/1000 characters or fewer/i);
    }
  });

  it('validates optional ISO dueDate', () => {
    expect(todoDueDateSchema.parse(undefined)).toBeUndefined();
    expect(todoDueDateSchema.parse('')).toBeNull();
    expect(todoDueDateSchema.parse(null)).toBeNull();
    expect(todoDueDateSchema.parse('2024-05-01T10:00:00.000Z')).toBe('2024-05-01T10:00:00.000Z');
    expect(() => todoDueDateSchema.parse('not-a-date')).toThrowError(/ISO 8601/i);
  });

  it('requires at least one field when updating', () => {
    const empty = updateTodoInputSchema.safeParse({});
    expect(empty.success).toBe(false);

    const valid = updateTodoInputSchema.safeParse({ title: 'Updated title' });
    expect(valid.success).toBe(true);
  });
});
