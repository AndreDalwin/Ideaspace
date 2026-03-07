# Draft: Ideaspace Workspace System

## Requirements (confirmed)

- **Workspace Tab** = Markdown notebook (commonplace notebook style). Default notebook for ideas, can split into separate notebooks for organization. Content here is what you work with. Not just code - campaigns, financial analysis, reviews, general-purpose workflows.
- **Key differentiator**: Choose what to include in AI conversations to save tokens/memory. This is the core "Ideaspace moment."
- **Tasks Tab** = Kanban board with workflow templates. Users can set up templates of their workflows. Task assignment to users or AI agents. Due dates & priorities.
- **Agents Dashboard** = Multi-agent system (Writer, Editor, Researcher, Reviewer). Real-time progress, token tracking, task queue, agent logs.
- **Context Management** = Context Bank for reusable knowledge, templates, personas. Global context (always in prompts), attached context (per-session), token optimization, security levels.
- **Command Palette** = Raycast/Linear style Cmd+K. Fuzzy search for files, commands, AI actions. Context-aware suggestions.

## Technical Decisions

### Data Storage: SQLite-first (not file-first)

- **Rationale**: The app already has Drizzle/SQLite, SSE/Bus events, migration tooling. Reusing it reduces integration risk. File export/import can be Phase 2.
- **Source**: Oracle consultation recommendation

### Core Abstraction: `context_item` as the universal "stuff AI can see"

- **Rationale**: Unifies notebook pages, context bank entries, file references, and snippets under one primitive. Prevents combinatorial explosion of link tables.
- **Pattern**: `context_item` has a `kind` field (page|bank|file|snippet) and a polymorphic pointer (`ref_kind`, `ref_id`) so edits to source pages immediately affect context without sync bugs.

### Editor: Milkdown (@milkdown/solid)

- **Rationale**: 11K stars, actively maintained (PR merged same day as research), official SolidJS recipe, plugin-driven ProseMirror + Remark, headless core
- **Alternatives considered**: solid-tiptap (stale, no NodeViews), solid-codemirror (good for code, not notebook), Lexical (too risky, low adoption)

### Kanban DnD: @thisbeyond/solid-dnd (already installed)

- **Rationale**: Already in the app, stable, supports multi-container kanban via manual onDragEnd state management

### Command Palette UI: cmdk-solid

- **Rationale**: Direct SolidJS port of cmdk (Linear/Vercel standard). App already has CommandProvider with keybind registry - cmdk-solid adds the fuzzy search UI layer on top.

### Token Counting: gpt-tokenizer (backend) + fast estimate (frontend)

- **Rationale**: Backend is source of truth for actual token counts. Frontend uses `Math.ceil(text.length / 3.5)` for instant feedback during editing.

### Task-to-Agent: Separate `agent_run` from `session`

- **Rationale**: Not every automation needs conversational history. Keep chat model clean. Assign creates a lightweight state change; "Run" creates the actual session/run.

## Research Findings

### Existing Codebase Patterns (from explore agents)

- **State**: `createStore` + `createSimpleContext` pattern everywhere
- **Data flow**: GlobalSDK (SSE) -> GlobalSync (stores) -> SDK (per-directory) -> Sync (per-session)
- **Routes**: `lazy(() => new Hono())` + `describeRoute()` + `validator()` + `resolver()`
- **DB**: `fn()` wrapped CRUD, `Database.effect(() => Bus.publish(...))` for events
- **Commands**: `command.register("key", () => [...CommandOption[]])` pattern
- **New tab**: Add to `tabs` in project-tabs.tsx, route in app.tsx, Match in project.tsx

### External Reference Implementations

- **Novel** (16K stars): Notion-style editor with AI completion, slash commands, bubble menu
- **Vibe Kanban** (22.5K stars): AI-agent kanban, task->workspace link via parent_workspace_id, executor profiles for agent assignment
- **cmdk** (12.3K stars): Standard command palette with fuzzy scoring algorithm

## Proposed Data Model

### New Tables

```
notebook
  id: text PK
  project_id: text FK -> project.id CASCADE
  name: text
  icon: text (nullable)
  position: integer
  ...Timestamps

page
  id: text PK
  notebook_id: text FK -> notebook.id CASCADE
  title: text
  body: text (markdown)
  position: integer
  ...Timestamps

context_item
  id: text PK
  project_id: text FK -> project.id CASCADE
  kind: text (page|bank|file|snippet)
  ref_kind: text (nullable - for polymorphic pointer)
  ref_id: text (nullable - for polymorphic pointer)
  title: text
  body: text (nullable - direct content for bank/snippet kinds)
  security: text (public|internal|confidential|restricted)
  pinned: integer (boolean - global context = always included)
  tokens_cached: integer (nullable - cached token count)
  ...Timestamps

session_context
  session_id: text FK -> session.id CASCADE
  context_item_id: text FK -> context_item.id CASCADE
  enabled: integer (boolean)
  position: integer
  PK: (session_id, context_item_id)
  ...Timestamps

task
  id: text PK
  project_id: text FK -> project.id CASCADE
  board_id: text (nullable - for future multi-board)
  title: text
  body: text (nullable, markdown)
  status: text (column ID from template)
  priority: text (urgent|high|medium|low)
  assignee_kind: text (user|agent, nullable)
  assignee_id: text (nullable)
  due_at: integer (nullable)
  position: integer
  ...Timestamps

task_context
  task_id: text FK -> task.id CASCADE
  context_item_id: text FK -> context_item.id CASCADE
  PK: (task_id, context_item_id)
  ...Timestamps

board_template
  id: text PK
  project_id: text FK -> project.id CASCADE
  name: text
  config: text (json - columns, wip limits, etc.)
  ...Timestamps

agent_run
  id: text PK
  task_id: text FK -> task.id (nullable)
  session_id: text FK -> session.id (nullable)
  agent_kind: text
  status: text (queued|running|done|failed)
  summary: text (nullable)
  tokens_in: integer (nullable)
  tokens_out: integer (nullable)
  cost_usd: text (nullable)
  started_at: integer (nullable)
  ended_at: integer (nullable)
  ...Timestamps
```

### Prompt Assembly Backend Function

```
assemble(session_id, opts) ->
  1. Load session + model settings (budget)
  2. Load enabled session_context rows ordered by pinned desc, position asc, updated_at desc
  3. For each: resolve content (page body, bank body, file content), compute tokens
  4. Budget strategy: pinned first, then remaining in order until budget hit
  5. Return: { prompt_parts[], total_tokens, dropped_items[], budget }
```

## Hackathon MVP Scope (Oracle-recommended)

### MUST HAVE (demos the differentiator)

1. Workspace notebook with pages (Milkdown editor, autosave to SQLite)
2. Session context tray (sidebar panel + quick toggle near composer) with attach/detach pages, per-item tokens, session total
3. AI responses change based on what's attached (end-to-end prompt assembly)
4. Basic kanban with drag-drop (3-4 columns, task CRUD, priorities)

### SHOULD HAVE (strengthens demo)

5. Context bank items (reusable knowledge separate from pages)
6. Task-to-context linking (attach context items to tasks)
7. Default "Commonplace" notebook auto-created on project open

### NICE TO HAVE (if time allows)

8. Workflow templates for kanban
9. Agent assignment + basic run logs
10. Enhanced command palette with cmdk-solid
11. Token budget visualization (progress bar)

### NICE TO HAVE (if time allows)

7. Workflow templates for kanban
8. Agent assignment + basic run logs
9. Enhanced command palette with cmdk-solid
10. Token budget visualization (progress bar)

### DEFER

- Full workflow template UI builder
- Security enforcement (encryption, redaction) - keep enum + filter only
- Semantic retrieval / embeddings / RAG
- Multi-agent orchestration (single agent run with streamed logs is enough)
- File export/import for notebooks

## Resolved Questions

- **Default notebook**: YES - auto-create a "Commonplace" notebook with one blank page when project first opens
- **Context tray location**: BOTH - full context sidebar panel in Session + compact quick toggle near composer
- **Hackathon priority**: EQUAL SPLIT - build notebook, context, AND kanban in parallel (each feature reasonably complete)
- **Test strategy**: MANUAL VERIFICATION ONLY - no automated tests for hackathon speed
- **Autosave debounce**: 500ms (reasonable default, can adjust)
- **Token caching**: Cache in DB (`tokens_cached` column on context_item), recompute on body change

## Scope Boundaries

- INCLUDE: Workspace tab (notebook), Tasks tab (kanban), Context management, prompt assembly
- EXCLUDE: Full agent dashboard (Phase 2), workflow template builder UI, security enforcement beyond enums, file-based notebooks, semantic search
