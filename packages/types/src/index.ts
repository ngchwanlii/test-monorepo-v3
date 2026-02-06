import { z } from 'zod';

export const todoIdSchema = z.string().uuid({ message: 'id must be a valid UUID' });

export const todoTitleSchema = z
  .string({ required_error: 'title is required' })
  .trim()
  .min(3, { message: 'title must be at least 3 characters' })
  .max(120, { message: 'title must be 120 characters or fewer' });

export const todoDescriptionSchema = z
  .union([z.string().trim().max(1000, { message: 'description must be 1000 characters or fewer' }), z.null()])
  .optional()
  .transform((value) => {
    if (value === undefined) return undefined;
    if (value === null || value === '') return null;
    return value;
  });

const isoTimestampSchema = z
  .string()
  .refine((value) => !Number.isNaN(Date.parse(value)), {
    message: 'timestamp must be a valid ISO 8601 string',
  });

export const todoDueDateSchema = z
  .union([z.string().trim(), z.null()])
  .optional()
  .refine((value) => {
    if (value === undefined || value === null || value === '') {
      return true;
    }

    return !Number.isNaN(Date.parse(value));
  }, 'dueDate must be a valid ISO 8601 string')
  .transform((value) => {
    if (value === undefined) return undefined;
    if (value === null || value === '') return null;
    return value;
  });

export const todoSchema = z.object({
  id: todoIdSchema,
  title: todoTitleSchema,
  description: z.string().max(1000).nullish(),
  dueDate: z.string().nullish(),
  completed: z.boolean(),
  createdAt: isoTimestampSchema,
  updatedAt: isoTimestampSchema,
});

export const createTodoInputSchema = z
  .object({
    title: todoTitleSchema,
    description: todoDescriptionSchema,
    dueDate: todoDueDateSchema,
  })
  .strict();

export const updateTodoInputSchema = z
  .object({
    title: todoTitleSchema.optional(),
    description: todoDescriptionSchema,
    dueDate: todoDueDateSchema,
    completed: z.boolean().optional(),
  })
  .strict()
  .refine((value) => Object.keys(value).length > 0, {
    message: 'At least one field must be provided',
  });

export const todoStatusFilterSchema = z.enum(['all', 'active', 'completed']);

export type Todo = z.infer<typeof todoSchema>;
export type CreateTodoInput = z.infer<typeof createTodoInputSchema>;
export type UpdateTodoInput = z.infer<typeof updateTodoInputSchema>;
export type TodoStatusFilter = z.infer<typeof todoStatusFilterSchema>;
