# Ideaspace Workspace System

## TL;DR

> **Summary**: Build the complete Ideaspace workspace system — a notebook editor (Milkdown), kanban task board, context management with selective AI attachment, and agent run tracking. The core differentiator: users choose exactly which content to include in AI conversations, saving tokens and improving relevance. Backend adds 7 new SQLite tables, 4 new API route files, and a prompt assembly layer. Frontend replaces all 4 placeholder tab components with real implementations.
>
> **Deliverables**:
>
> - 7 new database tables (notebook, page, context_item, session_context, task, task_context, agent_run)
> - 4 new API route files (notebook, task, context, agent-run)
> - Prompt assembly integration (context items injected into AI messages)
> - Workspace tab: Milkdown markdown editor with notebook/page CRUD
> - Tasks tab: Kanban board with drag-drop column transitions
> - Context tab: Context bank with attach/detach to sessions
> - Session context tray: Toggle context items per-session with token counts
> - SDK regeneration for all new endpoints
>
> **Effort**: Extra-Large (multi-day, 4-person parallel)
> **Parallel**: YES - Foundation sequential (Wave 1-2), then 4 parallel streams (Wave 3)
> **Critical Path**: Schema/Migration -> API routes -> SDK regen -> Frontend stores -> Tab UIs -> Context-Session integration

## Context

### Original Request

Build the Ideaspace Workspace System with equal focus on: (1) Markdown notebook workspace, (2) Kanban task board, (3) Context management with selective AI attachment, (4) Agent run tracking. Designed for hackathon demo — manual testing only, no automated tests.

### Interview Summary

**Key Discussions**:

- **Workspace Tab**: Commonplace notebook style, markdown pages, Milkdown editor, autosave 500ms debounce to SQLite
- **Tasks Tab**: Kanban board, @thisbeyond/solid-dnd (already installed), task CRUD, priorities, assignee (user or agent)
- **Context Management**: Core differentiator — users selectively attach content to AI sessions. `context_item` as universal abstraction (page|bank|file|snippet). Token counting backend-only via gpt-tokenizer, frontend estimate via `Math.ceil(text.length / 3.5)`
- **Agent Runs**: Lightweight tracking (status, tokens, cost), not full orchestration
- **Equal priority**: All 4 features built in parallel by teammates
- **Test strategy**: Manual verification only
- **Default notebook**: Auto-create "Commonplace" notebook with one blank page on project open
- **Context tray**: Full sidebar panel in Context tab + compact quick toggle near session composer
- **Token caching**: Cache in DB (`tokens_cached` column), recompute on body change

**Research Findings**:

- All DB schemas use `sqliteTable()` + `...Timestamps` + snake_case + cascade deletes in `*.sql.ts` files
- CRUD follows `fn(zodSchema, async (input) => {...})` with `Database.use()` + `Database.effect(() => Bus.publish())`
- Routes: `export const XRoutes = lazy(() => new Hono().get().post().patch().delete())` with `describeRoute()` + `validator()` + `resolver()`
- Frontend: `createSimpleContext({ name, init })` + `createStore` + `reconcile()` for API data
- Project tabs already wired: `project-tabs.tsx` has tabs array, `app.tsx` has routes, `project.tsx` has Switch/Match
- Placeholder components for all 4 tabs are inline in `project.tsx` (lines 81-266)

### Metis Review (gaps addressed)

- **Context-to-prompt integration**: Context items will be prepended as system-level content blocks before the conversation, not injected into user messages. New `assemble()` function in a dedicated module.
- **Polymorphic pattern**: Metis flagged `ref_type + ref_id` doesn't match codebase JSON blob pattern. Decision: use `kind` enum column + nullable `ref_id` (simple FK when applicable, not polymorphic pointer pattern). For `page` kind, `ref_id` = page ID. For `bank`/`snippet`, content is inline in `body`.
- **Page-as-live-reference**: When a page is attached as context, the session reads the CURRENT page body (live reference, not snapshot). This is the expected behavior — edits to a page immediately affect what the AI sees.
- **Deleted source handling**: If a page is deleted, its `context_item` rows cascade-delete via FK, which cascade-deletes `session_context` rows. Clean.
- **Session context toggle**: `enabled` column (not hard-delete). Toggling off sets `enabled = 0`, preserving position for re-toggle.
- **One kanban board per project**: Single board for MVP. `board_id` column is nullable for future multi-board.
- **Initial columns**: Hardcoded defaults: Backlog, In Progress, Review, Done. Users can't add/rename columns in MVP.
- **Token counting model**: Use `cl100k_base` tokenizer (GPT-4/Claude compatible). Backend-only.
- **Scope locks**: No slash commands, no Notion blocks, no task dependencies, no template builder UI, no RAG, no real-time collab.

---

## Work Objectives

### Core Objective

Build a complete workspace system where users create content in notebooks, organize work in kanban boards, and selectively attach content to AI sessions — demonstrating the core Ideaspace differentiator of token-efficient context management.

### Concrete Deliverables

1. Backend: 7 new tables with migrations, 4 API route files, prompt assembly function
2. Frontend: 4 real tab implementations replacing placeholder components
3. Integration: Context items flow from notebooks/bank into AI session prompts

### Definition of Done

- [ ] `cd packages/opencode && bun run build` passes
- [ ] `cd packages/app && bun run typecheck && bun run build` passes
- [ ] SDK regenerated: `./packages/sdk/js/script/build.ts`
- [ ] All 4 tabs render with real data (not mock)
- [ ] Creating a notebook page and attaching it to a session changes AI responses

### Must Have

- Notebook CRUD (create/rename/delete notebooks and pages)
- Milkdown markdown editor with autosave
- Default "Commonplace" notebook auto-created on first project open
- Kanban board with drag-drop between columns
- Task CRUD (create, edit title/body/priority/assignee, delete)
- Context item CRUD (create bank items, auto-create from pages)
- Session context tray (attach/detach items, toggle enabled, see token counts)
- Prompt assembly (attached context injected into AI conversations)
- Agent run list (read-only display of past runs)

### Must NOT Have (Guardrails)

- No Notion-style blocks, slash commands, or embeds in editor
- No task dependencies, subtasks, or time tracking
- No kanban column add/rename/delete (hardcoded columns for MVP)
- No workflow template builder UI
- No RAG, embeddings, or semantic search
- No real-time collaboration
- No cost/pricing calculations (token count display only)
- No agent orchestration controls (read-only run log)
- No markdown file export/import
- No security enforcement beyond enum column
- No `createSignal` for stores — use `createStore` per AGENTS.md
- No raw SQL — Drizzle ORM only
- No importing `Client` directly — use `Database.use()`
- No new DnD library — `@thisbeyond/solid-dnd` only
- No shipping gpt-tokenizer to browser — backend-only

---

## Verification Strategy

### Test Decision

- **Infrastructure exists**: YES (bun test in packages/app)
- **User wants tests**: NO (manual verification for hackathon speed)
- **Framework**: N/A
- **QA approach**: Manual verification via browser + terminal

### QA Policy

Each task includes manual verification steps. Final integration verification uses Playwright browser automation.

---

## Task Flow

```
Wave 1 (Sequential - Foundation):
  1 (Schema) -> 2 (Migration) -> 3 (Bus Events) -> 4 (CRUD functions)

Wave 2 (Sequential - API + SDK):
  5 (API Routes) -> 6 (SDK Regen) -> 7 (Frontend Stores)

Wave 3 (Parallel - 4 streams):
  8  (Workspace Tab)    ─┐
  9  (Tasks Tab)         │── All parallel, all depend on Wave 2
  10 (Context Tab)       │
  11 (Agent Runs Tab)   ─┘

Wave 4 (Sequential - Integration):
  12 (Session Context Tray) -> 13 (Prompt Assembly) -> 14 (Default Notebook)

Wave 5 (Sequential - Final):
  15 (Cross-tab Polish)
```

## Parallelization

| Group             | Tasks        | Reason                                                                            |
| ----------------- | ------------ | --------------------------------------------------------------------------------- |
| A (Foundation)    | 1, 2, 3, 4   | Sequential: each depends on prior                                                 |
| B (API Layer)     | 5, 6, 7      | Sequential: routes need schema, SDK needs routes, stores need SDK                 |
| C (Parallel Tabs) | 8, 9, 10, 11 | Independent UI tabs, all need stores from Wave 2                                  |
| D (Integration)   | 12, 13, 14   | Sequential: tray needs context tab, prompt needs tray, default notebook needs all |
| E (Polish)        | 15           | Final pass                                                                        |

| Task         | Depends On | Reason                                               |
| ------------ | ---------- | ---------------------------------------------------- |
| 2            | 1          | Migration needs schema files                         |
| 3            | 1          | Events reference table types                         |
| 4            | 2, 3       | CRUD needs migrated DB + events                      |
| 5            | 4          | Routes call CRUD functions                           |
| 6            | 5          | SDK generated from route OpenAPI specs               |
| 7            | 6          | Stores call SDK methods                              |
| 8, 9, 10, 11 | 7          | Tabs consume stores                                  |
| 12           | 10         | Session tray uses context store                      |
| 13           | 12         | Prompt assembly reads session_context                |
| 14           | 8, 13      | Auto-create uses notebook CRUD + context integration |
| 15           | All        | Final cross-tab verification                         |

---

## TODOs

- [ ] 1. Define all database schemas

  **What to do**:
  - Create `packages/opencode/src/notebook/notebook.sql.ts` with `NotebookTable` and `PageTable`
  - Create `packages/opencode/src/context/context.sql.ts` with `ContextItemTable`, `SessionContextTable`, `TaskContextTable`
  - Create `packages/opencode/src/task/task.sql.ts` with `TaskTable`
  - Create `packages/opencode/src/agent-run/agent-run.sql.ts` with `AgentRunTable`
  - Export all tables from `packages/opencode/src/storage/schema.ts` barrel
  - Follow snake*case columns, `...Timestamps` spread, cascade deletes, index naming `<table>*<col>\_idx`

  **Schema Details**:

  `NotebookTable`:

  ```
  id: text PK
  project_id: text FK -> ProjectTable.id CASCADE, NOT NULL
  name: text NOT NULL
  icon: text (nullable)
  position: integer NOT NULL
  ...Timestamps
  Indexes: notebook_project_idx on project_id
  ```

  `PageTable`:

  ```
  id: text PK
  notebook_id: text FK -> NotebookTable.id CASCADE, NOT NULL
  title: text NOT NULL
  body: text NOT NULL (default "")
  position: integer NOT NULL
  ...Timestamps
  Indexes: page_notebook_idx on notebook_id
  ```

  `ContextItemTable`:

  ```
  id: text PK
  project_id: text FK -> ProjectTable.id CASCADE, NOT NULL
  kind: text NOT NULL (enum: "page"|"bank"|"file"|"snippet")
  ref_id: text (nullable - page ID for kind=page, null for bank/snippet)
  title: text NOT NULL
  body: text (nullable - inline content for bank/snippet kinds)
  security: text NOT NULL (default "public", enum: "public"|"internal"|"confidential"|"restricted")
  pinned: integer NOT NULL (default 0, boolean - global context = always included)
  tokens: integer (nullable - cached token count from backend)
  ...Timestamps
  Indexes: context_item_project_idx on project_id, context_item_ref_idx on ref_id
  ```

  `SessionContextTable`:

  ```
  session_id: text FK -> SessionTable.id CASCADE, NOT NULL
  context_id: text FK -> ContextItemTable.id CASCADE, NOT NULL
  enabled: integer NOT NULL (default 1, boolean)
  position: integer NOT NULL
  PK: (session_id, context_id)
  ...Timestamps
  Indexes: session_context_session_idx on session_id, session_context_context_idx on context_id
  ```

  `TaskTable`:

  ```
  id: text PK
  project_id: text FK -> ProjectTable.id CASCADE, NOT NULL
  board_id: text (nullable - for future multi-board)
  title: text NOT NULL
  body: text (nullable, markdown description)
  status: text NOT NULL (default "backlog", enum: "backlog"|"progress"|"review"|"done")
  priority: text NOT NULL (default "medium", enum: "urgent"|"high"|"medium"|"low")
  assignee_kind: text (nullable, enum: "user"|"agent")
  assignee_id: text (nullable)
  due_at: integer (nullable, unix timestamp)
  position: integer NOT NULL
  ...Timestamps
  Indexes: task_project_idx on project_id, task_status_idx on status
  ```

  `TaskContextTable`:

  ```
  task_id: text FK -> TaskTable.id CASCADE, NOT NULL
  context_id: text FK -> ContextItemTable.id CASCADE, NOT NULL
  PK: (task_id, context_id)
  ...Timestamps
  Indexes: task_context_task_idx on task_id, task_context_context_idx on context_id
  ```

  `AgentRunTable`:

  ```
  id: text PK
  task_id: text (nullable - FK to TaskTable.id, no cascade)
  session_id: text (nullable - FK to SessionTable.id, no cascade)
  agent_kind: text NOT NULL
  status: text NOT NULL (default "queued", enum: "queued"|"running"|"done"|"failed")
  summary: text (nullable)
  tokens_in: integer (nullable)
  tokens_out: integer (nullable)
  cost: text (nullable - string for decimal precision)
  started_at: integer (nullable)
  ended_at: integer (nullable)
  ...Timestamps
  Indexes: agent_run_task_idx on task_id, agent_run_session_idx on session_id
  ```

  **Must NOT do**:
  - Don't introduce `ref_type + ref_id` polymorphic FK pattern — use `kind` enum + simple nullable `ref_id`
  - Don't use `text("column_name")` with string args — use bare `text()` per AGENTS.md
  - Don't add any columns not listed above

  **Parallelizable**: NO (foundation task, blocks everything)

  **References**:

  **Pattern References**:
  - `packages/opencode/src/session/session.sql.ts:11-40` — Canonical table with FK, indexes, Timestamps spread, JSON columns
  - `packages/opencode/src/session/session.sql.ts:69-85` — Composite PK pattern (TodoTable)
  - `packages/opencode/src/storage/schema.sql.ts:3-9` — Timestamps mixin definition
  - `packages/opencode/src/storage/schema.ts:1-5` — Barrel file that re-exports all tables
  - `packages/opencode/src/project/project.sql.ts:1-15` — Simple table with FK
  - `packages/opencode/src/control/control.sql.ts:1-22` — Composite PK + uniqueIndex example

  **Acceptance Criteria**:
  - [ ] 7 new tables defined across 4 `.sql.ts` files
  - [ ] All tables exported from `packages/opencode/src/storage/schema.ts`
  - [ ] `lsp_diagnostics` clean on all new files
  - [ ] All FKs use `onDelete: "cascade"` where specified
  - [ ] All columns are snake_case, no string args to column functions

  **Commit**: YES
  - Message: `feat(opencode): add schema for notebooks, tasks, context, and agent runs`
  - Files: `packages/opencode/src/notebook/notebook.sql.ts`, `packages/opencode/src/context/context.sql.ts`, `packages/opencode/src/task/task.sql.ts`, `packages/opencode/src/agent-run/agent-run.sql.ts`, `packages/opencode/src/storage/schema.ts`
  - Pre-commit: `cd packages/opencode && bun run build`

---

- [ ] 2. Generate database migration

  **What to do**:
  - Run `cd packages/opencode && bun run db generate --name ideaspace_workspace` to generate migration
  - Verify the generated SQL creates all 7 tables with correct columns, FKs, and indexes
  - Run `bun drizzle-kit check` to confirm no schema drift

  **Must NOT do**:
  - Don't hand-write migration SQL — let Drizzle Kit generate it
  - Don't modify existing migrations

  **Parallelizable**: NO (depends on 1)

  **References**:
  - `packages/opencode/drizzle.config.ts:1-10` — Drizzle Kit config: schema glob `./src/**/*.sql.ts`, output `./migration`
  - `packages/opencode/migration/20260303231226_add_workspace_fields/migration.sql` — Example generated migration
  - `packages/opencode/script/check-migrations.ts` — CI guard script

  **Acceptance Criteria**:
  - [ ] Migration folder created: `packages/opencode/migration/<timestamp>_ideaspace_workspace/`
  - [ ] `migration.sql` contains CREATE TABLE for all 7 new tables
  - [ ] `bun drizzle-kit check` passes (no drift)
  - [ ] `cd packages/opencode && bun run build` passes

  **Commit**: YES
  - Message: `feat(opencode): add migration for ideaspace workspace tables`
  - Files: `packages/opencode/migration/<timestamp>_ideaspace_workspace/`
  - Pre-commit: `cd packages/opencode && bun run build`

---

- [ ] 3. Define Bus events for all new entities

  **What to do**:
  - In `packages/opencode/src/notebook/index.ts`: define `Event.Created`, `Event.Updated`, `Event.Deleted` for notebooks AND pages (6 events total)
  - In `packages/opencode/src/context/index.ts`: define events for context items AND session contexts (6 events)
  - In `packages/opencode/src/task/index.ts`: define events for tasks (3 events)
  - In `packages/opencode/src/agent-run/index.ts`: define events for agent runs (3 events)
  - Use `BusEvent.define(type, zodSchema)` pattern
  - Event naming: `notebook.created`, `page.created`, `context_item.created`, `session_context.created`, `task.created`, `agent_run.created` etc.

  **Must NOT do**:
  - Don't define events without Zod schemas
  - Don't use non-standard event naming

  **Parallelizable**: NO (depends on 1, blocks 4)

  **References**:
  - `packages/opencode/src/bus/bus-event.ts:1-43` — `BusEvent.define()` implementation
  - `packages/opencode/src/bus/index.ts:1-105` — `Bus.publish()`, `Bus.subscribe()` API
  - `packages/opencode/src/session/index.ts:48-78` — Session events as pattern (Event.Created, Event.Updated, Event.Deleted with `{ info }` payload)

  **Acceptance Criteria**:
  - [ ] 18 events defined across 4 modules (6+6+3+3)
  - [ ] All events use `BusEvent.define()` with Zod schemas
  - [ ] Event types follow naming convention `entity.verb`
  - [ ] `lsp_diagnostics` clean on all new files

  **Commit**: YES
  - Message: `feat(opencode): add bus events for workspace entities`
  - Files: `packages/opencode/src/notebook/index.ts`, `packages/opencode/src/context/index.ts`, `packages/opencode/src/task/index.ts`, `packages/opencode/src/agent-run/index.ts`
  - Pre-commit: `cd packages/opencode && bun run build`

---

- [ ] 4. Implement CRUD functions for all entities

  **What to do**:
  - In `packages/opencode/src/notebook/index.ts`: add CRUD for notebooks (list, get, create, update, remove) and pages (list, get, create, update, remove, reorder)
  - In `packages/opencode/src/context/index.ts`: add CRUD for context items (list, get, create, update, remove) and session context (list, attach, detach, toggle, reorder)
  - In `packages/opencode/src/task/index.ts`: add CRUD for tasks (list, get, create, update, remove, reorder, move)
  - In `packages/opencode/src/agent-run/index.ts`: add read-only functions for agent runs (list, get)
  - All functions use `fn(zodSchema, async (input) => {...})` pattern
  - All DB access via `Database.use((db) => ...)`
  - All mutations fire `Database.effect(() => Bus.publish(Event.X, { info }))`
  - Token counting: when creating/updating a context_item with body content, compute tokens server-side with gpt-tokenizer and store in `tokens` column

  **Key function signatures**:

  ```
  Notebook.list(projectID) -> NotebookInfo[]
  Notebook.create({ projectID, name, icon? }) -> NotebookInfo
  Notebook.update({ id, name?, icon? }) -> NotebookInfo
  Notebook.remove(id) -> void

  Page.list(notebookID) -> PageInfo[]
  Page.create({ notebookID, title, body? }) -> PageInfo
  Page.update({ id, title?, body? }) -> PageInfo  (recompute context_item tokens on body change)
  Page.remove(id) -> void

  ContextItem.list(projectID) -> ContextItemInfo[]
  ContextItem.create({ projectID, kind, title, body?, refID?, pinned? }) -> ContextItemInfo
  ContextItem.update({ id, title?, body?, pinned?, security? }) -> ContextItemInfo
  ContextItem.remove(id) -> void

  SessionContext.list(sessionID) -> SessionContextInfo[] (includes resolved context_item data + token count)
  SessionContext.attach({ sessionID, contextID, position? }) -> SessionContextInfo
  SessionContext.detach({ sessionID, contextID }) -> void
  SessionContext.toggle({ sessionID, contextID, enabled }) -> SessionContextInfo
  SessionContext.reorder({ sessionID, items: { contextID, position }[] }) -> void

  Task.list(projectID) -> TaskInfo[]
  Task.create({ projectID, title, status?, priority?, assigneeKind?, assigneeID? }) -> TaskInfo
  Task.update({ id, title?, body?, status?, priority?, assigneeKind?, assigneeID?, dueAt? }) -> TaskInfo
  Task.remove(id) -> void
  Task.move({ id, status, position }) -> TaskInfo

  AgentRun.list({ projectID?, sessionID?, taskID? }) -> AgentRunInfo[]
  AgentRun.get(id) -> AgentRunInfo
  ```

  **Must NOT do**:
  - Don't import `Client` directly — use `Database.use()`
  - Don't skip `Database.effect()` for Bus events
  - Don't ship gpt-tokenizer to frontend — backend only
  - Don't use `any` type

  **Parallelizable**: NO (depends on 2, 3)

  **References**:

  **Pattern References**:
  - `packages/opencode/src/session/index.ts:276-330` — fn() CRUD pattern with Database.use + Database.effect + Bus.publish
  - `packages/opencode/src/session/index.ts:216-234` — list/get pattern
  - `packages/opencode/src/util/fn.ts:1-18` — fn() wrapper definition
  - `packages/opencode/src/storage/db.ts:137-157` — Database.use(), Database.effect() implementations

  **API/Type References**:
  - `packages/opencode/src/session/session.sql.ts:11-40` — SessionTable (for FK references in session_context)
  - `packages/opencode/src/project/project.sql.ts:1-15` — ProjectTable (for FK references)

  **External References**:
  - gpt-tokenizer: `import { encode } from "gpt-tokenizer"` — `encode(text).length` gives token count

  **Acceptance Criteria**:
  - [ ] All CRUD functions defined with `fn()` wrapper
  - [ ] All mutations publish Bus events via `Database.effect()`
  - [ ] Token counting works: creating/updating context_item with body sets `tokens` column
  - [ ] SessionContext.list resolves context_item data (joins)
  - [ ] `cd packages/opencode && bun run build` passes
  - [ ] `lsp_diagnostics` clean on all files

  **Commit**: YES
  - Message: `feat(opencode): add CRUD functions for notebooks, tasks, context, and agent runs`
  - Files: `packages/opencode/src/notebook/index.ts`, `packages/opencode/src/context/index.ts`, `packages/opencode/src/task/index.ts`, `packages/opencode/src/agent-run/index.ts`
  - Pre-commit: `cd packages/opencode && bun run build`

---

- [ ] 5. Create API route files

  **What to do**:
  - Create `packages/opencode/src/server/routes/notebook.ts` — NotebookRoutes with endpoints for notebook + page CRUD
  - Create `packages/opencode/src/server/routes/task.ts` — TaskRoutes with endpoints for task CRUD + move
  - Create `packages/opencode/src/server/routes/context.ts` — ContextRoutes with endpoints for context_item CRUD
  - Add session context endpoints to existing `packages/opencode/src/server/routes/session.ts` — attach, detach, toggle, list context per session
  - Register new routes in `packages/opencode/src/server/server.ts`: `.route("/notebook", NotebookRoutes())`, `.route("/task", TaskRoutes())`, `.route("/context", ContextRoutes())`
  - Create `packages/opencode/src/server/routes/agent-run.ts` — AgentRunRoutes with list + get
  - Register: `.route("/agent-run", AgentRunRoutes())`

  **Endpoint Design**:

  NotebookRoutes (`/notebook`):

  ```
  GET    /                          -> notebook.list (query: projectID)
  POST   /                          -> notebook.create (json: { projectID, name, icon? })
  GET    /:notebookID               -> notebook.get
  PATCH  /:notebookID               -> notebook.update (json: { name?, icon? })
  DELETE /:notebookID               -> notebook.remove
  GET    /:notebookID/page          -> page.list
  POST   /:notebookID/page          -> page.create (json: { title, body? })
  GET    /:notebookID/page/:pageID  -> page.get
  PATCH  /:notebookID/page/:pageID  -> page.update (json: { title?, body? })
  DELETE /:notebookID/page/:pageID  -> page.remove
  ```

  TaskRoutes (`/task`):

  ```
  GET    /                          -> task.list (query: projectID)
  POST   /                          -> task.create (json: { projectID, title, status?, priority? })
  GET    /:taskID                   -> task.get
  PATCH  /:taskID                   -> task.update (json: { title?, body?, status?, priority?, ... })
  DELETE /:taskID                   -> task.remove
  POST   /:taskID/move              -> task.move (json: { status, position })
  ```

  ContextRoutes (`/context`):

  ```
  GET    /                          -> context.list (query: projectID)
  POST   /                          -> context.create (json: { projectID, kind, title, body?, refID?, pinned? })
  GET    /:contextID                -> context.get
  PATCH  /:contextID                -> context.update (json: { title?, body?, pinned?, security? })
  DELETE /:contextID                -> context.remove
  ```

  Session context endpoints (added to existing `/session`):

  ```
  GET    /:sessionID/context        -> session.context.list
  POST   /:sessionID/context        -> session.context.attach (json: { contextID, position? })
  DELETE /:sessionID/context/:contextID -> session.context.detach
  PATCH  /:sessionID/context/:contextID -> session.context.toggle (json: { enabled })
  ```

  AgentRunRoutes (`/agent-run`):

  ```
  GET    /                          -> agentRun.list (query: projectID?, sessionID?, taskID?)
  GET    /:runID                    -> agentRun.get
  ```

  **Must NOT do**:
  - Don't create agent run write endpoints (read-only for MVP)
  - Don't deviate from existing route patterns (lazy, describeRoute, validator, resolver, errors)

  **Parallelizable**: NO (depends on 4)

  **References**:

  **Pattern References**:
  - `packages/opencode/src/server/routes/pty.ts:1-199` — Canonical full CRUD route example (list, create, get, update, delete)
  - `packages/opencode/src/server/routes/session.ts:24-68` — describeRoute + validator + resolver pattern
  - `packages/opencode/src/server/routes/session.ts:936-971` — End of session routes chain (append context endpoints here)
  - `packages/opencode/src/server/server.ts:245-255` — Route registration (add new `.route()` calls here)
  - `packages/opencode/src/server/error.ts:34` — `errors()` helper for 400/404

  **Acceptance Criteria**:
  - [ ] 4 new route files created + session.ts extended
  - [ ] All routes registered in server.ts
  - [ ] All endpoints follow `describeRoute()` + `validator()` + `resolver()` pattern
  - [ ] `operationId` follows `entity.verb` convention
  - [ ] `cd packages/opencode && bun run build` passes

  **Commit**: YES
  - Message: `feat(opencode): add API routes for notebooks, tasks, context, and agent runs`
  - Files: `packages/opencode/src/server/routes/notebook.ts`, `packages/opencode/src/server/routes/task.ts`, `packages/opencode/src/server/routes/context.ts`, `packages/opencode/src/server/routes/agent-run.ts`, `packages/opencode/src/server/routes/session.ts`, `packages/opencode/src/server/server.ts`
  - Pre-commit: `cd packages/opencode && bun run build`

---

- [ ] 6. Regenerate SDK and add SSE event handling

  **What to do**:
  - Run `./packages/sdk/js/script/build.ts` to regenerate JS SDK from OpenAPI spec
  - Verify new SDK methods exist for all new endpoints (notebook.list, task.create, context.attach, etc.)
  - Add new event cases to `packages/app/src/context/global-sync.tsx` in `applyDirectoryEvent()` for: notebook.created/updated/deleted, page.created/updated/deleted, context_item.created/updated/deleted, session_context.created/updated/deleted, task.created/updated/deleted, agent_run.created/updated/deleted
  - Add new store slices to `GlobalSync` state type for: `notebook`, `page`, `context_item`, `task`, `agent_run`

  **Must NOT do**:
  - Don't hand-edit generated SDK files
  - Don't skip event cases — every Bus event needs a frontend handler

  **Parallelizable**: NO (depends on 5)

  **References**:

  **Pattern References**:
  - `packages/sdk/js/script/build.ts` — SDK generation script
  - `packages/app/src/context/global-sync.tsx:273` — Where SSE events are routed to `applyDirectoryEvent`
  - `packages/app/src/context/sync.tsx:44-90` — `applyOptimisticAdd/Remove` + `Binary.search` pattern for store updates
  - `packages/app/src/context/global-sync.tsx` — `applyGlobalEvent` and `applyDirectoryEvent` functions

  **Acceptance Criteria**:
  - [ ] SDK regenerated successfully
  - [ ] New SDK methods available (spot-check: `client.notebook.list()`, `client.task.create()`, `client.context.list()`)
  - [ ] All 18 event types handled in `applyDirectoryEvent`
  - [ ] `cd packages/app && bun run typecheck` passes

  **Commit**: YES
  - Message: `feat(app): regenerate SDK and add SSE event handling for workspace entities`
  - Files: `packages/sdk/js/src/`, `packages/app/src/context/global-sync.tsx`
  - Pre-commit: `cd packages/app && bun run typecheck`

---

- [ ] 7. Create frontend context providers (stores)

  **What to do**:
  - Create `packages/app/src/context/notebook.tsx` — NotebookProvider with `createSimpleContext`:
    - Fetch notebooks + pages via SDK on mount
    - Expose: `notebooks()`, `pages(notebookID)`, `selected()`, `select(id)`, `create()`, `update()`, `remove()`, `createPage()`, `updatePage()`, `removePage()`
    - Handle SSE events to update store reactively
  - Create `packages/app/src/context/task-board.tsx` — TaskBoardProvider:
    - Fetch tasks via SDK
    - Expose: `tasks()`, `byStatus(status)`, `create()`, `update()`, `remove()`, `move()`
    - Kanban columns: hardcoded `["backlog", "progress", "review", "done"]` with labels
  - Create `packages/app/src/context/context-bank.tsx` — ContextBankProvider:
    - Fetch context items + session contexts via SDK
    - Expose: `items()`, `pinned()`, `forSession(sessionID)`, `create()`, `update()`, `remove()`, `attach()`, `detach()`, `toggle()`
    - Token estimate helper: `estimateTokens(text)` → `Math.ceil(text.length / 3.5)`
  - Add providers to `packages/app/src/pages/directory-layout.tsx` (or `project.tsx`) so they wrap all project tabs
  - Use `createStore` + `reconcile()` for API data, NOT `createSignal`

  **Must NOT do**:
  - Don't use `createSignal` — use `createStore` per AGENTS.md
  - Don't duplicate data fetching logic — single source of truth per store
  - Don't ship gpt-tokenizer to frontend — use `Math.ceil(text.length / 3.5)` estimate

  **Parallelizable**: NO (depends on 6)

  **References**:

  **Pattern References**:
  - `packages/app/src/context/agents.tsx:15-132` — `createSimpleContext` with SDK fetch, store, computed properties
  - `packages/app/src/context/sync.tsx:92+` — Per-directory store with `reconcile()` updates
  - `packages/app/src/context/layout.tsx:133-889` — Complex provider example with multiple state slices
  - `packages/ui/src/context/helper.tsx:3-36` — `createSimpleContext` implementation (gate, ready)
  - `packages/app/src/pages/directory-layout.tsx` — Where to add provider wrappers

  **Acceptance Criteria**:
  - [ ] 3 new providers created (Notebook, TaskBoard, ContextBank)
  - [ ] All use `createSimpleContext` + `createStore`
  - [ ] Providers added to directory layout wrapper
  - [ ] `cd packages/app && bun run typecheck` passes
  - [ ] `lsp_diagnostics` clean

  **Commit**: YES
  - Message: `feat(app): add context providers for notebooks, tasks, and context bank`
  - Files: `packages/app/src/context/notebook.tsx`, `packages/app/src/context/task-board.tsx`, `packages/app/src/context/context-bank.tsx`, `packages/app/src/pages/directory-layout.tsx`
  - Pre-commit: `cd packages/app && bun run typecheck`

---

- [ ] 8. Build Workspace tab (Notebook + Milkdown editor)

  **What to do**:
  - Replace the inline `Workspace()` placeholder in `packages/app/src/pages/project.tsx` (lines 81-138) with a real implementation
  - Create `packages/app/src/pages/workspace/index.tsx` — main workspace layout:
    - Left sidebar: notebook list + page list (tree view)
    - Right pane: Milkdown markdown editor for selected page
    - Toolbar: new notebook, new page, delete buttons
  - Create `packages/app/src/pages/workspace/editor.tsx` — Milkdown integration:
    - Install `@milkdown/core`, `@milkdown/preset-commonmark`, `@milkdown/theme-nord` (or headless), `@milkdown/solid` (if available, else use vanilla with SolidJS wrapper)
    - Autosave: debounce 500ms, call `Page.update({ id, body })` on change
    - Show loading state while page loads
  - Create `packages/app/src/pages/workspace/sidebar.tsx` — notebook/page navigation:
    - List notebooks with expand/collapse
    - List pages under each notebook
    - Click to select page (loads in editor)
    - Right-click or icon button for rename/delete
  - When a page is created, also auto-create a corresponding `context_item` with `kind: "page"` and `ref_id: page.id`

  **Must NOT do**:
  - No Notion-style blocks — plain markdown only
  - No slash commands
  - No embeds or file attachments in editor
  - No drag-and-drop page reordering (MVP)
  - No real-time collaboration

  **Parallelizable**: YES (with 9, 10, 11 — Wave 3)

  **References**:

  **Pattern References**:
  - `packages/app/src/pages/project.tsx:81-138` — Current Workspace placeholder (REPLACE this)
  - `packages/app/src/pages/project.tsx:69-79` — `Pane` helper component for section cards
  - `packages/app/src/pages/session.tsx:259-271` — How session page uses context hooks

  **External References**:
  - Milkdown SolidJS recipe: https://milkdown.dev/docs/recipes/solidjs
  - Milkdown getting started: https://milkdown.dev/docs/guide/getting-started
  - @milkdown/core, @milkdown/preset-commonmark — core packages

  **Acceptance Criteria**:
  - [ ] Workspace tab shows notebook sidebar + editor pane
  - [ ] Can create a new notebook
  - [ ] Can create a new page in a notebook
  - [ ] Selecting a page loads its content in Milkdown editor
  - [ ] Editing content autosaves after 500ms debounce
  - [ ] Can rename and delete notebooks/pages
  - [ ] Creating a page auto-creates a context_item
  - [ ] `cd packages/app && bun run typecheck && bun run build` passes

  **Manual Verification**:
  - [ ] Navigate to Workspace tab in browser
  - [ ] Create "Test Notebook" — appears in sidebar
  - [ ] Create "Test Page" — appears under notebook
  - [ ] Type markdown content — saves automatically (check network tab for API call after 500ms)
  - [ ] Reload page — content persists
  - [ ] Delete page — removed from sidebar

  **Commit**: YES
  - Message: `feat(app): build workspace tab with milkdown editor`
  - Files: `packages/app/src/pages/workspace/index.tsx`, `packages/app/src/pages/workspace/editor.tsx`, `packages/app/src/pages/workspace/sidebar.tsx`, `packages/app/src/pages/project.tsx`
  - Pre-commit: `cd packages/app && bun run typecheck`

---

- [ ] 9. Build Tasks tab (Kanban board)

  **What to do**:
  - Replace the inline `Tasks()` placeholder in `packages/app/src/pages/project.tsx` (lines 140-177) with a real implementation
  - Create `packages/app/src/pages/tasks/index.tsx` — kanban board layout:
    - 4 columns: Backlog, In Progress, Review, Done
    - Each column shows task cards filtered by status
    - Header with "New Task" button
  - Create `packages/app/src/pages/tasks/column.tsx` — kanban column:
    - Column header with title + task count
    - Droppable zone using `@thisbeyond/solid-dnd` (createDroppable)
    - Renders task cards
  - Create `packages/app/src/pages/tasks/card.tsx` — task card:
    - Draggable using `@thisbeyond/solid-dnd` (createDraggable)
    - Shows title, priority badge, assignee
    - Click to expand/edit inline
  - Create `packages/app/src/pages/tasks/create.tsx` — new task dialog:
    - Title, priority select, optional assignee
    - Creates task with status "backlog"
  - DnD: Use `DragDropProvider` + `DragDropSensors` + `closestCenter` from @thisbeyond/solid-dnd
  - On drag end: call `Task.move({ id, status: targetColumn, position })` to update status and position

  **Must NOT do**:
  - No column add/rename/delete (hardcoded 4 columns)
  - No task dependencies or subtasks
  - No time tracking
  - No swimlanes
  - No filters or search (MVP)

  **Parallelizable**: YES (with 8, 10, 11 — Wave 3)

  **References**:

  **Pattern References**:
  - `packages/app/src/pages/project.tsx:140-177` — Current Tasks placeholder (REPLACE this)
  - `packages/app/src/pages/project.tsx:31-36` — Existing mock board data structure

  **External References**:
  - @thisbeyond/solid-dnd docs: https://solid-dnd.com
  - Sortable list examples: https://solid-dnd.com/docs/guides/sortable

  **Acceptance Criteria**:
  - [ ] Tasks tab shows 4-column kanban board
  - [ ] Can create new task via dialog
  - [ ] Task appears in Backlog column
  - [ ] Can drag task between columns (status changes)
  - [ ] Task card shows title + priority badge
  - [ ] Can click task to edit title/body/priority
  - [ ] Can delete task
  - [ ] `cd packages/app && bun run typecheck && bun run build` passes

  **Manual Verification**:
  - [ ] Navigate to Tasks tab
  - [ ] Click "New Task" — fill title "Fix login bug", set priority High
  - [ ] Card appears in Backlog
  - [ ] Drag card to "In Progress" column — status updates
  - [ ] Click card — edit body with description
  - [ ] Reload — task persists in correct column

  **Commit**: YES
  - Message: `feat(app): build tasks tab with kanban board`
  - Files: `packages/app/src/pages/tasks/index.tsx`, `packages/app/src/pages/tasks/column.tsx`, `packages/app/src/pages/tasks/card.tsx`, `packages/app/src/pages/tasks/create.tsx`, `packages/app/src/pages/project.tsx`
  - Pre-commit: `cd packages/app && bun run typecheck`

---

- [ ] 10. Build Context tab (Context bank management)

  **What to do**:
  - Replace the inline `Context()` placeholder in `packages/app/src/pages/project.tsx` (lines 231-266) with a real implementation
  - Create `packages/app/src/pages/context/index.tsx` — context bank layout:
    - List of all context items for the project
    - Group by kind (page, bank, snippet)
    - Show title, kind badge, token count, pinned indicator
    - "New Context Item" button for creating bank/snippet items
  - Create `packages/app/src/pages/context/item.tsx` — context item card/row:
    - Title, kind, token count (from `tokens` column or frontend estimate)
    - Pin toggle (sets `pinned` — global context always included)
    - Edit button for bank/snippet items (inline edit body)
    - Delete button
    - For `kind: "page"` items: show link to source page in Workspace tab
  - Create `packages/app/src/pages/context/create.tsx` — create context item dialog:
    - Kind selector (bank or snippet — page items auto-created)
    - Title input
    - Body textarea (for bank/snippet content)

  **Must NOT do**:
  - No security enforcement UI (just the enum column, no access control)
  - No RAG or semantic search
  - No auto-extraction from pages
  - No file upload/attachment
  - No drag-and-drop reordering

  **Parallelizable**: YES (with 8, 9, 11 — Wave 3)

  **References**:

  **Pattern References**:
  - `packages/app/src/pages/project.tsx:231-266` — Current Context placeholder (REPLACE this)
  - `packages/ui/src/components/tag.tsx` — Tag component for kind badges
  - `packages/ui/src/components/switch.tsx` — Switch toggle for pinned state

  **Acceptance Criteria**:
  - [ ] Context tab shows list of all context items
  - [ ] Items grouped by kind with badges
  - [ ] Token count displayed per item
  - [ ] Can create new bank/snippet items
  - [ ] Can edit bank/snippet body
  - [ ] Can pin/unpin items (global context toggle)
  - [ ] Can delete items
  - [ ] Page-kind items show "View in Workspace" link
  - [ ] `cd packages/app && bun run typecheck && bun run build` passes

  **Manual Verification**:
  - [ ] Navigate to Context tab
  - [ ] See any auto-created page context items (from Workspace tab pages)
  - [ ] Click "New Context Item" — create bank item "Company Guidelines" with body text
  - [ ] Token count appears (e.g., "~143 tokens")
  - [ ] Pin the item — pin indicator shows
  - [ ] Edit the body — token count updates

  **Commit**: YES
  - Message: `feat(app): build context tab with context bank management`
  - Files: `packages/app/src/pages/context/index.tsx`, `packages/app/src/pages/context/item.tsx`, `packages/app/src/pages/context/create.tsx`, `packages/app/src/pages/project.tsx`
  - Pre-commit: `cd packages/app && bun run typecheck`

---

- [ ] 11. Build Agents tab (Agent run display)

  **What to do**:
  - Replace the inline `Agents()` placeholder in `packages/app/src/pages/project.tsx` (lines 179-229) with a real implementation
  - Create `packages/app/src/pages/agents/index.tsx` — agent runs layout:
    - Summary stats: total runs, tokens used, active runs count
    - List of recent agent runs (from AgentRun.list)
    - Each run shows: agent kind, status badge, session link, token counts, duration, timestamp
    - Empty state when no runs exist
  - This is READ-ONLY for MVP — no controls to start/stop/retry runs
  - Agent runs are created by the existing agent system; this tab just displays them

  **Must NOT do**:
  - No agent orchestration controls
  - No start/stop/retry buttons
  - No agent configuration (that's in the global agents page)
  - No real-time streaming of run output
  - No cost calculations

  **Parallelizable**: YES (with 8, 9, 10 — Wave 3)

  **References**:

  **Pattern References**:
  - `packages/app/src/pages/project.tsx:179-229` — Current Agents placeholder (REPLACE this)
  - `packages/app/src/pages/project.tsx:38-54` — Existing mock jobs data structure
  - `packages/ui/src/components/card.tsx` — Card component for run display
  - `packages/ui/src/components/spinner.tsx` — Spinner for active runs

  **Acceptance Criteria**:
  - [ ] Agents tab shows summary stats
  - [ ] Lists recent agent runs with all fields
  - [ ] Status badge colored (queued=gray, running=blue, done=green, failed=red)
  - [ ] Session link navigates to session tab
  - [ ] Empty state shown when no runs
  - [ ] `cd packages/app && bun run typecheck && bun run build` passes

  **Manual Verification**:
  - [ ] Navigate to Agents tab
  - [ ] See empty state (no runs yet)
  - [ ] After running an AI session, check if agent run appears
  - [ ] Verify token counts and status display correctly

  **Commit**: YES
  - Message: `feat(app): build agents tab with run display`
  - Files: `packages/app/src/pages/agents/index.tsx`, `packages/app/src/pages/project.tsx`
  - Pre-commit: `cd packages/app && bun run typecheck`

---

- [ ] 12. Build Session context tray (attach/detach context in session)

  **What to do**:
  - Add a context tray panel to the Session page (`packages/app/src/pages/session.tsx`)
  - Create `packages/app/src/pages/session/context-tray.tsx` — context attachment UI:
    - Collapsible panel below or beside the composer
    - Lists all context items for the project with toggle switches
    - Enabled items show checkmark, token count
    - Disabled items show as available to attach
    - Pinned items shown at top with "Always included" label
    - Total token count display at bottom
    - Quick search/filter for items
  - On toggle: call `SessionContext.toggle({ sessionID, contextID, enabled })`
  - On first session creation: auto-attach all pinned context items
  - Show token budget indicator (total attached tokens vs model context window)

  **Must NOT do**:
  - No drag-and-drop reordering of context items (toggle only)
  - No inline editing of context items (edit in Context tab)
  - No token budget enforcement (display only, don't block)

  **Parallelizable**: NO (depends on 10 — needs context store)

  **References**:

  **Pattern References**:
  - `packages/app/src/pages/session.tsx:1245-1375` — Session page JSX structure (add tray here)
  - `packages/app/src/pages/session/composer/` — Composer area where tray attaches
  - `packages/ui/src/components/switch.tsx` — Toggle switch for enable/disable
  - `packages/ui/src/components/collapsible.tsx` — Collapsible panel
  - `packages/ui/src/components/progress.tsx` — Progress bar for token budget

  **Acceptance Criteria**:
  - [ ] Context tray appears in session page (collapsible)
  - [ ] Shows all project context items with toggle switches
  - [ ] Toggling attaches/detaches context from session
  - [ ] Pinned items shown at top with "Always included"
  - [ ] Total token count displayed
  - [ ] Token budget progress bar visible
  - [ ] `cd packages/app && bun run typecheck && bun run build` passes

  **Manual Verification**:
  - [ ] Open a session in Session tab
  - [ ] Expand context tray
  - [ ] See pinned items auto-attached
  - [ ] Toggle a page context item ON — token count increases
  - [ ] Toggle it OFF — token count decreases
  - [ ] Send a message — AI response should reflect attached context

  **Commit**: YES
  - Message: `feat(app): add session context tray for managing AI context`
  - Files: `packages/app/src/pages/session/context-tray.tsx`, `packages/app/src/pages/session.tsx`
  - Pre-commit: `cd packages/app && bun run typecheck`

---

- [ ] 13. Implement prompt assembly (context -> AI messages)

  **What to do**:
  - Create `packages/opencode/src/session/context-assembly.ts` — prompt assembly function:
    ```
    assemble(sessionID, opts?: { budget?: number }) -> {
      parts: { contextID, title, content, tokens }[],
      total: number,
      dropped: { contextID, title, reason }[],
      budget: number
    }
    ```
  - Logic:
    1. Load enabled session_context rows ordered by: pinned DESC, position ASC, time_updated DESC
    2. For each: resolve content — for `kind: "page"`, read CURRENT page body via ref_id join; for `bank`/`snippet`, use inline body
    3. Compute tokens using gpt-tokenizer (or use cached `tokens` column if body unchanged)
    4. Budget strategy: include pinned first, then remaining in order until budget hit
    5. Return assembled parts + total + any dropped items
  - Integrate into `packages/opencode/src/session/prompt.ts` — inject assembled context parts as system-level content blocks at the beginning of the prompt, BEFORE conversation history
  - Each context part formatted as: `<context title="[title]" tokens="[count]">\n[content]\n</context>`

  **Must NOT do**:
  - Don't modify existing conversation message flow
  - Don't add context to user messages — prepend as system context
  - Don't block sending if over budget — just drop lowest-priority items and warn
  - Don't modify SessionPrompt class extensively — add a hook/injection point

  **Parallelizable**: NO (depends on 12)

  **References**:

  **Pattern References**:
  - `packages/opencode/src/session/prompt.ts` — SessionPrompt.prompt() (1800+ lines) — find injection point for context
  - `packages/opencode/src/session/index.ts:276-330` — Database.use() + fn() pattern for the assembly function
  - `packages/opencode/src/context/index.ts` — SessionContext.list() for fetching attached items

  **External References**:
  - gpt-tokenizer: `import { encode } from "gpt-tokenizer"` → `encode(text).length`

  **Acceptance Criteria**:
  - [ ] `assemble(sessionID)` returns correct parts with resolved content
  - [ ] Pinned items always included first
  - [ ] Budget respects token limit (drops lowest-priority items)
  - [ ] Context injected into AI prompt as system-level blocks
  - [ ] AI responses change based on attached context (verifiable by attaching different content)
  - [ ] `cd packages/opencode && bun run build` passes

  **Manual Verification**:
  - [ ] Create a page with content about "Project X uses React"
  - [ ] Attach that page's context item to a session
  - [ ] Ask the AI "What framework does Project X use?"
  - [ ] AI should respond with "React" (from attached context)
  - [ ] Detach the context item
  - [ ] Ask the same question — AI should not know about Project X

  **Commit**: YES
  - Message: `feat(opencode): implement context prompt assembly for AI sessions`
  - Files: `packages/opencode/src/session/context-assembly.ts`, `packages/opencode/src/session/prompt.ts`
  - Pre-commit: `cd packages/opencode && bun run build`

---

- [ ] 14. Auto-create default notebook and wire up page-to-context

  **What to do**:
  - When a project is first opened (or when Workspace tab first loads with no notebooks), auto-create a "Commonplace" notebook with one blank page titled "Notes"
  - Ensure that whenever a Page is created (via CRUD), a corresponding `context_item` with `kind: "page"` and `ref_id: page.id` is auto-created
  - Ensure that when a Page is deleted, the corresponding `context_item` cascade-deletes (via `ref_id` FK or explicit cleanup in `Page.remove`)
  - Ensure that when a Page body is updated, the `context_item.tokens` cache is invalidated/recomputed

  **Must NOT do**:
  - Don't create multiple default notebooks
  - Don't auto-create context items for notebooks (only pages)
  - Don't auto-attach page context items to sessions (user decides)

  **Parallelizable**: NO (depends on 8, 13)

  **References**:

  **Pattern References**:
  - `packages/opencode/src/notebook/index.ts` — Notebook.create, Page.create (add auto-creation logic here)
  - `packages/opencode/src/context/index.ts` — ContextItem.create (called from Page.create)

  **Acceptance Criteria**:
  - [ ] First visit to Workspace tab creates "Commonplace" notebook with "Notes" page
  - [ ] Creating a new page auto-creates a context_item
  - [ ] Deleting a page removes the context_item
  - [ ] Editing page body recomputes context_item token count
  - [ ] Second visit doesn't create duplicate notebooks
  - [ ] `cd packages/opencode && bun run build` passes

  **Manual Verification**:
  - [ ] Open project for first time — "Commonplace" notebook with "Notes" page exists
  - [ ] Navigate to Context tab — see "Notes" context item with kind "page"
  - [ ] Delete the Notes page — context item disappears from Context tab
  - [ ] Create new page — new context item appears

  **Commit**: YES
  - Message: `feat(opencode): auto-create default notebook and wire page-to-context`
  - Files: `packages/opencode/src/notebook/index.ts`, `packages/opencode/src/context/index.ts`
  - Pre-commit: `cd packages/opencode && bun run build`

---

- [ ] 15. Cross-tab polish and final integration verification

  **What to do**:
  - Verify all tabs work together:
    - Workspace: create page -> Context tab shows it -> Session tray can attach it -> AI uses it
    - Tasks: create task -> (future: attach context to task)
    - Agents: shows runs from sessions that used context
  - Add navigation links between tabs:
    - Context item with `kind: "page"` shows "Open in Workspace" link
    - Task card with context items shows "View Context" link
    - Agent run with session shows "Open Session" link
  - Clean up: remove all mock/hardcoded data from `packages/app/src/pages/project.tsx` (lines 8-67)
  - Ensure empty states are handled for all tabs
  - Verify `bun run typecheck && bun run build` passes for both packages/app and packages/opencode
  - Run `bun run verify:desktop` from repo root

  **Must NOT do**:
  - Don't add new features — polish only
  - Don't refactor existing working code

  **Parallelizable**: NO (final task)

  **References**:
  - `packages/app/src/pages/project.tsx:8-67` — Mock data to remove
  - `packages/app/src/components/project-tabs.tsx` — Tab navigation

  **Acceptance Criteria**:
  - [ ] All mock data removed from project.tsx
  - [ ] Cross-tab navigation links work
  - [ ] Empty states for all tabs
  - [ ] Full flow: notebook page -> context item -> session attachment -> AI response
  - [ ] `cd packages/opencode && bun run build` passes
  - [ ] `cd packages/app && bun run typecheck && bun run build` passes
  - [ ] `bun run verify:desktop` passes (from repo root)

  **Manual Verification**:
  - [ ] Complete end-to-end flow:
    1. Open project -> "Commonplace" notebook exists
    2. Create new page "Company Info" with content "We use SolidJS and Tauri"
    3. Go to Context tab -> see "Company Info" context item
    4. Pin "Company Info" -> shows as always included
    5. Go to Tasks tab -> create task "Update docs"
    6. Go to Session tab -> start new session
    7. Open context tray -> "Company Info" auto-attached (pinned)
    8. Ask AI "What tech stack do we use?" -> AI responds with SolidJS and Tauri
    9. Unpin and detach "Company Info"
    10. Ask same question -> AI doesn't know

  **Commit**: YES
  - Message: `feat(app): cross-tab integration and cleanup`
  - Files: `packages/app/src/pages/project.tsx`, various
  - Pre-commit: `bun run verify:desktop`

---

## Commit Strategy

| After Task | Message                                                                            | Key Files                                  | Verification            |
| ---------- | ---------------------------------------------------------------------------------- | ------------------------------------------ | ----------------------- |
| 1          | `feat(opencode): add schema for notebooks, tasks, context, and agent runs`         | `*.sql.ts`, `schema.ts`                    | `bun run build`         |
| 2          | `feat(opencode): add migration for ideaspace workspace tables`                     | `migration/`                               | `bun drizzle-kit check` |
| 3          | `feat(opencode): add bus events for workspace entities`                            | `*/index.ts`                               | `bun run build`         |
| 4          | `feat(opencode): add CRUD functions for notebooks, tasks, context, and agent runs` | `*/index.ts`                               | `bun run build`         |
| 5          | `feat(opencode): add API routes for notebooks, tasks, context, and agent runs`     | `routes/*.ts`, `server.ts`                 | `bun run build`         |
| 6          | `feat(app): regenerate SDK and add SSE event handling`                             | `sdk/`, `global-sync.tsx`                  | `bun run typecheck`     |
| 7          | `feat(app): add context providers for notebooks, tasks, and context bank`          | `context/*.tsx`                            | `bun run typecheck`     |
| 8          | `feat(app): build workspace tab with milkdown editor`                              | `pages/workspace/`                         | `bun run typecheck`     |
| 9          | `feat(app): build tasks tab with kanban board`                                     | `pages/tasks/`                             | `bun run typecheck`     |
| 10         | `feat(app): build context tab with context bank management`                        | `pages/context/`                           | `bun run typecheck`     |
| 11         | `feat(app): build agents tab with run display`                                     | `pages/agents/`                            | `bun run typecheck`     |
| 12         | `feat(app): add session context tray`                                              | `session/context-tray.tsx`                 | `bun run typecheck`     |
| 13         | `feat(opencode): implement context prompt assembly`                                | `session/context-assembly.ts`, `prompt.ts` | `bun run build`         |
| 14         | `feat(opencode): auto-create default notebook and wire page-to-context`            | `notebook/index.ts`, `context/index.ts`    | `bun run build`         |
| 15         | `feat(app): cross-tab integration and cleanup`                                     | various                                    | `verify:desktop`        |

---

## Success Criteria

### Verification Commands

```bash
cd packages/opencode && bun run build          # Backend compiles
cd packages/app && bun run typecheck           # Frontend types OK
cd packages/app && bun run build               # Frontend bundles
bun run verify:desktop                          # Full desktop stack
```

### Final Checklist

- [ ] All 7 tables created and migrated
- [ ] All 4 tabs render real data (not mock)
- [ ] Milkdown editor loads and autosaves
- [ ] Kanban drag-drop changes task status
- [ ] Context items can be created, pinned, attached to sessions
- [ ] Session context tray toggles items with token counts
- [ ] AI responses reflect attached context
- [ ] Default "Commonplace" notebook auto-created
- [ ] Cross-tab navigation works
- [ ] No TypeScript errors
- [ ] No mock data remaining in production code
- [ ] `verify:desktop` passes
