# Architecture — Todo Monorepo Application

## 1. Monorepo Layout (pnpm workspaces)
```
/project
  package.json (pnpm workspaces)
  pnpm-workspace.yaml
  tsconfig.base.json
  .project/
  packages/
    types/
    api-client/
  apps/
    backend/
    web/
    mobile/
```
- **packages/types**: Exports shared interfaces (`Todo`, `CreateTodoInput`, `UpdateTodoInput`) + Zod schemas.
- **packages/api-client**: Lightweight fetch wrapper with typed request/response helpers used by both web and mobile.
- **apps/backend**: Hono server on port 3001 using SQLite via Drizzle ORM (or better-sqlite3) with repository/service layers.
- **apps/web**: TanStack Start app (React 19, Vite 7) that consumes API client and TanStack Query for caching.
- **apps/mobile**: Expo Router app mirroring feature parity; uses React Query and API client.

## 2. Technology Decisions
| Layer | Tech | Reasoning |
|-------|------|-----------|
| API | Hono | Fast, minimal middleware, edge-friendly, great TypeScript support, matches requirement (no Express). |
| Database | SQLite | Simple local persistence, easy to bundle, works with Drizzle migrations. |
| ORM | Drizzle ORM (sqlite) | Type-safe schema + migrations; integrates with Hono + TS types. |
| API Client | Native `fetch` + wrappers | Works across browser + React Native, zero dependency. |
| Web UI | TanStack Start | Meets requirement, file-based routing, server components ready. |
| Mobile | Expo + Expo Router | Rapid RN dev with shared API client + TS config. |
| State/Data | TanStack Query | Unified caching + revalidation flows. |

## 3. System Architecture Overview
1. **Backend** exposes REST endpoints on `http://localhost:3001`.
2. **API Client package** exports typed functions (e.g., `listTodos`, `createTodo`) referencing shared types.
3. **Web** and **Mobile** apps import API client and maintain React Query caches.
4. SQLite DB persists todos; migrations run via `pnpm db:migrate` script executed inside `apps/backend`.
5. Shared environment configs: `.env` at root for defaults, `.env.local` overrides within each app.

Data Flow Example (Create Todo):
1. User submits form on client.
2. Client validates with shared Zod schema, then calls `apiClient.createTodo(input)`.
3. API client sends POST `/todos` to backend.
4. Backend validates request (Zod), stores in SQLite, returns response.
5. Client invalidates `todos` query, re-fetches list.

## 4. Database Schema
Table: `todos`
- `id` TEXT PRIMARY KEY (uuid v7).
- `title` TEXT NOT NULL (3-120 chars).
- `description` TEXT NULL (<= 1000 chars).
- `dueDate` TEXT NULL (ISO string).
- `completed` INTEGER NOT NULL DEFAULT 0.
- `createdAt` TEXT NOT NULL (ISO timestamp).
- `updatedAt` TEXT NOT NULL (ISO timestamp).

Indexes:
- `idx_todos_createdAt` on `createdAt DESC` for list ordering.
- Optional `idx_todos_completed` to speed up filter queries.

## 5. API Design (REST, Hono)
Base URL: `http://localhost:3001`
| Method | Path | Description | Request Body | Response |
|--------|------|-------------|--------------|----------|
| GET | `/health` | Health probe. | — | `{ status: "ok" }` |
| GET | `/todos` | List todos with optional `status` query. | — | `{ data: Todo[] }` |
| GET | `/todos/:id` | Retrieve single todo. | — | `{ data: Todo }` |
| POST | `/todos` | Create todo. | `CreateTodoInput` | `{ data: Todo }` |
| PATCH | `/todos/:id` | Update todo fields. | `UpdateTodoInput` | `{ data: Todo }` |
| PATCH | `/todos/:id/toggle` | Invert completion. | — | `{ data: Todo }` |
| DELETE | `/todos/:id` | Delete todo. | — | `204 No Content` |

Notes:
- All responses include `data` and optional `error` fields for consistency.
- Validation errors return 400 with `{ error: { message, fieldErrors } }`.
- Not-found returns 404 with `error.code = "NOT_FOUND"`.

## 6. Configuration & Environment
- Root `.env` defines `API_BASE_URL=http://localhost:3001`.
- Backend `.env` stores `DATABASE_URL=file:./data/app.db` (Drizzle). File stored under `apps/backend/data/` (gitignored).
- Expo uses `EXPO_PUBLIC_API_BASE_URL` for runtime fetch base; fallback to development URL.
- TanStack Start uses Vite envs `VITE_API_BASE_URL` (prefixed with `PUBLIC_` if needed per TanStack conventions).

## 7. Dev Tooling & Scripts
- `pnpm install` to bootstrap.
- `pnpm lint` runs `turbo lint` or `pnpm -r lint` across packages.
- `pnpm test` runs unit tests (backend services, API client, React components where feasible).
- `pnpm dev` concurrently runs backend (`pnpm --filter apps/backend dev`) and web (`pnpm --filter apps/web dev`). Mobile started separately via `pnpm --filter apps/mobile start`.
- Use `tsconfig.base.json` for strict rules and path aliases (`@types`, `@api-client`).

## 8. Future Considerations
- Add auth + multi-tenant support.
- Deploy Hono backend to Cloudflare Workers or Fly.io.
- Replace polling with websockets or SSE for real-time updates.

