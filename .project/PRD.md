# Product Requirements Document — Todo Monorepo Application

## 1. Overview
Build a full-stack Todo application delivered as a pnpm workspaces monorepo. The solution exposes a Hono-based REST API backed by SQLite, and provides both web (TanStack Start + React 19) and mobile (Expo + React Native) clients using a shared API client and shared TypeScript types. The product must deliver complete CRUD functionality for Todo items with consistent behavior across clients and a single source of truth in the backend.

## 2. Goals & Success Metrics
- Provide responsive, reliable Todo management on web and mobile, powered by the same backend and shared client library.
- Maintain strict TypeScript types throughout the repo to ensure cross-package consistency.
- Ensure backend (port 3001) and web frontend (port 3000) run concurrently with minimal setup (`pnpm install && pnpm dev`).
- Publish production-ready API docs and predictable response shapes so that additional clients can integrate easily.
- Success is measured by: ability to create/update/delete/toggle todos on both clients with instant UI feedback, no type errors on build, and >95% automated test coverage for core services/modules.

## 3. User Roles & Stories
### Primary User: Todo App User
1. **Create Todos** — As a user, I want to create a todo with title, optional description, and due date so I can track tasks.
2. **View Todos** — As a user, I want to view my todos sorted by creation date and filtered by status (all/active/completed).
3. **Update Todos** — As a user, I want to edit a todo’s details when plans change.
4. **Toggle Completion** — As a user, I want to mark a todo complete or incomplete quickly from list or detail view.
5. **Delete Todos** — As a user, I want to delete todos that I no longer need.
6. **Sync Across Devices** — As a user, I want my updates on web or mobile to persist instantly and be reflected everywhere.

### Secondary User: CTO / Admin
1. **Monitor Service Health** — Needs metrics/logging hooks to ensure backend reliability.
2. **Extend Platform** — Needs shared packages (types + API client) to accelerate future feature delivery.

## 4. Functional Requirements & Acceptance Criteria
| Feature | Description | Acceptance Criteria |
|---------|-------------|---------------------|
| Create Todo | Provide forms on web/mobile for entering title (required, 3-120 chars), optional description (0-1000 chars), dueDate (optional ISO). | - POST `/todos` creates todo with `id`, `createdAt`, `updatedAt`, `completed` default false.<br>- Validation errors returned as 400 with field-level messages.<br>- Clients optimistic update only after request success confirmation. |
| Read Todos | List, filter, detail view. | - GET `/todos` returns array sorted by `createdAt DESC`, accepts query params `status=all|active|completed`.<br>- GET `/todos/:id` returns single todo or 404.<br>- List UI shows count and filter controls; detail surfaces metadata. |
| Update Todo | Edit title/description/dueDate. | - PATCH `/todos/:id` accepts partial fields + `completed`.<br>- Returns updated todo; handles stale updates via timestamps.<br>- UI surfaces errors inline. |
| Toggle Completion | Quick toggle actions in list and detail. | - PATCH `/todos/:id/toggle` or PATCH via `completed` field.<br>- Response returns updated `completed` boolean and `updatedAt`.<br>- UI reflects change and resorting if necessary. |
| Delete Todo | Remove todo via UI action with confirm prompt (web) and action sheet (mobile). | - DELETE `/todos/:id` returns 204.<br>- Clients remove todo locally after success and refresh list. |
| Sync Consistency | Keep clients in sync. | - API is the source of truth.<br>- Clients revalidate queries after any mutation using TanStack Query / React Query.<br>- Data normalization ensures identical shapes via shared types. |

## 5. Non-Functional Requirements
- **Type Safety**: TS `strict` enabled in root + all packages/apps; `tsconfig` references share base config.
- **Performance**: API requests respond <150ms median with SQLite; frontend list virtualization after 50 items.
- **Reliability**: Graceful error handling and retry logic in API client; backend health check endpoint.
- **DX**: `pnpm dev` runs backend + web concurrently; `pnpm lint`, `pnpm test` commands available at root.
- **Security**: Input validation uses Zod; SQLite uses parameterized queries to avoid injection; CORS limited to approved origins (web + mobile schemes).
- **Observability**: Basic structured logging on backend, with request/response metadata.

## 6. Dependencies & Integrations
- pnpm workspaces root orchestrating `packages/types`, `packages/api-client`, `apps/backend`, `apps/web`, `apps/mobile`.
- Database: SQLite using better-sqlite3 or drizzle-sqlite. Local file stored under `apps/backend/data/app.db` (gitignored).
- Mobile uses Expo Router with API client hooking into backend base URL (configurable via `EXPO_PUBLIC_API_BASE_URL`).

## 7. Out of Scope (Phase 1)
- Authentication or multi-user persistence (single user context assumed).
- Push notifications, reminders, or calendar sync.
- Offline-first caching beyond standard query caching.
- Advanced collaboration/sharing.

## 8. Open Questions
- Should we support attachments or priority levels? (default: no)
- How will deployments be handled post-MVP? (TBD in later phases)
