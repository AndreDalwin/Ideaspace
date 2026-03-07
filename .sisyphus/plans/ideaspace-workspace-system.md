# Ideaspace Workspace + Kanban MVP

## TL;DR

> **Summary**: Build only the Workspace tab and Tasks/Kanban tab for this pass. Workspace is powered by `.ideaspace/plans/*.md`, the planner is nudged to output checkbox-friendly markdown with optional dependency metadata, and the open plan can be converted once into kanban cards stored in `.ideaspace/tasks.json`.
>
> **Deliverables**:
>
> - Planner output format aligned to markdown checkboxes plus nested detail bullets
> - Optional dependency metadata in plan markdown and persisted task dependencies in Kanban
> - Workspace tab backed by `.ideaspace/plans/*.md` with auto-open for newly created plans
> - `Convert to Tasks` action on the open Workspace plan
> - Lightweight task-board backend over `.ideaspace/tasks.json`
> - Kanban UI that imports plan checkboxes one time and persists board changes
> - Explicitly out-of-scope Context Bank and project Agents work for this plan
>
> **Effort**: Medium
> **Parallel**: YES - 3 waves
> **Critical Path**: 1 → 2 → 3 → 4 → 5

## Context

### Original Request

Refocus the plan so it only works on the Workspace and Kanban tabs. The planner should default to markdown that uses `[ ]` checkboxes, with nested `-` bullet lines as extra task info. When a plan is open in Workspace, there should be a button to convert those plan items into kanban tasks. The board also needs lightweight task dependencies so X/Z can wait on Y.

### Interview Summary

- Scope is now only **Workspace** and **Kanban/Tasks**.
- Context Bank should be noted for the app, but not implemented in this plan.
- Planner markdown should use this structure by default:
  ```md
  - [ ] Task title
    - extra detail line 1
    - extra detail line 2
  ```
- Workspace should auto-open a newly created plan file immediately.
- `Convert to Tasks` runs on the **currently open plan**.
- Conversion is **one-time import**, not re-import replace and not live sync.
- Dependencies should come from the plan itself so the board can show blocked work and prerequisite order.

### Metis Review (gaps addressed)

- The original plan overbuilt four tabs and several backend domains. This rewrite cuts scope to the two tabs the user wants right now.
- Metis highlighted hidden architecture risk around planner-file flow in app/desktop; this remains part of the critical path.
- Metis also highlighted the danger of fake or non-persistent kanban state. Resolution: use a small file-backed board service around `.ideaspace/tasks.json` instead of a database or local-only board.

---

## Work Objectives

### Core Objective

Make Ideaspace feel real in the two most important surfaces for the current MVP: a Workspace where planner-authored markdown plans live, and a Kanban board that can import those plan tasks once and then evolve independently.

### Deliverables

1. Planner flow in app/desktop creates checkbox-friendly plans in `.ideaspace/plans/*.md`.
2. Workspace lists and previews plan files, auto-selecting the newest or newly created plan.
3. Open plans expose a `Convert to Tasks` action.
4. `.ideaspace/tasks.json` persists a real kanban board.
5. Tasks tab renders that board, supports moving cards between columns, and respects task dependencies.

### Definition of Done

- [ ] `cd packages/ideaspace && bun run build` passes
- [ ] `cd packages/app && bun run typecheck && bun run test:unit && bun run build` passes
- [ ] `bun run verify:desktop` passes from repo root
- [ ] Opening `http://localhost:4444/L1VzZXJzL2FuZHJlZGFsd2ludGFuL0RvY3VtZW50cy9Qcm9qZWN0cy9JZGVhc3BhY2U=/workspace` shows files from `/Users/andredalwintan/Documents/Projects/Ideaspace/.ideaspace/plans`
- [ ] Creating a new planner-generated plan causes Workspace to select that new file and render its markdown immediately
- [ ] Clicking `Convert to Tasks` on the open plan creates or updates `/Users/andredalwintan/Documents/Projects/Ideaspace/.ideaspace/tasks.json` without duplicating already imported items from the same plan block
- [ ] Opening `http://localhost:4444/L1VzZXJzL2FuZHJlZGFsd2ludGFuL0RvY3VtZW50cy9Qcm9qZWN0cy9JZGVhc3BhY2U=/tasks` shows imported cards in Kanban columns
- [ ] Tasks with unmet dependencies visibly show as blocked and cannot move out of `backlog` until prerequisite tasks are `done`
- [ ] Context Bank and project Agents remain untouched by this implementation plan except for explicit out-of-scope copy if needed

### Must Have

- `.ideaspace/plans` as the Workspace source of truth
- Planner default prompt guidance that produces checkbox-friendly markdown under `## TODOs`
- Auto-open newly created plan file in Workspace
- `Convert to Tasks` uses the currently open plan only
- Nested bullet lines under a checkbox become the task body/description
- `.ideaspace/tasks.json` as the Kanban source of truth
- One-time import behavior with duplicate prevention by source key
- Four fixed columns: `backlog`, `progress`, `review`, `done`
- Optional dependency metadata in plan markdown and persisted `deps` arrays in task data

### Must NOT Have

- No notebook/page database
- No task database or Drizzle migration
- No Context Bank implementation in this plan
- No project Agents rewrite in this plan
- No live sync between plan markdown and kanban
- No re-import-replace behavior that overwrites existing task movement/edit state
- No Milkdown or rich-text editor work
- No new generic file-write API for the whole app; keep writes scoped to the lightweight task-board service
- No hidden dependency graph without explicit plan metadata

---

## Verification Strategy

> ZERO HUMAN INTERVENTION — all verification is agent-executed.

- **Test decision**: tests-after
- **Framework**: existing `typecheck`, `test:unit`, `build`, `verify:desktop`, plus browser automation via `agent-browser`
- **QA policy**: every task includes a concrete file/UI verification path
- **Evidence**: `.sisyphus/evidence/task-{N}-{slug}.{ext}`

---

## Execution Strategy

### Parallel Execution Waves

Wave 1: planner and Workspace foundation

- 1. Align planner output format and plan-mode flow for app/desktop
- 2. Reuse file APIs for Workspace plan state and auto-open behavior
- 3. Build Workspace browser + preview + conversion affordance

Wave 2: file-backed Kanban

- 4. Add lightweight task-board backend over `.ideaspace/tasks.json`
- 5. Build Kanban UI and one-time import flow

Wave 3: shell polish and scope lock

- 6. Polish Workspace/Tasks integration and keep Context/Agents out of scope

### Dependency Matrix

| Task | Depends On | Reason                                                 |
| ---- | ---------- | ------------------------------------------------------ |
| 1    | none       | planner output contract and plan flow must exist first |
| 2    | 1          | Workspace state should track the final plan file flow  |
| 3    | 2          | Workspace UI consumes the shared plan state            |
| 4    | 3          | conversion contract depends on the open Workspace plan |
| 5    | 4          | Kanban UI depends on the real board/import service     |
| 6    | 3, 5       | final polish depends on both main tabs being real      |

### Agent Dispatch Summary

| Wave | Task Count | Categories                                        |
| ---- | ---------- | ------------------------------------------------- |
| 1    | 3          | `unspecified-high`, `quick`, `visual-engineering` |
| 2    | 2          | `unspecified-high`, `visual-engineering`          |
| 3    | 1          | `quick`                                           |

---

## TODOs

> Implementation + Test = ONE task. Never separate.
> EVERY task includes QA scenarios.

- [ ] 1. Align planner output format and app/desktop plan flow

  **What to do**:
  - Keep `packages/ideaspace/src/session/index.ts:333-338` as the only source of truth for plan-file naming and location.
  - Ensure plan-mode tools are available in app/desktop sessions when experimental plan mode is enabled, not only in CLI-only paths.
  - Restore `PlanEnterTool` in `packages/ideaspace/src/tool/plan.ts` and register it beside `PlanExitTool` for app/desktop plan mode.
  - Update the plan-mode reminder in `packages/ideaspace/src/session/prompt.ts:1388-1453` so the planner defaults to a task-convertible markdown format:
    - use a `## TODOs` section
    - each task starts with `- [ ] Title`
    - optional metadata lines use nested bullets:
      - `- id: task-id`
      - `- depends-on: other-task-id, another-task-id`
    - nested `-` bullet lines become additional task info
  - Keep the planner free to write normal prose elsewhere in the plan; only the task section needs to follow the conversion contract.

  **Must NOT do**:
  - Do not rename plan files to a single fixed `plan.md`
  - Do not invent a second plan-write system outside `Session.plan()`
  - Do not require live task sync semantics in the planner prompt

  **Recommended Agent Profile**:
  - Category: `unspecified-high` — Reason: backend plan flow + prompt contract
  - Skills: `[]`
  - Omitted: `['frontend-ui-ux']`

  **Parallelization**: Can Parallel: YES | Wave 1 | Blocks: 2, 3, 6 | Blocked By: none

  **References**:
  - Pattern: `packages/ideaspace/src/session/index.ts:333-338` — canonical `.ideaspace/plans/*.md` helper
  - Pattern: `packages/ideaspace/src/session/prompt.ts:1353-1457` — current plan-mode prompt injection and directory creation
  - Pattern: `packages/ideaspace/src/tool/plan.ts:19-131` — `PlanExitTool` and commented plan-entry flow
  - Pattern: `packages/ideaspace/src/tool/registry.ts:110-123` — current tool registration gate
  - Pattern: `packages/ideaspace/src/agent/agent.ts:92-109` — plan agent permissions over `.ideaspace/plans/*.md`

  **Acceptance Criteria**:
  - [ ] Plan mode is usable from app/desktop sessions when experimental plan mode is enabled
  - [ ] Planner guidance explicitly describes checkbox + nested-bullet task formatting for `## TODOs`, including optional `id` and `depends-on` metadata
  - [ ] Creating a planning session produces a file under `/Users/andredalwintan/Documents/Projects/Ideaspace/.ideaspace/plans/*.md`
  - [ ] `cd packages/ideaspace && bun run build` passes

  **QA Scenarios**:

  ```
  Scenario: Planner creates a checkbox-friendly plan file
    Tool: agent-browser + Bash
    Steps:
      1. Start backend with `IDEASPACE_EXPERIMENTAL_PLAN_MODE=1 bun run --conditions=browser ./src/index.ts serve --port 4096` in `packages/ideaspace`
      2. Start app with `bun dev -- --port 4444` in `packages/app`
      3. Open `http://localhost:4444/L1VzZXJzL2FuZHJlZGFsd2ludGFuL0RvY3VtZW50cy9Qcm9qZWN0cy9JZGVhc3BhY2U=/session`
      4. Switch to `plan` and submit `Create a launch plan with clear TODO checkboxes for Workspace and Kanban.`
      5. Inspect the newest file in `.ideaspace/plans`
    Expected: the generated plan contains a `## TODOs` section with `- [ ]` items and supports optional `id` / `depends-on` lines
    Evidence: .sisyphus/evidence/task-1-plan-format.txt

  Scenario: Plan-entry and plan-exit handoffs still work in app flow
    Tool: agent-browser
    Steps:
      1. Enter plan mode from a session
      2. Finish the planning turn until the handoff prompt appears
      3. Approve the transition back to build mode
    Expected: session remains usable and plan-mode handoff does not break
    Evidence: .sisyphus/evidence/task-1-plan-handoff.png
  ```

  **Commit**: YES | Message: `feat(ideaspace): align planner output with workspace task import` | Files: `packages/ideaspace/src/tool/plan.ts`, `packages/ideaspace/src/tool/registry.ts`, `packages/ideaspace/src/session/prompt.ts`

---

- [ ] 2. Reuse file APIs for Workspace plan state and auto-open behavior

  **What to do**:
  - Wrap `ProjectRoute` with `FileProvider` inside `packages/app/src/app.tsx` so Workspace can reuse existing file list/read/watch behavior.
  - Create `packages/app/src/pages/workspace/state.ts` that:
    - scopes the source to `.ideaspace/plans`
    - lists only `.md` files
    - tracks the selected plan path
    - selects the newest plan by default when no selection exists
    - auto-selects a newly created plan file when it appears under `.ideaspace/plans`
  - Do not make state global beyond the project shell.

  **Must NOT do**:
  - Do not add new generic file-read endpoints
  - Do not auto-open markdown files outside `.ideaspace/plans`
  - Do not persist selected Workspace state to a database

  **Recommended Agent Profile**:
  - Category: `quick` — Reason: mostly state composition on top of existing file primitives
  - Skills: `[]`
  - Omitted: `['git-master']`

  **Parallelization**: Can Parallel: YES | Wave 1 | Blocks: 3, 6 | Blocked By: 1

  **References**:
  - Pattern: `packages/app/src/context/file.tsx:52-217` — existing list/read/watch behavior
  - Pattern: `packages/app/src/app.tsx:54-66, 178-187` — route composition for project pages
  - Pattern: `packages/app/src/components/file-tree.tsx:194-220` — existing file-list usage pattern

  **Acceptance Criteria**:
  - [ ] Workspace can read `.ideaspace/plans` with existing file APIs
  - [ ] New files under `.ideaspace/plans` become the selected plan automatically
  - [ ] Non-plan markdown files do not hijack selection
  - [ ] `cd packages/app && bun run typecheck && bun run build` passes

  **QA Scenarios**:

  ```
  Scenario: Workspace auto-selects the newest plan file
    Tool: Bash + agent-browser
    Steps:
      1. Seed `20260307-alpha.md` and `20260307-beta.md` in `.ideaspace/plans`
      2. Open `http://localhost:4444/L1VzZXJzL2FuZHJlZGFsd2ludGFuL0RvY3VtZW50cy9Qcm9qZWN0cy9JZGVhc3BhY2U=/workspace`
    Expected: `20260307-beta.md` is selected by default
    Evidence: .sisyphus/evidence/task-2-workspace-select.png

  Scenario: Newly created plan opens immediately
    Tool: agent-browser + Bash
    Steps:
      1. Keep Workspace route open
      2. Add `20260307-gamma.md` under `.ideaspace/plans`
      3. Wait for file watcher refresh
    Expected: Workspace switches to `20260307-gamma.md` automatically
    Evidence: .sisyphus/evidence/task-2-workspace-autopen.png
  ```

  **Commit**: YES | Message: `feat(app): wire workspace to ideaspace plan files` | Files: `packages/app/src/app.tsx`, `packages/app/src/pages/workspace/state.ts`

---

- [ ] 3. Build the Workspace browser, preview, and `Convert to Tasks` affordance

  **What to do**:
  - Replace the inline `Workspace()` placeholder in `packages/app/src/pages/project.tsx:81-138` with a real Workspace view under `packages/app/src/pages/workspace/`.
  - Reuse existing UI pieces:
    - `FileTree` for the plan list
    - existing markdown rendering for preview
    - `Button`, `Card`, `ScrollView`, `IconButton` for layout and actions
  - Workspace responsibilities:
    1. list plan files from `.ideaspace/plans`
    2. preview the selected plan markdown
    3. provide `Start planner session`, `Open AI session`, and `Convert to Tasks`
  - `Start planner session` should navigate to `/session?prompt=Enter%20plan%20mode%20and%20create%20or%20update%20the%20project%20plan.`
  - `Convert to Tasks` should:
    - be visible only when a plan is selected
    - call the task-board import endpoint with the selected plan path
    - show a result summary such as `Imported 4 tasks, skipped 1 duplicate`

  **Must NOT do**:
  - Do not add inline markdown editing
  - Do not add a second chat surface inside Workspace
  - Do not parse tasks in the UI only and pretend they are persisted

  **Recommended Agent Profile**:
  - Category: `visual-engineering` — Reason: main UI surface and interaction design
  - Skills: `['frontend-ui-ux']`
  - Omitted: `['playwright']`

  **Parallelization**: Can Parallel: YES | Wave 1 | Blocks: 4, 6 | Blocked By: 2

  **References**:
  - Pattern: `packages/app/src/pages/project.tsx:81-138` — current Workspace placeholder
  - Pattern: `packages/app/src/components/file-tree.tsx:111-220` — file list rendering
  - Pattern: `packages/app/src/components/session/session-context-tab.tsx:1-220` — scrollable content-pane style
  - Pattern: `packages/app/src/pages/session.tsx:1245-1370` — Session stays the conversation destination

  **Acceptance Criteria**:
  - [ ] Workspace shows plan list + markdown preview
  - [ ] `Start planner session` routes into Session with the planning prompt seed
  - [ ] `Convert to Tasks` runs against the selected plan only
  - [ ] Import results are surfaced to the user after conversion
  - [ ] `cd packages/app && bun run typecheck && bun run build` passes

  **QA Scenarios**:

  ```
  Scenario: Workspace preview and conversion action are visible together
    Tool: agent-browser
    Steps:
      1. Ensure `.ideaspace/plans/20260307-beta.md` exists with a `## TODOs` section
      2. Open Workspace route
      3. Verify plan preview is visible and `Convert to Tasks` appears
    Expected: Workspace acts as the plan home, not a placeholder card list
    Evidence: .sisyphus/evidence/task-3-workspace-ui.png

  Scenario: Conversion button reports imported/skipped counts
    Tool: agent-browser
    Steps:
      1. Click `Convert to Tasks` for the selected plan
      2. Wait for completion feedback
    Expected: UI reports how many tasks were imported and how many duplicates were skipped
    Evidence: .sisyphus/evidence/task-3-convert-feedback.png
  ```

  **Commit**: YES | Message: `feat(app): build workspace and task conversion entrypoint` | Files: `packages/app/src/pages/workspace/index.tsx`, `packages/app/src/pages/workspace/list.tsx`, `packages/app/src/pages/workspace/preview.tsx`, `packages/app/src/pages/project.tsx`

---

- [ ] 4. Add a lightweight task-board backend over `.ideaspace/tasks.json`

  **What to do**:
  - Create a single lightweight service and route family for Kanban persistence, scoped to `.ideaspace/tasks.json` only.
  - Add `packages/ideaspace/src/task-board/index.ts` for read/write/import helpers.
  - Add `packages/ideaspace/src/server/routes/task-board.ts` and register it in `packages/ideaspace/src/server/server.ts`.
  - Use this exact file shape for `.ideaspace/tasks.json`:
    ```json
    {
      "version": 1,
      "columns": ["backlog", "progress", "review", "done"],
      "tasks": [
        {
          "id": "tsk_...",
          "title": "Task title",
          "body": "extra detail line 1\nextra detail line 2",
          "deps": ["task-y"],
          "status": "backlog",
          "position": 0,
          "source": {
            "plan": ".ideaspace/plans/20260307-beta.md",
            "key": "<checksum>"
          },
          "time": {
            "created": 0,
            "updated": 0
          }
        }
      ]
    }
    ```
  - Implement endpoints:
    - `GET /task-board` → read or initialize `.ideaspace/tasks.json`
    - `POST /task-board/import` → import tasks from one selected plan file
    - `PATCH /task-board` → save board state after move/edit
  - Import rules:
    - parse the selected plan file only
    - `- [ ]` imports into `backlog`
    - `- [x]` imports into `done`
    - `- id: foo` sets the imported task's stable dependency ID to `foo`
    - `- depends-on: y, z` parses into `deps: ["y", "z"]`
    - nested bullet lines under the checkbox become `body`
    - compute `source.key` from the checkbox block content and plan path so repeated imports skip duplicates

  **Must NOT do**:
  - Do not add Drizzle tables or migrations
  - Do not add a broad arbitrary file-write API
  - Do not overwrite already imported tasks on repeated import

  **Recommended Agent Profile**:
  - Category: `unspecified-high` — Reason: requires minimal backend contract + file persistence
  - Skills: `[]`
  - Omitted: `['frontend-ui-ux']`

  **Parallelization**: Can Parallel: NO | Wave 2 | Blocks: 5, 6 | Blocked By: 3

  **References**:
  - Pattern: `packages/ideaspace/src/server/routes/file.ts:120-197` — existing read-only file route style to mirror for task-board endpoints
  - Pattern: `packages/ideaspace/src/config/config.ts:1375-1381` — `Filesystem.writeJson` / `Filesystem.write` persistence patterns
  - Pattern: `packages/ideaspace/src/util/filesystem.ts` — file utility helpers for writing JSON safely
  - Pattern: `packages/app/package.json:52` — `@thisbeyond/solid-dnd` already present for the board UI

  **Acceptance Criteria**:
  - [ ] `.ideaspace/tasks.json` is created on first import or first board save
  - [ ] Importing a plan creates tasks with `title`, `body`, `deps`, `status`, `position`, and `source`
  - [ ] Repeating the same import skips duplicates by `source.key`
  - [ ] `GET /task-board`, `POST /task-board/import`, and `PATCH /task-board` function for the current project
  - [ ] `cd packages/ideaspace && bun run build` passes

  **QA Scenarios**:

  ```
  Scenario: Import creates a file-backed board from one plan
    Tool: Bash
    Steps:
      1. Seed `.ideaspace/plans/20260307-board.md` with:
         # Board Plan

         ## TODOs
         - [ ] Build Workspace
           - id: build-workspace
           - Replace placeholder UI
         - [x] Prefer .ideaspace
           - id: ideaspace-paths
         - [ ] Ship Deploy
           - id: ship-deploy
           - depends-on: build-workspace, ideaspace-paths
      2. Call the import endpoint for `.ideaspace/plans/20260307-board.md`
      3. Read `.ideaspace/tasks.json`
    Expected: tasks include parsed `deps`, one task lands in `backlog`, one in `done`, and bodies include non-metadata nested bullet text
    Evidence: .sisyphus/evidence/task-4-task-board.json

  Scenario: Repeating import skips duplicates
    Tool: Bash
    Steps:
      1. Call the same import endpoint twice for the same plan file
      2. Count tasks in `.ideaspace/tasks.json`
    Expected: task count remains stable after the second import
    Evidence: .sisyphus/evidence/task-4-import-idempotent.txt
  ```

  **Commit**: YES | Message: `feat(ideaspace): add file-backed kanban import service` | Files: `packages/ideaspace/src/task-board/index.ts`, `packages/ideaspace/src/server/routes/task-board.ts`, `packages/ideaspace/src/server/server.ts`

---

- [ ] 5. Build the Kanban UI over `.ideaspace/tasks.json`

  **What to do**:
  - Replace the inline `Tasks()` placeholder in `packages/app/src/pages/project.tsx:140-177` with a real Kanban board under `packages/app/src/pages/tasks/`.
  - Use `@thisbeyond/solid-dnd` for a simple uniform-card board only.
  - Board behavior:
    - 4 columns: `Backlog`, `In Progress`, `Review`, `Done`
    - cards show `title` and a short preview of `body`
    - cards with unresolved `deps` show a `Blocked` treatment plus the prerequisite IDs
    - moving a card updates `status` and `position`, then persists through `PATCH /task-board`
    - cards imported from a plan retain their `source.plan` metadata for future display/debugging, but no live sync is implemented
    - cards with unresolved dependencies cannot move out of `backlog`
  - Add a lightweight store under `packages/app/src/pages/tasks/state.ts` that reads the board, applies optimistic updates, and saves moves.

  **Must NOT do**:
  - Do not add dependency editing UI in this pass; dependencies come from the plan import only
  - Do not add subtasks or time tracking
  - Do not add live plan↔kanban synchronization
  - Do not add variable-height, complex sortable behavior

  **Recommended Agent Profile**:
  - Category: `visual-engineering` — Reason: board UI + user interaction
  - Skills: `['frontend-ui-ux']`
  - Omitted: `['playwright']`

  **Parallelization**: Can Parallel: NO | Wave 2 | Blocks: 6 | Blocked By: 4

  **References**:
  - Pattern: `packages/app/src/pages/project.tsx:140-177` — current Tasks placeholder
  - Pattern: `packages/app/package.json:52` — `@thisbeyond/solid-dnd` dependency already present
  - Pattern: `packages/app/src/pages/agents/list.tsx:13-139` — compact card presentation worth reusing

  **Acceptance Criteria**:
  - [ ] Tasks route renders a real 4-column Kanban board from `.ideaspace/tasks.json`
  - [ ] Imported tasks appear in the correct columns (`[ ]` → Backlog, `[x]` → Done)
  - [ ] Tasks with unresolved dependencies visibly show as blocked
  - [ ] Blocked tasks cannot move out of `backlog`
  - [ ] Dragging or moving a card persists to `.ideaspace/tasks.json`
  - [ ] Reopening the app preserves board state
  - [ ] `cd packages/app && bun run typecheck && bun run test:unit && bun run build` passes

  **QA Scenarios**:

  ```
  Scenario: Imported tasks show blocked dependency state
    Tool: agent-browser
    Steps:
      1. Ensure `.ideaspace/tasks.json` contains a task with `deps: ["build-workspace"]` while `build-workspace` is not `done`
      2. Open `http://localhost:4444/L1VzZXJzL2FuZHJlZGFsd2ludGFuL0RvY3VtZW50cy9Qcm9qZWN0cy9JZGVhc3BhY2U=/tasks`
    Expected: the dependent task appears in Backlog with a blocked indicator and dependency label
    Evidence: .sisyphus/evidence/task-5-kanban-columns.png

  Scenario: Blocked tasks cannot move before prerequisites are done
    Tool: agent-browser + Bash
    Steps:
      1. Attempt to drag a blocked backlog card into `In Progress`
      2. Reload the Tasks route
      3. Inspect `.ideaspace/tasks.json`
    Expected: the blocked card remains in `backlog` and the file does not record an invalid status change
    Evidence: .sisyphus/evidence/task-5-kanban-persist.png
  ```

  **Commit**: YES | Message: `feat(app): build kanban board from imported plan tasks` | Files: `packages/app/src/pages/tasks/index.tsx`, `packages/app/src/pages/tasks/state.ts`, `packages/app/src/pages/tasks/card.tsx`, `packages/app/src/pages/project.tsx`

---

- [ ] 6. Polish Workspace/Tasks integration and keep the rest explicitly out of scope

  **What to do**:
  - Remove unused mock `docs` and `board` data from `packages/app/src/pages/project.tsx` once Workspace and Tasks use real sources.
  - Leave Context and project Agents implementations out of this plan; if their placeholders need copy cleanup, only change copy to reflect that they are not part of the current MVP work.
  - Verify the main flow feels coherent:
    - planner creates a markdown plan
    - Workspace auto-opens it
    - user clicks `Convert to Tasks`
    - Tasks shows the imported board

  **Must NOT do**:
  - Do not expand into Context Bank implementation in this pass
  - Do not expand into project Agents implementation in this pass
  - Do not reintroduce database scope

  **Recommended Agent Profile**:
  - Category: `quick` — Reason: integration cleanup and copy tightening
  - Skills: `['frontend-ui-ux']`
  - Omitted: `['git-master']`

  **Parallelization**: Can Parallel: NO | Wave 3 | Blocks: none | Blocked By: 3, 5

  **References**:
  - Pattern: `packages/app/src/pages/project.tsx:8-319` — current mixed placeholder shell
  - Pattern: `packages/app/src/app.tsx:68-69, 180-185` — Workspace remains the default project landing path

  **Acceptance Criteria**:
  - [ ] Workspace and Tasks are real, non-placeholder surfaces
  - [ ] Context Bank and project Agents remain clearly out of scope for this plan
  - [ ] Main flow from plan creation → Workspace → task import → Kanban works end to end
  - [ ] `bun run verify:desktop` passes

  **QA Scenarios**:

  ```
  Scenario: End-to-end flow works across the two target tabs
    Tool: agent-browser
    Steps:
      1. Create or seed a plan with `## TODOs` checkbox items
      2. Open Workspace and confirm the plan auto-opens
      3. Click `Convert to Tasks`
      4. Open Tasks
    Expected: imported tasks appear in the Kanban without touching Context or Agents work
    Evidence: .sisyphus/evidence/task-6-end-to-end.png

  Scenario: Desktop verification stays inside the active hackathon stack
    Tool: Bash
    Steps:
      1. Run `cd /Users/andredalwintan/Documents/Projects/Ideaspace/packages/app && bun run typecheck && bun run test:unit && bun run build`
      2. Run `cd /Users/andredalwintan/Documents/Projects/Ideaspace/packages/ideaspace && bun run build`
      3. Run `cd /Users/andredalwintan/Documents/Projects/Ideaspace && bun run verify:desktop`
    Expected: all checks pass on the desktop stack
    Evidence: .sisyphus/evidence/task-6-verify-desktop.txt
  ```

  **Commit**: YES | Message: `feat(app): polish workspace and kanban mvp flow` | Files: `packages/app/src/pages/project.tsx`, touched Workspace/Tasks files

---

## Final Verification Wave (4 parallel agents, ALL must APPROVE)

- [ ] F1. Plan Compliance Audit — oracle
- [ ] F2. Code Quality Review — unspecified-high
- [ ] F3. Real Manual QA — unspecified-high (+ agent-browser)
- [ ] F4. Scope Fidelity Check — deep

## Commit Strategy

| After Task | Message                                                            | Key Files                                                                                                                                     | Verification                                                                 |
| ---------- | ------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| 1          | `feat(ideaspace): align planner output with workspace task import` | `packages/ideaspace/src/tool/plan.ts`, `packages/ideaspace/src/tool/registry.ts`, `packages/ideaspace/src/session/prompt.ts`                  | `cd packages/ideaspace && bun run build`                                     |
| 2          | `feat(app): wire workspace to ideaspace plan files`                | `packages/app/src/app.tsx`, `packages/app/src/pages/workspace/state.ts`                                                                       | `cd packages/app && bun run typecheck && bun run build`                      |
| 3          | `feat(app): build workspace and task conversion entrypoint`        | `packages/app/src/pages/workspace/`, `packages/app/src/pages/project.tsx`                                                                     | `cd packages/app && bun run typecheck && bun run build`                      |
| 4          | `feat(ideaspace): add file-backed kanban import service`           | `packages/ideaspace/src/task-board/index.ts`, `packages/ideaspace/src/server/routes/task-board.ts`, `packages/ideaspace/src/server/server.ts` | `cd packages/ideaspace && bun run build`                                     |
| 5          | `feat(app): build kanban board from imported plan tasks`           | `packages/app/src/pages/tasks/`, `packages/app/src/pages/project.tsx`                                                                         | `cd packages/app && bun run typecheck && bun run test:unit && bun run build` |
| 6          | `feat(app): polish workspace and kanban mvp flow`                  | `packages/app/src/pages/project.tsx`, touched Workspace/Tasks files                                                                           | `bun run verify:desktop`                                                     |

## Success Criteria

### Verification Commands

```bash
cd packages/ideaspace && bun run build
cd packages/app && bun run typecheck && bun run test:unit && bun run build
cd /Users/andredalwintan/Documents/Projects/Ideaspace && bun run verify:desktop
```

### Final Checklist

- [ ] Planner writes checkbox-friendly plans to `.ideaspace/plans/*.md`
- [ ] Workspace is driven by `.ideaspace/plans` and auto-opens newly created plans
- [ ] `Convert to Tasks` imports the currently open plan only
- [ ] Nested bullet lines become task description/body
- [ ] Optional `depends-on` plan metadata becomes blocked-task behavior in Kanban
- [ ] Kanban state persists in `.ideaspace/tasks.json`
- [ ] Repeated imports skip duplicates instead of duplicating or overwriting cards
- [ ] Context Bank and project Agents were not pulled into this implementation plan
- [ ] Desktop verification passes on the active hackathon stack
