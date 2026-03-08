import { For, Show, createMemo } from "solid-js"
import { useNavigate, useParams } from "@solidjs/router"
import { A } from "@solidjs/router"
import { createTasksState } from "../pages/tasks/state"
import { TaskMiniCard } from "./task-mini-card"

export function TaskContextPanel() {
  const navigate = useNavigate()
  const params = useParams()
  const tasks = createTasksState()

  const activeTasks = createMemo(() => {
    const filtered = tasks.board.tasks.filter((t) => t.status !== "done")
    return filtered.slice(0, 5)
  })

  const hasMore = createMemo(() => {
    const filtered = tasks.board.tasks.filter((t) => t.status !== "done")
    return filtered.length > 5
  })

  const handleTaskClick = (taskId: string) => {
    navigate(`/${params.dir || "."}/tasks?task=${taskId}`)
  }

  return (
    <div class="border-t border-border pt-4 mt-4">
      <div class="flex items-center justify-between mb-3">
        <span class="text-xs font-medium text-muted-foreground uppercase tracking-wider">Active Tasks</span>
        <A
          href={`/${params.dir || "."}/tasks`}
          class="text-xs text-accent-primary hover:text-accent-primary/80 transition-colors"
        >
          View All
        </A>
      </div>

      <Show
        when={tasks.board.tasks.length > 0}
        fallback={<div class="text-sm text-muted-foreground text-center py-4">No tasks yet</div>}
      >
        <div class="space-y-2">
          <For each={activeTasks()}>
            {(task) => (
              <TaskMiniCard task={task} isBlocked={tasks.isBlocked(task)} onClick={() => handleTaskClick(task.id)} />
            )}
          </For>

          <Show when={hasMore()}>
            <A
              href={`/${params.dir || "."}/tasks`}
              class="block text-center py-2 text-xs text-text-weak hover:text-text-strong transition-colors"
            >
              + {tasks.board.tasks.filter((t) => t.status !== "done").length - 5} more
            </A>
          </Show>
        </div>
      </Show>
    </div>
  )
}

export default TaskContextPanel
