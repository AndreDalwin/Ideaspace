# Phase 6 Implementation Guide: Tasks Tab (Kanban)

## Integrate Existing Kanban with V3 Workspace

**Phase:** 6 of 7  
**Estimated Time:** 2 hours  
**Goal:** Wire up Tasks tab with Kanban board, integrate with skills/sessions

---

## 🎯 What We're Building

Tasks tab that:

- Reuses existing Kanban board component
- Integrates with workspace tabs (Workspace | Tasks | Context Bank)
- Links tasks to sessions for AI-assisted work
- Shows task context in sidebar

---

## 📁 Existing Components

The codebase already has:

1. **`packages/app/src/pages/tasks/index.tsx`** - Full Kanban board with:
   - 4 columns: Backlog, In Progress, Review, Done
   - Drag-and-drop task cards
   - Task dependency blocking
   - "Work on this" dropdown

2. **`packages/app/src/pages/tasks/state.ts`** - Task state management:
   - `createTasksState()` hook
   - `Task`, `TaskStatus`, `TaskBoard` types
   - API integration for load/save

---

## 📁 Files to Create

### 1. `packages/app/src/pages/v3-tasks.tsx`

**Purpose:** V3 wrapper for Tasks tab with workspace integration

```tsx
import { Show, createSignal, createMemo } from "solid-js"
import { useNavigate, useParams } from "@solidjs/router"
import { ScrollView } from "@opencode-ai/ui/scroll-view"
import { Button } from "@opencode-ai/ui/button"
import { IconButton } from "@opencode-ai/ui/icon-button"
import { createTasksState, type Task, type TaskStatus } from "../tasks/state"
import Tasks from "../tasks"
import { WorkspaceContextIndicator } from "@/components/workspace-context-indicator"

export default function V3Tasks() {
  const navigate = useNavigate()
  const params = useParams()
  const tasks = createTasksState()

  const [filter, setFilter] = createSignal<TaskStatus | "all">("all")

  const handleWorkOnTask = (taskId: string, mode: "chat" | "implement" | "subtasks") => {
    const query = new URLSearchParams({ task: taskId, mode }).toString()
    navigate(`/${params.dir}/session?${query}`)
  }

  const totalTasks = () => tasks.board.tasks.length
  const completedTasks = () => tasks.board.tasks.filter((t) => t.status === "done").length
  const progressPercent = () => (totalTasks() > 0 ? Math.round((completedTasks() / totalTasks()) * 100) : 0)

  return (
    <div class="h-full flex flex-col">
      {/* Header */}
      <div class="h-14 border-b border-border-weak-base flex items-center justify-between px-4">
        <div class="flex items-center gap-3">
          <h1 class="text-18-semibold text-text-strong">Tasks</h1>
          <Show when={tasks.loading.saving}>
            <span class="text-12-regular text-text-weak">Saving...</span>
          </Show>
        </div>

        <div class="flex items-center gap-2">
          {/* Progress */}
          <div class="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-background-stronger">
            <div class="w-24 h-2 rounded-full bg-background-base overflow-hidden">
              <div class="h-full bg-accent-primary transition-all" style={{ width: `${progressPercent()}%` }} />
            </div>
            <span class="text-12-medium text-text-strong">
              {completedTasks()}/{totalTasks()}
            </span>
          </div>

          <IconButton
            icon="arrow-down-to-line"
            variant="ghost"
            size="small"
            onClick={() => tasks.refresh()}
            title="Refresh"
          />
        </div>
      </div>

      {/* Content */}
      <div class="flex-1 flex overflow-hidden">
        {/* Kanban Board */}
        <div class="flex-1 overflow-hidden">
          <Tasks />
        </div>

        {/* Right Sidebar - Task Details */}
        <div class="w-72 border-l border-border-weak-base bg-background-stronger flex flex-col">
          <div class="h-12 border-b border-border-weak-base flex items-center px-4">
            <span class="text-14-semibold text-text-strong">Task Details</span>
          </div>

          <ScrollView class="flex-1 p-4">
            <WorkspaceContextIndicator />

            <div class="mt-4 p-4 rounded-xl border border-border-weak-base bg-background-base">
              <div class="text-12-semibold text-text-weak uppercase tracking-wider mb-2">Quick Actions</div>
              <div class="space-y-2">
                <Button
                  variant="secondary"
                  size="small"
                  class="w-full justify-start"
                  onClick={() => navigate(`/${params.dir}/session`)}
                >
                  💬 New Session
                </Button>
                <Button
                  variant="secondary"
                  size="small"
                  class="w-full justify-start"
                  onClick={() => navigate(`/${params.dir}/skills`)}
                >
                  🎨 Pick Skill
                </Button>
              </div>
            </div>
          </ScrollView>
        </div>
      </div>
    </div>
  )
}
```

**Key Points:**

- Wraps existing Tasks component
- Adds header with progress bar
- Right sidebar with context indicator
- Quick actions for new session/skill

---

### 2. `packages/app/src/components/task-mini-card.tsx`

**Purpose:** Compact task card for sidebar/overview

```tsx
import { Show } from "solid-js"
import type { Task, TaskStatus } from "@/pages/tasks/state"

interface TaskMiniCardProps {
  task: Task
  isActive?: boolean
  onClick?: () => void
}

const STATUS_COLORS: Record<TaskStatus, string> = {
  backlog: "bg-surface-neutral-base",
  progress: "bg-accent-primary",
  review: "bg-surface-warning-base",
  done: "bg-surface-success-base",
}

export function TaskMiniCard(props: TaskMiniCardProps) {
  return (
    <button
      onClick={props.onClick}
      class={`w-full text-left p-3 rounded-xl border transition-all ${
        props.isActive
          ? "border-accent-primary bg-accent-primary/10"
          : "border-border-weak-base bg-background-stronger hover:border-border-strong-base"
      }`}
    >
      <div class="flex items-start gap-2">
        <div class={`w-2 h-2 rounded-full mt-1.5 ${STATUS_COLORS[props.task.status]}`} />
        <div class="flex-1 min-w-0">
          <div class="text-13-medium text-text-strong truncate">{props.task.title}</div>
          <Show when={props.task.deps.length > 0}>
            <div class="text-11-regular text-text-weaker mt-1">
              {props.task.deps.length} dependenc
              {props.task.deps.length === 1 ? "y" : "ies"}
            </div>
          </Show>
        </div>
      </div>
    </button>
  )
}
```

**Key Points:**

- Compact design for sidebar use
- Status indicator dot
- Shows dependencies count
- Active state highlighting

---

### 3. `packages/app/src/components/task-context-panel.tsx`

**Purpose:** Show active tasks in Context Bank panel

```tsx
import { For, Show } from "solid-js"
import { useNavigate, useParams } from "@solidjs/router"
import { createTasksState } from "@/pages/tasks/state"
import { TaskMiniCard } from "./task-mini-card"
import { ScrollView } from "@opencode-ai/ui/scroll-view"

export function TaskContextPanel() {
  const navigate = useNavigate()
  const params = useParams()
  const tasks = createTasksState()

  const activeTasks = () => tasks.board.tasks.filter((t) => t.status !== "done").slice(0, 5)

  const handleTaskClick = (taskId: string) => {
    navigate(`/${params.dir}/tasks?task=${taskId}`)
  }

  return (
    <div class="p-4 border-b border-border-weak-base">
      <div class="flex items-center justify-between mb-3">
        <div class="flex items-center gap-2">
          <span class="text-16">📋</span>
          <span class="text-12-semibold text-text-strong uppercase tracking-wider">Active Tasks</span>
        </div>
        <button class="text-11-medium text-accent-primary" onClick={() => navigate(`/${params.dir}/tasks`)}>
          View All
        </button>
      </div>

      <Show
        when={activeTasks().length > 0}
        fallback={<div class="text-13-regular text-text-weak py-2">No active tasks</div>}
      >
        <ScrollView class="max-h-[200px]">
          <div class="space-y-2">
            <For each={activeTasks()}>
              {(task) => <TaskMiniCard task={task} onClick={() => handleTaskClick(task.id)} />}
            </For>
          </div>
        </ScrollView>
      </Show>
    </div>
  )
}
```

**Key Points:**

- Shows top 5 non-completed tasks
- Links to Tasks tab with task selected
- "View All" link to full board
- Integrates into Context Bank panel

---

## 📁 Files to Modify

### 4. `packages/app/src/components/context-bank-panel.tsx`

**Add Tasks section:**

```tsx
import { TaskContextPanel } from "./task-context-panel"

// In the panel layout, add after Global Context section:
;<TaskContextPanel />

// Or integrate into existing sections
```

---

### 5. `packages/app/src/pages/session.tsx` (Task Integration)

**Handle task URL parameter (already partially implemented):**

```tsx
import { useSearchParams } from "@solidjs/router"
import type { Task } from "./tasks/state"

// Add to existing session code:
const [searchParams] = useSearchParams<{
  skill?: string
  task?: string
  mode?: string
}>()

const [activeTask, setActiveTask] = createSignal<Task | null>(null)

// Load task when URL has task param
createEffect(() => {
  const taskId = searchParams.task
  if (!taskId) {
    setActiveTask(null)
    return
  }

  // Fetch task from API
  void loadTask(taskId)
})

async function loadTask(taskId: string) {
  try {
    const res = await sdk.client.get<{ tasks: Task[] }>({
      url: "/task-board",
    })
    const task = res.data?.tasks.find((t) => t.id === taskId)
    if (task) setActiveTask(task)
  } catch (err) {
    console.error("Failed to load task:", err)
  }
}

// Show task badge in UI
// (Already implemented in session.tsx - TaskBadge component)
```

---

### 6. `packages/app/src/app.tsx` (Add Tasks Route)

**Add V3 Tasks route:**

```tsx
const V3Tasks = lazy(() => import("@/pages/v3-tasks"))

// In Router, add:
<Route path="/:dir/v3" component={V3Layout}>
  <Route path="/" component={V3BlankWorkspace} />
  <Route path="/tasks" component={V3Tasks} />
  <Route path="/skills" component={SkillsPage} />
  {/* ... other routes ... */}
</Route>
```

---

### 7. `packages/app/src/components/v3-sidebar.tsx` (Add Tasks Link)

**Add Tasks to sidebar:**

```tsx
// After Skills section, add:
<div class="px-3 py-2">
  <A
    href={`/${params.dir || "."}/v3/tasks`}
    class="flex items-center gap-2 px-3 py-2 rounded-lg text-13-medium text-text-strong hover:bg-background-base transition-colors"
    activeClass="bg-accent-primary/10 text-accent-primary"
  >
    <span>📋</span>
    <span>Tasks</span>
  </A>
</div>
```

---

## 🔗 Integration with Previous Phases

### Phase 1 (Foundation)

- Tasks appears as tab in workspace
- Sidebar has Tasks navigation link
- Consistent styling with other tabs

### Phase 2 (Skills)

- Tasks can reference skills (via task metadata)
- "Work on this" can use skill context
- Skills help complete tasks

### Phase 3 (Context Bank)

- Task panel shows in Context Bank
- Active task context visible in sidebar
- Task-to-session flow maintains context

### Phase 4 (File Tree)

- Task files can be added to context via file tree
- Drag files from tree to task cards (future)

### Phase 5 (Workspace Integration)

- Tasks link to sessions seamlessly
- Context indicator shows in Tasks tab
- Unified workspace experience

---

## ✅ Verification Steps

1. **Type Check:**

   ```bash
   cd packages/app && bun run typecheck
   ```

2. **Navigation:**
   - Click Tasks in sidebar → Kanban board loads
   - Progress bar shows completion percentage
   - Task count accurate

3. **Task Interaction:**
   - Drag cards between columns
   - Click "Work on this" → Opens session with task
   - Session shows task badge

4. **Context Integration:**
   - Context Bank panel shows Active Tasks section
   - Click task in panel → Selects task in board
   - Context indicator visible in Tasks tab

---

## 🎨 Design Notes

| Element      | Style             |
| ------------ | ----------------- |
| Backlog      | Gray dot          |
| In Progress  | Accent color dot  |
| Review       | Yellow/orange dot |
| Done         | Green dot         |
| Progress bar | Accent fill       |
| Active task  | Border highlight  |

---

## 📝 Key Features

1. **Existing Kanban:** Reuses battle-tested tasks component
2. **Session Link:** "Work on this" flows to AI session
3. **Context Panel:** Tasks visible in right sidebar
4. **Progress Tracking:** Visual progress bar

---

## 🚀 Next Phase

After Phase 6 is complete, move to **Phase 7: Polish** where we'll:

- Add smooth animations
- Create empty states
- Build onboarding flow
- Final refinements

**Phase 6 brings task management into the V3 workspace!**
