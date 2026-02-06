# Tasks & Work Breakdown

Status Legend: ✅ DONE, ⚙️ IN PROGRESS, ⏳ NOT STARTED, ⛔ BLOCKED

| ID | Task | Owner | Branch | Status | Dependencies | Acceptance Criteria |
|----|------|-------|--------|--------|---------------|---------------------|
| T1 | Draft PRD, Architecture, Plan, Tasks, Progress docs | CTO | main | ⚙️ IN PROGRESS | Brief received | Docs exist in `.project/`, reviewed, committed, pushed. |
| T2 | Set up pnpm workspace config, shared tsconfig, lint/test tooling | Backend Engineer | feat/backend | ⏳ NOT STARTED | Boss approval, T1 | `pnpm install`, `pnpm lint`, `pnpm test` succeed; strict TS enforced via base config. |
| T3 | Implement shared `packages/types` with Zod schemas | Backend Engineer | feat/backend | ⏳ NOT STARTED | T2 | Types export `Todo`, `CreateTodoInput`, `UpdateTodoInput`; tests cover schema validation. |
| T4 | Build `packages/api-client` with typed fetch helpers + error handling | Backend Engineer | feat/backend | ⏳ NOT STARTED | T2, T3 | Functions `listTodos`, `getTodo`, `createTodo`, `updateTodo`, `toggleTodo`, `deleteTodo` implemented with retries + type-safe responses. |
| T5 | Implement Hono backend: routes, SQLite schema, repository/service layers, tests | Backend Engineer | feat/backend | ⏳ NOT STARTED | T2, T3 | All CRUD endpoints pass integration tests; migrations managed via Drizzle; server runs on port 3001. |
| T6 | Create TanStack Start web app with React Query + UI | Frontend Engineer | feat/web | ⏳ NOT STARTED | T3, T4, T5 | Web app runs on port 3000, offers list/filter/create/edit/delete/toggle flows with optimistic updates + validation. |
| T7 | Build Expo mobile app with Expo Router mirroring features | Mobile Engineer | feat/mobile | ⏳ NOT STARTED | T3, T4, T5 | Mobile app lists todos, supports CRUD, uses React Query + offline indicator, tested on iOS/Android simulators. |
| T8 | QA regression + automated tests across apps | QA Engineer | qa/review | ⏳ NOT STARTED | T5, T6, T7 | Test plan executed, issues logged, CI suite green. |
| T9 | Deployment prep + documentation (README, env samples, scripts) | CTO | main | ⏳ NOT STARTED | T8 | README documents setup/dev/test/deploy, env files versioned, release notes shared. |

