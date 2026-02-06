import type { ZodType } from 'zod';

const ENV_KEYS = [
  'API_BASE_URL',
  'VITE_API_BASE_URL',
  'NEXT_PUBLIC_API_BASE_URL',
  'PUBLIC_API_BASE_URL',
  'EXPO_PUBLIC_API_BASE_URL',
];

type FetchLike = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;

type ApiRequestOptions<TResponse> = {
  path: string;
  method: string;
  body?: unknown;
  headers?: Record<string, string>;
  query?: Record<string, string | number | boolean | undefined>;
  schema?: ZodType<TResponse>;
  retryable?: boolean;
};

type RetryPolicy = {
  maxAttempts: number;
  initialDelayMs: number;
};

export type ApiClientOptions = {
  baseUrl?: string;
  fetchFn?: FetchLike;
  retryPolicy?: Partial<RetryPolicy>;
};

export type ApiErrorContext = {
  method: string;
  path: string;
  status: number;
  body?: unknown;
};

export class ApiError extends Error {
  public readonly status: number;
  public readonly payload: unknown;
  public readonly context: ApiErrorContext;

  constructor(message: string, context: ApiErrorContext, cause?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = context.status;
    this.payload = context.body;
    this.context = context;
    this.cause = cause instanceof Error ? cause : undefined;
  }
}

const defaultRetryPolicy: RetryPolicy = {
  maxAttempts: 3,
  initialDelayMs: 150,
};

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

declare global {
  // eslint-disable-next-line no-var
  var __APP_API_BASE_URL__: string | undefined;
}

const resolveBaseUrl = (provided?: string): string => {
  if (provided) return provided;

  const globalAny = globalThis as typeof globalThis & { __APP_API_BASE_URL__?: string };
  const env = typeof process !== 'undefined' ? process.env : globalAny?.process?.env;

  for (const key of ENV_KEYS) {
    const value = env?.[key];
    if (value) return value;
  }

  if (globalAny.__APP_API_BASE_URL__) {
    return globalAny.__APP_API_BASE_URL__;
  }

  return 'http://localhost:3001';
};

export class ApiClient {
  private readonly baseUrl: string;
  private readonly fetchImpl: FetchLike;
  private readonly retryPolicy: RetryPolicy;

  constructor(options: ApiClientOptions = {}) {
    this.baseUrl = resolveBaseUrl(options.baseUrl);
    this.fetchImpl = options.fetchFn ?? globalThis.fetch;
    if (!this.fetchImpl) {
      throw new Error('A fetch implementation must be provided');
    }

    this.retryPolicy = {
      ...defaultRetryPolicy,
      ...options.retryPolicy,
    } satisfies RetryPolicy;
  }

  async request<TResponse>(options: ApiRequestOptions<TResponse>): Promise<TResponse> {
    const url = new URL(options.path, this.baseUrl);

    if (options.query) {
      for (const [key, value] of Object.entries(options.query)) {
        if (value === undefined || value === null) continue;
        url.searchParams.set(key, String(value));
      }
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (options.body === undefined && options.method === 'GET') {
      delete headers['Content-Type'];
    }

    const init: RequestInit = {
      method: options.method,
      headers,
    };

    if (options.body !== undefined) {
      init.body = JSON.stringify(options.body);
    }

    const response = await this.fetchWithRetry(url, init, options.retryable ?? options.method === 'GET');
    const parsedBody = await this.parseBody(response);

    if (!response.ok) {
      throw new ApiError('Request failed', {
        method: options.method,
        path: url.pathname + url.search,
        status: response.status,
        body: parsedBody,
      });
    }

    if (options.schema) {
      return options.schema.parse(parsedBody);
    }

    return parsedBody as TResponse;
  }

  private async fetchWithRetry(url: URL, init: RequestInit, retryable: boolean): Promise<Response> {
    const attempts = retryable ? this.retryPolicy.maxAttempts : 1;
    let lastError: unknown;

    for (let attempt = 0; attempt < attempts; attempt += 1) {
      try {
        const response = await this.fetchImpl(url, init);
        if (!retryable) {
          return response;
        }

        if (response.ok || response.status < 500) {
          return response;
        }

        lastError = new ApiError('Server error', {
          method: init.method ?? 'GET',
          path: url.pathname + url.search,
          status: response.status,
          body: await this.parseBody(response),
        });
      } catch (error) {
        lastError = error;
      }

      const hasMoreAttempts = attempt < attempts - 1;
      if (hasMoreAttempts) {
        const delayMs = this.retryPolicy.initialDelayMs * 2 ** attempt;
        await delay(delayMs);
        continue;
      }
    }

    if (lastError instanceof ApiError) {
      throw lastError;
    }

    throw new ApiError('Network request failed', {
      method: init.method ?? 'GET',
      path: url.pathname + url.search,
      status: 0,
      body: lastError,
    });
  }

  private async parseBody(response: Response): Promise<unknown> {
    const text = await response.text();
    if (!text) {
      return undefined;
    }

    try {
      return JSON.parse(text);
    } catch (error) {
      return text;
    }
  }
}

export const createApiClient = (options?: ApiClientOptions) => new ApiClient(options);
