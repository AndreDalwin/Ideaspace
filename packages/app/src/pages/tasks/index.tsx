import { For, Show, createSignal } from "solid-js"
import { createTasksState, type Task, type TaskStatus } from "./state"
import { ScrollView } from "@opencode-ai/ui/scroll-view"
import { IconButton } from "@opencode-ai/ui/icon-button"

const COLUMN_NAMES: Record<TaskStatus, string> = {
  backlog: "Backlog",
  progress: "In Progress",
  review: "Review",
  done: "Done",
}

function TaskCard(props: { task: Task; isBlocked: boolean; isDragging?: boolean }) {
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
          : props.isBlocked
            ? "bg-surface-warning-base/10 border-surface-warning-base/30"
            : "bg-background-stronger border-border-weak-base"
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

      <Show when={props.task.deps.length > 0}>
        <div class="mt-2 flex flex-wrap gap-1">
          <For each={props.task.deps}>
            {(dep) => (
              <div class="text-10-regular text-text-weaker px-1.5 py-0.5 rounded bg-background-base">{dep}</div>
            )}
          </For>
        </div>
      </Show>
    </div>
  )
}

function KanbanColumn(props: {
  status: TaskStatus
  tasks: Task[]
  isBlocked: (task: Task) => boolean
  onTaskMove: (taskId: string, newStatus: TaskStatus) => void
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
          <For each={props.tasks}>{(task) => <DraggableTaskCard task={task} isBlocked={props.isBlocked(task)} />}</For>
        </div>
      </ScrollView>
    </div>
  )
}

function DraggableTaskCard(props: { task: Task; isBlocked: boolean }) {
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
      <TaskCard task={props.task} isBlocked={props.isBlocked} />
    </div>
  )
}

export default function Tasks() {
  const tasks = createTasksState()

  const handleTaskMove = (taskId: string, newStatus: TaskStatus) => {
    void tasks.moveTask(taskId, newStatus)
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

      <Show when={tasks.loading.initial}>
        <div class="flex-1 flex items-center justify-center text-13-regular text-text-weak">Loading...</div>
      </Show>

      <Show when={!tasks.loading.initial}>
        <div class="grid gap-4 xl:grid-cols-4 flex-1">
          <KanbanColumn
            status="backlog"
            tasks={tasks.columns().backlog}
            isBlocked={tasks.isBlocked}
            onTaskMove={handleTaskMove}
          />
          <KanbanColumn
            status="progress"
            tasks={tasks.columns().progress}
            isBlocked={tasks.isBlocked}
            onTaskMove={handleTaskMove}
          />
          <KanbanColumn
            status="review"
            tasks={tasks.columns().review}
            isBlocked={tasks.isBlocked}
            onTaskMove={handleTaskMove}
          />
          <KanbanColumn
            status="done"
            tasks={tasks.columns().done}
            isBlocked={tasks.isBlocked}
            onTaskMove={handleTaskMove}
          />
        </div>
      </Show>
    </div>
  )
}
