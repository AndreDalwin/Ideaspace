import { Show } from "solid-js"
import { type Task, type TaskStatus } from "../pages/tasks/state"

const STATUS_COLORS: Record<TaskStatus, string> = {
  backlog: "bg-text-weaker",
  progress: "bg-accent-primary",
  review: "bg-amber-500",
  done: "bg-green-500",
}

interface TaskMiniCardProps {
  task: Task
  isBlocked?: boolean
  onClick?: () => void
}

export function TaskMiniCard(props: TaskMiniCardProps) {
  const depCount = () => props.task.deps.length

  return (
    <button
      onClick={props.onClick}
      class="w-full text-left p-3 rounded-xl border border-border-weak-base bg-background-stronger hover:border-border-strong-base hover:bg-background-base transition-all group"
    >
      <div class="flex items-start gap-2">
        <div class={`w-2 h-2 mt-1.5 rounded-full shrink-0 ${STATUS_COLORS[props.task.status]}`} />
        <div class="flex-1 min-w-0">
          <div class="text-13-medium text-text-strong truncate">{props.task.title}</div>
          <Show when={props.task.body}>
            <div class="text-11-regular text-text-weak truncate mt-0.5">
              {props.task.body.split("\n")[0]?.slice(0, 60) || ""}
              {props.task.body.length > 60 ? "..." : ""}
            </div>
          </Show>
        </div>
      </div>

      <div class="mt-2 flex items-center justify-between">
        <Show when={depCount() > 0}>
          <div class="flex items-center gap-1 text-10-regular text-text-weaker">
            <span>🔗</span>
            <span>
              {depCount()} dep{depCount() === 1 ? "" : "s"}
            </span>
          </div>
        </Show>
        <Show when={props.isBlocked}>
          <span class="text-10-medium text-surface-warning-base">Blocked</span>
        </Show>
      </div>
    </button>
  )
}

export default TaskMiniCard
