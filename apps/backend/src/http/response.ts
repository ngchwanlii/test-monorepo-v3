import type { Context } from 'hono';

export type ApiSuccessResponse<T> = {
  data: T;
  error: null;
};

export type ApiErrorResponse = {
  data: null;
  error: {
    message: string;
    details?: unknown;
  };
};

export const sendSuccess = <T>(c: Context, data: T, status = 200) =>
  c.json<ApiSuccessResponse<T>>({ data, error: null }, status);

export const sendError = (c: Context, status: number, message: string, details?: unknown) =>
  c.json<ApiErrorResponse>({ data: null, error: { message, details } }, status);
