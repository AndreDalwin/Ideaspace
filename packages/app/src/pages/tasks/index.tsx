import { For, Show, createSignal, createEffect, createMemo } from "solid-js"
import { createTasksState, type Task, type TaskStatus } from "./state"
import { ScrollView } from "@opencode-ai/ui/scroll-view"
import { IconButton } from "@opencode-ai/ui/icon-button"
import { Button } from "@opencode-ai/ui/button"
import { DropdownMenu } from "@opencode-ai/ui/dropdown-menu"
import { useNavigate, useParams } from "@solidjs/router"
import { CmdKHint } from "@/components/cmd-k-hint"

const COLUMN_NAMES: Record<TaskStatus, string> = {
  backlog: "Backlog",
  progress: "In Progress",
  review: "Review",
  done: "Done",
}

const STATUS_ORDER: TaskStatus[] = ["backlog", "progress", "review", "done"]
const FILTER_OPTIONS = ["all", ...STATUS_ORDER] as const

function TaskCard(props: {
  task: Task
  isBlocked: boolean
  isDragging?: boolean
  isActive?: boolean
  onWorkOnTask?: (mode: "chat" | "implement" | "subtasks") => void
}) {
  const bodyPreview = () => {
    if (!props.task.body) return null
    const lines = props.task.body.split("\n").filter((l) => l.trim())
    if (lines.length === 0) return null
    return lines[0].slice(0, 100) + (lines[0].length > 100 ? "..." : "")
  }

  return (
    <div
      class={`p-3 rounded-xl border transition-colors ${
        props.isDragging
          ? "opacity-50"
          : props.isActive
            ? "ring-2 ring-accent-primary bg-accent-primary/5"
            : props.isBlocked
              ? "bg-surface-warning-base/10 border-surface-warning-base/30"
              : "bg-background-stronger border-border-weak-base hover:border-border-strong-base"
      }`}
    >
      <div class="flex items-start justify-between gap-2">
        <div class="text-13-medium text-text-strong flex-1">{props.task.title}</div>
        <Show when={props.isBlocked}>
          <div class="text-11-medium text-surface-warning-base px-1.5 py-0.5 rounded bg-surface-warning-base/20">
            Blocked
          </div>
        </Show>
      </div>

      <Show when={bodyPreview()}>
        <div class="mt-1.5 text-12-regular text-text-weak line-clamp-2">{bodyPreview()}</div>
      </Show>

      <div class="mt-2 flex items-center justify-between">
        <Show when={props.task.deps.length > 0}>
          <div class="flex flex-wrap gap-1">
            <For each={props.task.deps}>
              {(dep) => (
                <div class="text-10-regular text-text-weaker px-1.5 py-0.5 rounded bg-background-base">{dep}</div>
              )}
            </For>
          </div>
        </Show>

        <DropdownMenu>
          <DropdownMenu.Trigger as={Button} variant="ghost" size="small">
            Work on this
          </DropdownMenu.Trigger>
          <DropdownMenu.Portal>
            <DropdownMenu.Content class="bg-background-stronger border border-border-weak-base rounded-lg shadow-lg p-1 min-w-[160px]">
              <DropdownMenu.Item
                class="px-3 py-2 text-13-regular text-text-strong rounded-md hover:bg-accent-primary/10 cursor-pointer"
                onSelect={() => props.onWorkOnTask?.("chat")}
              >
                Chat about this
              </DropdownMenu.Item>
              <DropdownMenu.Item
                class="px-3 py-2 text-13-regular text-text-strong rounded-md hover:bg-accent-primary/10 cursor-pointer"
                onSelect={() => props.onWorkOnTask?.("implement")}
              >
                Start implementation
              </DropdownMenu.Item>
              <DropdownMenu.Item
                class="px-3 py-2 text-13-regular text-text-strong rounded-md hover:bg-accent-primary/10 cursor-pointer"
                onSelect={() => props.onWorkOnTask?.("subtasks")}
              >
                Break into subtasks
              </DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu>
      </div>
    </div>
  )
}

function KanbanColumn(props: {
  status: TaskStatus
  tasks: Task[]
  isBlocked: (task: Task) => boolean
  onTaskMove: (taskId: string, newStatus: TaskStatus) => void
  activeTaskId?: string
  onWorkOnTask?: (taskId: string, mode: "chat" | "implement" | "subtasks") => void
}) {
  const [isDragOver, setIsDragOver] = createSignal(false)

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = () => {
    setIsDragOver(false)
  }

  const handleDrop = (e: DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    const taskId = e.dataTransfer?.getData("task/id")
    if (taskId) {
      props.onTaskMove(taskId, props.status)
    }
  }

  return (
    <div
      class={`flex flex-col rounded-2xl border p-3 min-h-[200px] ${
        isDragOver() ? "border-accent-primary bg-accent-primary/5" : "border-border-weak-base bg-background-base"
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div class="mb-3 flex items-center justify-between">
        <div class="text-13-semibold text-text-strong">{COLUMN_NAMES[props.status]}</div>
        <div class="text-12-regular text-text-weak">{props.tasks.length}</div>
      </div>

      <ScrollView class="flex-1">
        <div class="flex flex-col gap-2">
          <For each={props.tasks}>
            {(task) => (
              <DraggableTaskCard
                task={task}
                isBlocked={props.isBlocked(task)}
                isActive={props.activeTaskId === task.id}
                onWorkOnTask={(mode) => props.onWorkOnTask?.(task.id, mode)}
              />
            )}
          </For>
        </div>
      </ScrollView>
    </div>
  )
}

function DraggableTaskCard(props: {
  task: Task
  isBlocked: boolean
  isActive?: boolean
  onWorkOnTask?: (mode: "chat" | "implement" | "subtasks") => void
}) {
  const handleDragStart = (e: DragEvent) => {
    e.dataTransfer?.setData("task/id", props.task.id)
    e.dataTransfer!.effectAllowed = "move"
  }

  return (
    <div
      draggable={!props.isBlocked}
      onDragStart={handleDragStart}
      class={props.isBlocked ? "cursor-not-allowed" : "cursor-grab active:cursor-grabbing"}
    >
      <TaskCard
        task={props.task}
        isBlocked={props.isBlocked}
        isActive={props.isActive}
        onWorkOnTask={props.onWorkOnTask}
      />
    </div>
  )
}

export default function Tasks() {
  const tasks = createTasksState()
  const navigate = useNavigate()
  const params = useParams()
  const [activeTask, setActive] = createSignal<string | null>(null)
  const [filter, setFilter] = createSignal<TaskStatus | "all">("all")
  const filteredColumns = createMemo(() => {
    const cols = tasks.columns()
    if (filter() === "all") return cols
    const key = filter() as TaskStatus
    return {
      backlog: key === "backlog" ? cols.backlog : [],
      progress: key === "progress" ? cols.progress : [],
      review: key === "review" ? cols.review : [],
      done: key === "done" ? cols.done : [],
    }
  })
  const visibleStatuses = createMemo(() => (filter() === "all" ? STATUS_ORDER : [filter() as TaskStatus]))

  createEffect(() => {
    const url = new URL(window.location.href)
    const taskId = url.searchParams.get("task")
    if (taskId) setActive(taskId)
  })

  const handleTaskMove = (taskId: string, newStatus: TaskStatus) => {
    void tasks.moveTask(taskId, newStatus)
  }

  const handleWorkOnTask = (taskId: string, mode: "chat" | "implement" | "subtasks") => {
    const query = new URLSearchParams({ task: taskId, mode }).toString()
    navigate(`/${params.dir}/session?${query}`)
  }

  return (
    <div class="flex flex-col gap-4 h-full">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <h2 class="text-18-semibold text-text-strong">Tasks</h2>
          <Show when={tasks.loading.saving}>
            <div class="text-12-regular text-text-weak">Saving...</div>
          </Show>
        </div>

        <IconButton
          icon="arrow-down-to-line"
          variant="ghost"
          size="small"
          onClick={() => tasks.refresh()}
          title="Refresh board"
        />
      </div>

      <div class="flex flex-wrap gap-2">
        <For each={FILTER_OPTIONS}>
          {(status) => (
            <button
              class={`h-8 px-3 rounded-lg text-12-medium transition-colors ${
                filter() === status
                  ? "bg-accent-primary text-black"
                  : "bg-background-stronger text-text-weak hover:text-text-strong"
              }`}
              onClick={() => setFilter(status)}
            >
              {status === "all" ? "All" : status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          )}
        </For>
      </div>

      <Show when={tasks.loading.initial}>
        <div class="flex-1 flex items-center justify-center text-13-regular text-text-weak">Loading...</div>
      </Show>

      <Show when={!tasks.loading.initial}>
        <div class="grid gap-4 xl:grid-cols-4 flex-1">
          <For each={visibleStatuses()}>
            {(status) => (
              <KanbanColumn
                status={status}
                tasks={filteredColumns()[status]}
                isBlocked={tasks.isBlocked}
                onTaskMove={handleTaskMove}
                activeTaskId={activeTask() ?? undefined}
                onWorkOnTask={handleWorkOnTask}
              />
            )}
          </For>
        </div>
      </Show>

      <CmdKHint />
    </div>
  )
}
