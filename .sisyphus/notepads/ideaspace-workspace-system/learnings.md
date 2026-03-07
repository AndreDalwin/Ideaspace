# Ideaspace Workspace System - Learnings

## Conventions and Patterns

### Plan File Naming

- `packages/ideaspace/src/session/index.ts:333-338` is the canonical source of truth for plan-file naming and location
- Plans are stored in `.ideaspace/plans/*.md` with timestamp-based filenames

### Plan Mode Flow

- Plan mode is experimental and gated by `IDEASPACE_EXPERIMENTAL_PLAN_MODE=1`
- `PlanExitTool` exists in `packages/ideaspace/src/tool/plan.ts`
- `PlanEnterTool` needs to be restored alongside it

### Task Conversion Format

- Planner should output tasks in `## TODOs` section
- Format: `- [ ] Task Title` with optional nested bullets
- Metadata support: `- id: task-id`, `- depends-on: other-task-id`
- Nested bullets become task body/description

## Dependencies

- Task 1 -> Task 2 -> Task 3 -> Task 4 -> Task 5 (critical path)
- Task 6 depends on Task 3 and Task 5

## Key Files

- Plan tools: `packages/ideaspace/src/tool/plan.ts`
- Tool registry: `packages/ideaspace/src/tool/registry.ts`
- Session prompt: `packages/ideaspace/src/session/prompt.ts`
- Session index: `packages/ideaspace/src/session/index.ts`
- Agent permissions: `packages/ideaspace/src/agent/agent.ts`

## Verification Commands

- `cd packages/ideaspace && bun run build`
- `cd packages/app && bun run typecheck && bun run test:unit && bun run build`
- `bun run verify:desktop`

---

## Session Log

### 2026-03-07 - Session ses_337f14aa7ffeBI1uZwzgP0w9Xe

- Initialized work session for ideaspace-workspace-system plan
- Starting with Task 1: Planner output format alignment

---

## Session Log - Task 1 Completion

### 2026-03-07 - Task 1 Completed

**Changes Made:**

1. **Restored PlanEnterTool** (`packages/ideaspace/src/tool/plan.ts`)
   - Uncommented the PlanEnterTool that was previously commented out (lines 74-131)
   - Added import for ENTER_DESCRIPTION from plan-enter.txt
   - Tool allows users to enter plan mode from any session

2. **Created plan-enter.txt** (`packages/ideaspace/src/tool/plan-enter.txt`)
   - Description file for the PlanEnterTool
   - Already existed with appropriate content

3. **Updated Tool Registry** (`packages/ideaspace/src/tool/registry.ts`)
   - Changed line 1 to import both PlanEnterTool and PlanExitTool
   - Changed line 122 to register both tools when IDEASPACE_EXPERIMENTAL_PLAN_MODE is enabled
   - Removed the CLI-only restriction so app/desktop can use plan mode
   - Before: `...(Flag.IDEASPACE_EXPERIMENTAL_PLAN_MODE && Flag.IDEASPACE_CLIENT === "cli" ? [PlanExitTool] : [])`
   - After: `...(Flag.IDEASPACE_EXPERIMENTAL_PLAN_MODE ? [PlanEnterTool, PlanExitTool] : [])`

4. **Updated Planner Prompt** (`packages/ideaspace/src/session/prompt.ts`)
   - Added `## TODOs Section Format` guidance after Plan File Info section
   - Documented checkbox format: `- [ ] Task Title` or `- [x] Task Title`
   - Documented metadata lines: `- id: task-id`, `- depends-on: other-task-id`
   - Documented that other nested bullets become task body
   - Added example showing all features

5. **Fixed Missing Theme File** (`packages/ideaspace/src/cli/cmd/tui/context/theme/opencode.json`)
   - Created missing theme file that was blocking the build
   - Based on existing ayu.json theme

**Verification:**

- `cd packages/ideaspace && bun run build` passes
- All 11 build targets completed successfully:
  - ideaspace-linux-arm64
  - ideaspace-linux-x64
  - ideaspace-linux-x64-baseline
  - ideaspace-linux-arm64-musl
  - ideaspace-linux-x64-musl
  - ideaspace-linux-x64-baseline-musl
  - ideaspace-darwin-arm64
  - ideaspace-darwin-x64
  - ideaspace-darwin-x64-baseline
  - ideaspace-windows-x64
  - ideaspace-windows-x64-baseline

**Key Implementation Details:**

- PlanEnterTool asks user for confirmation before switching to plan agent
- On approval, creates a new user message with agent="plan" to trigger plan mode
- PlanExitTool remains unchanged - still asks for confirmation before switching to build agent
- Both tools now available in app/desktop when IDEASPACE_EXPERIMENTAL_PLAN_MODE=1
- Planner guidance describes standard markdown checkbox format for tasks
- Task dependencies use comma-separated IDs in depends-on field

---

## Session Log - Task 2 Completion

### 2026-03-07 - Task 2 Completed

**Changes Made:**

1. Wrapped `ProjectRoute` with `FileProvider` so the Workspace shell reuses the existing file list/refresh lifecycle.
2. Added `packages/app/src/pages/workspace/state.ts` to scope plan files to `.ideaspace/plans`, filter `.md` files, track the selected plan path, automatically select the newest entry, and load the selected plan content via the file context.
3. Exported the new workspace state helpers through `packages/app/src/pages/workspace/index.ts` for future UI consumption.

**Verification:**

- `cd packages/app && bun run typecheck && bun run build` passes

**Key Implementation Details:**

- `createWorkspaceState` now lists `.ideaspace/plans`, sorts markdown entries by `modified` metadata (with defensive typing), and keeps `previousCount` to detect newly added files.
- The selected path is auto-updated whenever the directory gains files or the previous selection disappears, and the selected file is explicitly loaded via `file.load` so preview data stays fresh.
- `selectedContent` relies on `file.get` to surface the current plan contents without additional caching layers, and the workspace state exposes a `refresh` helper for UI triggers.

---

## Session Log - Task 3 Completion

### 2026-03-07 - Task 3 Completed

**Changes Made:**

1. **Created Workspace UI** (`packages/app/src/pages/workspace/workspace.tsx`)
   - Left sidebar with plan file list (from `.ideaspace/plans/*.md`)
   - Main area with markdown preview using `<Markdown>` component
   - Action buttons: Start planner session, Open AI session, Convert to Tasks
   - Refresh button to reload plan list
   - Selected file highlighting and date display

2. **Updated Workspace Exports** (`packages/app/src/pages/workspace/index.ts`)
   - Added default export for Workspace component
   - Preserved existing exports for `createWorkspaceState` and `PlanFile`

3. **Updated Project Page** (`packages/app/src/pages/project.tsx`)
   - Added import for Workspace component from `./workspace`
   - Removed old inline placeholder Workspace function (lines 81-138)

**Verification:**

- `cd packages/app && bun run typecheck && bun run build` passes
- Build completed successfully with no errors

**Key Implementation Details:**

- `FileContent` from SDK is an object with `{ type: "text" | "binary", content: string, ... }`
- Must access `.content` property to get the markdown text string
- Used `createMemo` to extract text content and filter for type="text" files only
- `Markdown` component from `@opencode-ai/ui/markdown` takes a `text` prop (string)
- Icon names must match those in `packages/ui/src/components/icon.tsx` - no "refresh" icon exists
- Used "arrow-down-to-line" icon for refresh functionality
- `ScrollView` provides smooth scrolling for both sidebar list and preview area
- Styling follows existing patterns: `border-border-weak-base`, `rounded-xl`, `text-13-regular`, etc.
- Navigation uses `<A>` from `@solidjs/router` for session links with query params
- `Convert to Tasks` button is disabled when no plan is selected (stub for Task 4)
- `Start planner session` navigates to `/{dir}/session?prompt={encodedSeed}`

---

## Session Log - Task 4 Completion

### 2026-03-07 - Task 4 Completed

**Changes Made:**

1. **Created Task Board Service** (`packages/ideaspace/src/task-board/index.ts`)
   - `TaskBoard.read()` - reads or initializes `.ideaspace/tasks.json`
   - `TaskBoard.write()` - persists board state to JSON file
   - `TaskBoard.save()` - updates timestamps and persists
   - `TaskBoard.importFromPlan()` - parses plan file and imports tasks
   - Source key computation for duplicate detection (hash of plan path + content)
   - Parses checkbox format: `- [ ]` → backlog, `- [x]` → done
   - Extracts metadata: `id: xxx`, `depends-on: y, z`
   - Other nested bullets become task body

2. **Created HTTP Routes** (`packages/ideaspace/src/server/routes/task-board.ts`)
   - `GET /task-board` - read/initialize task board
   - `POST /task-board/import` - import tasks from plan file
   - `PATCH /task-board` - save board state after move/edit
   - Full OpenAPI spec with Zod schemas for request/response validation

3. **Registered Routes** (`packages/ideaspace/src/server/server.ts`)
   - Added import: `import { TaskBoardRoutes } from "./routes/task-board"`
   - Added route: `.route("/task-board", TaskBoardRoutes())`

**Verification:**

- `cd packages/ideaspace && bun run build` passes
- All 11 build targets completed successfully

**Key Implementation Details:**

- Uses `Filesystem.readText` and `Filesystem.writeJson` from `@/util/filesystem`
- Board path: `path.join(Instance.worktree, ".ideaspace", "tasks.json")`
- Task ID generation: `tsk_${Date.now()}_${random(6)}`
- Duplicate detection via `source.key` (hash of plan path + block content)
- Plan parsing looks for `## TODOs?` section, parses until next header
- Tasks imported with positions based on count in target column
- Route patterns follow existing Hono + hono-openapi conventions
- Uses `describeRoute`, `validator`, `resolver` for OpenAPI spec generation

## Session Log - Task 5 Completion

### 2026-03-07 - Task 5 Completed

**Changes Made:**

1. **Created Tasks State Module** (`packages/app/src/pages/tasks/state.ts`)
   - `Task` and `TaskBoard` type definitions
   - `createTasksState()` with SolidJS store for board management
   - `load()` - fetches board from backend via GET /task-board
   - `save()` - persists board via PATCH /task-board
   - `isBlocked()` - checks if task has unresolved dependencies
   - `moveTask()` - moves task between columns with blocked task prevention
   - Columns are memoized and sorted by position

2. **Created Kanban UI** (`packages/app/src/pages/tasks/index.tsx`)
   - 4 columns: Backlog, In Progress, Review, Done
   - Task cards with title, body preview, and dependency badges
   - Blocked tasks show warning styling and badge
   - Native HTML5 drag-and-drop for cross-column movement
   - Blocked tasks cannot be dragged (cursor: not-allowed)
   - Drag-over states highlight columns
   - Refresh button and saving indicator

3. **Updated Project Page** (`packages/app/src/pages/project.tsx`)
   - Import Tasks from new `./tasks` location
   - Removed inline Tasks() placeholder function (lines 76-113)
   - Removed unused `board` constant

**Key Implementation Details:**

- SDK client methods `taskBoard.get` and `taskBoard.patch` don't exist in generated SDK yet
- Used type assertion to access raw client methods: `sdk.client as unknown as { get: ..., patch: ... }`
- Native HTML5 drag-and-drop used instead of @thisbeyond/solid-dnd for simpler cross-column movement
- Drag events use native DragEvent type from DOM, not solid-dnd's DragEvent
- Blocked task detection: checks if all deps have status "done"
- Position is set to end of target column on move

**Verification:**

- `cd packages/app && bun run typecheck && bun run build` passes
- Build completed successfully

---

## Session Log - Task 6 Completion

### 2026-03-07 - Task 6 Completed

**Changes Made:**

1. Cleaned up `packages/app/src/pages/project.tsx` by removing outdated mock data and inline placeholders, then routing to the new `workspace` and `tasks` components.
2. Swapped the Agents and Context panes for future-release copy so they are explicitly out of scope for the MVP.
3. Wired the Workspace "Convert to Tasks" button to `POST /task-board/import`, showing converting state, disabling the button while the import runs, and surfacing the import summary inline plus an alert.

**Verification:**

- `cd packages/app && bun run typecheck && bun run test:unit && bun run build`
- `cd packages/ideaspace && bun run build`
- `bun run verify:desktop`
