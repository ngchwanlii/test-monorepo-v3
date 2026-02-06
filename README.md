# Todo Monorepo

Phase 2 establishes the backend foundation, pnpm workspace scaffolding, and shared packages for types + API client. The repo uses pnpm workspaces with strict TypeScript settings plus turbo to orchestrate scripts.

## Getting Started

```bash
pnpm install
cp .env.example .env
cp apps/backend/.env.example apps/backend/.env
pnpm dev
```

`pnpm dev` runs the backend (port 3001) and the placeholder web app concurrently. Mobile remains a stub until Phase 3.

The root `postinstall` hook automatically builds the shared `@test-monorepo/types` and `@test-monorepo/api-client` packages so a clean clone can jump straight to `pnpm dev`. Turbo's `dev` pipeline now also runs the shared package watchers when you run `pnpm dev`, keeping their `dist` outputs up to date while backend or web dev servers run.

### Useful Scripts

| Command | Description |
| --- | --- |
| `pnpm lint` | Runs ESLint across all workspaces via turbo. |
| `pnpm test` | Executes vitest suites (shared packages + backend unit/integration tests). |
| `pnpm --filter @test-monorepo/backend db:migrate` | Applies SQLite migrations using Drizzle. |
| `pnpm --filter @test-monorepo/backend dev` | Starts the backend with live reload (tsx). |

## Backend API

The Hono server exposes JSON responses shaped as `{ data, error }` (DELETE returns `204 No Content`).

| Method | Path | Description |
| --- | --- | --- |
| GET | `/health` | Service health/status probe. |
| GET | `/todos?status=all|active|completed` | List todos ordered by `createdAt DESC`. |
| GET | `/todos/:id` | Fetch a single todo. |
| POST | `/todos` | Create todo (title 3-120 chars, optional description ≤1000, optional ISO `dueDate`). |
| PATCH | `/todos/:id` | Update fields (body validated via shared Zod schema). |
| PATCH | `/todos/:id/toggle` | Invert completion flag. |
| DELETE | `/todos/:id` | Remove todo (responds with 204). |

Input validation, persistence, and response typing are sourced from the shared `@test-monorepo/types` package.

## Shared Packages

- `packages/types`: Todo domain interfaces plus Zod schemas for runtime validation with Vitest coverage of boundary cases.
- `packages/api-client`: Fetch wrapper with configurable base URL, exponential backoff for idempotent GETs, typed error handling, and helpers (`listTodos`, `getTodo`, `createTodo`, `updateTodo`, `toggleTodo`, `deleteTodo`).

Consumers can import the default `todoApi` instance or create their own via `createTodoApi()`.

## Environment Variables

- **Root `.env`**: `API_BASE_URL` (defaults to `http://localhost:3001`).
- **Backend `.env`**: `PORT`, `DATABASE_URL`, `LOG_LEVEL`, `CORS_ALLOWED_ORIGINS` (comma-delimited allow list for CORS) — see `apps/backend/.env.example`.

The backend stores SQLite data at `apps/backend/data/app.db` (gitignored). Tests use in-memory SQLite.

## Testing

`pnpm test` runs:
- Schema tests for shared types (boundary validation).
- API client fetch + retry unit tests (mocked fetch).
- Backend repository/service unit tests plus integration tests against the Hono app via in-memory SQLite.

Ensure tests pass before committing or opening a PR.
