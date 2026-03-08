- Session tab is now first in the project surface, and opening `/:dir/` redirects into `/session` for the default experience.
- Session content now renders inside `ProjectRoute` render tree with the terminal/prompt/comments providers so the AI view shares the tab layout instead of living in a separate route.
- `cd packages/app && bun run typecheck && bun run build` passes after the changes.
- Added contextual quick actions per tab (planner quick launch, task filters, session controls) plus a shared Cmd+K hint component so the command palette is discoverable across workspace, tasks, and session.

## ImportTasksTool Implementation (Task 7)

- Created ImportTasksTool following the Tool.define pattern with async init function
- Tool descriptions are loaded from .txt files via Bun's text loader (import DESCRIPTION from "./task-import.txt")
- When metadata has different shapes in success/error branches, use explicit Promise<ReturnType> annotation on execute method
- ImportTasksTool uses TaskBoard.importFromPlan() which parses ## TODOs section from plan files and creates Kanban tasks
- Tools are registered in registry.ts by adding to the array returned by all() function
- Tool ID: "import_tasks" - takes planPath parameter and returns {imported, skipped} counts
- Build verification: `cd packages/ideaspace && bun run build` passes
- Removed ProjectTabs from `packages/app/src/pages/session.tsx` so the tab bar renders only in the project layout and avoid duplicate navigation; `cd packages/app && bun run typecheck` still passes
