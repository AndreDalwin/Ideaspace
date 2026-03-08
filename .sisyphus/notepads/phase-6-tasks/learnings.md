# Phase 6: Tasks Tab (Kanban) - Learnings

## Implementation Summary

### Files Created

1. `packages/app/src/pages/v3-tasks.tsx` - V3 wrapper for Tasks tab
2. `packages/app/src/components/task-mini-card.tsx` - Compact task card component
3. `packages/app/src/components/task-context-panel.tsx` - Task list for sidebar context

### Files Modified

1. `packages/app/src/components/context-bank-panel.tsx` - Added TaskContextPanel to Global Context tab
2. `packages/app/src/app.tsx` - Added V3Tasks route at `/tasks`
3. `packages/app/src/components/v3-sidebar.tsx` - Added Tasks navigation link

## Key Patterns Learned

### V3 Page Structure

- V3 pages wrap existing components with V3Layout
- Use `createTasksState()` from `pages/tasks/state.ts` for state management
- Reuse existing Tasks component from `pages/tasks/index.tsx` rather than reimplementing

### Task State Management

- Tasks use SolidJS `createStore` for reactive state
- Task types: `backlog` | `progress` | `review` | `done`
- State includes `board.tasks`, `columns`, `loading`, `isBlocked`, `moveTask`, `refresh`

### Sidebar Navigation Pattern

- Use `<A>` component from `@solidjs/router` with `activeClass` for nav links
- Structure: `/${params.dir || "."}/tasks` for route
- Consistent styling with existing sidebar sections

### Context Panel Integration

- Add new sections after existing content in Global Context tab
- Use `border-t` and `pt-4` for visual separation
- Import and use `useNavigate` and `useParams` for navigation

## Status Colors for Tasks

```ts
const STATUS_COLORS: Record<TaskStatus, string> = {
  backlog: "bg-text-weaker",
  progress: "bg-accent-primary",
  review: "bg-amber-500",
  done: "bg-green-500",
}
```

## Build Verification

- Typecheck passes: `cd packages/app && bun run typecheck`
- Build succeeds: `cd packages/app && bun run build`
