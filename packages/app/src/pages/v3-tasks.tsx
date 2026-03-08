import { Show } from "solid-js"
import { useNavigate, useParams } from "@solidjs/router"
import { createTasksState } from "../pages/tasks/state"
import Tasks from "../pages/tasks"

export function V3Tasks() {
  const navigate = useNavigate()
  const params = useParams()
  const tasks = createTasksState()
  const totalTasks = () => tasks.board.tasks.length
  const completedTasks = () => tasks.board.tasks.filter((t) => t.status === "done").length
  const progressPercent = () => (totalTasks() > 0 ? Math.round((completedTasks() / totalTasks()) * 100) : 0)

  return (
    <div class="h-full flex flex-col">
      <div class="h-14 border-b border-border-weak-base flex items-center justify-between px-4">
        <div class="flex items-center gap-3">
          <h1 class="text-18-semibold text-text-strong">Tasks</h1>
          <Show when={tasks.loading.saving}>
            <span class="text-12-regular text-text-weak">Saving...</span>
          </Show>
        </div>
        <div class="flex items-center gap-2">
          <div class="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-background-stronger">
            <div class="w-24 h-2 rounded-full bg-background-base overflow-hidden">
              <div class="h-full bg-accent-primary transition-all" style={{ width: `${progressPercent()}%` }} />
            </div>
            <span class="text-12-medium text-text-strong">
              {completedTasks()}/{totalTasks()}
            </span>
          </div>
        </div>
      </div>

      <div class="flex-1 flex overflow-hidden">
        <div class="flex-1 overflow-hidden">
          <Tasks />
        </div>
      </div>
    </div>
  )
}

export default V3Tasks
