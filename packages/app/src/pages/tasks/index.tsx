import { For, Show, createSignal } from "solid-js"
import {
  DragDropProvider,
  DragDropSensors,
  DragOverlay,
  closestCenter,
  createDroppable,
  createDraggable,
} from "@thisbeyond/solid-dnd"
import { useTaskBoard } from "@/context/task-board"
import type { Task } from "@opencode-ai/sdk/v2/client"

export default function TasksTab() {
  const board = useTaskBoard()
  const [creating, setCreating] = createSignal<string | false>(false)
  const [newTitle, setNewTitle] = createSignal("")
  const [activeTask, setActiveTask] = createSignal<Task>()

  const handleCreate = async (status: string) => {
    const title = newTitle().trim()
    if (!title) return
    await board.create({ title, status })
    setCreating(false)
    setNewTitle("")
  }

  const handleDragEnd = async (event: { draggable: { id: string | number }; droppable?: { id: string | number } | null }) => {
    setActiveTask(undefined)
    if (!event.droppable) return
    const taskID = String(event.draggable.id)
    const status = String(event.droppable.id)
    const task = board.tasks.find((t) => t.id === taskID)
    if (!task || task.status === status) return
    const tasksInColumn = board.byStatus(status)
    await board.move(taskID, status, tasksInColumn.length)
  }

  const handleDragStart = (event: { draggable: { id: string | number } }) => {
    const task = board.tasks.find((t) => t.id === String(event.draggable.id))
    setActiveTask(task)
  }

  return (
    <DragDropProvider
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      collisionDetector={closestCenter}
    >
      <DragDropSensors />
      <div class="grid gap-4 xl:grid-cols-4">
        <For each={board.columns}>
          {(col) => <Column id={col.id} label={col.label} tasks={board.byStatus(col.id)} creating={creating()} onStartCreate={() => { setCreating(col.id); setNewTitle("") }} newTitle={newTitle()} onNewTitleChange={setNewTitle} onConfirmCreate={() => handleCreate(col.id)} onCancelCreate={() => setCreating(false)} onRemove={board.remove} />}
        </For>
      </div>
      <DragOverlay>
        <Show when={activeTask()}>
          {(task) => <TaskCardOverlay task={task()} />}
        </Show>
      </DragOverlay>
    </DragDropProvider>
  )
}

function Column(props: {
  id: string
  label: string
  tasks: Task[]
  creating: string | false
  onStartCreate: () => void
  newTitle: string
  onNewTitleChange: (v: string) => void
  onConfirmCreate: () => void
  onCancelCreate: () => void
  onRemove: (id: string) => Promise<void>
}) {
  const droppable = createDroppable(props.id)

  return (
    <div
      ref={droppable.ref}
      class="rounded-2xl border border-border-weak-base bg-background-stronger p-3 min-h-[200px]"
      classList={{ "border-accent-primary/40": droppable.isActiveDroppable }}
    >
      <div class="mb-3 flex items-center justify-between">
        <div class="text-13-medium text-text-strong">{props.label}</div>
        <div class="text-12-regular text-text-weak">{props.tasks.length}</div>
      </div>
      <div class="flex flex-col gap-2">
        <For each={props.tasks}>
          {(task) => <TaskCard task={task} onRemove={props.onRemove} />}
        </For>
        <Show when={props.creating === props.id}>
          <form
            class="flex flex-col gap-1"
            onSubmit={(e) => {
              e.preventDefault()
              props.onConfirmCreate()
            }}
          >
            <input
              autofocus
              class="rounded-xl border border-border-weak-base bg-background-base px-3 py-2 text-13-regular text-text-strong outline-none"
              placeholder="Task title"
              value={props.newTitle}
              onInput={(e) => props.onNewTitleChange(e.currentTarget.value)}
              onBlur={() => props.onCancelCreate()}
            />
          </form>
        </Show>
        <button
          class="rounded-xl px-3 py-1.5 text-left text-12-regular text-text-weak hover:text-text-strong"
          onClick={() => props.onStartCreate()}
        >
          + Add task
        </button>
      </div>
    </div>
  )
}

function TaskCard(props: { task: Task; onRemove: (id: string) => Promise<void> }) {
  const draggable = createDraggable(props.task.id)

  const priorityColor: Record<string, string> = {
    urgent: "bg-red-500/20 text-red-400",
    high: "bg-orange-500/20 text-orange-400",
    medium: "bg-blue-500/20 text-blue-400",
    low: "bg-zinc-500/20 text-zinc-400",
  }

  return (
    <div
      ref={draggable.ref}
      {...draggable.dragActivators}
      class="group cursor-grab rounded-xl border border-border-weak-base bg-background-base p-3 active:cursor-grabbing"
    >
      <div class="flex items-start justify-between gap-2">
        <div class="text-13-medium text-text-strong">{props.task.title}</div>
        <button
          class="shrink-0 text-11-regular text-text-weak opacity-0 hover:text-red-400 group-hover:opacity-100"
          onClick={() => props.onRemove(props.task.id)}
        >
          x
        </button>
      </div>
      <Show when={props.task.body}>
        <div class="mt-1 text-12-regular text-text-weak line-clamp-2">{props.task.body}</div>
      </Show>
      <div class="mt-2 flex gap-1.5">
        <span class={`inline-flex rounded-full px-2 py-0.5 text-11-medium ${priorityColor[props.task.priority] ?? priorityColor.medium}`}>
          {props.task.priority}
        </span>
      </div>
    </div>
  )
}

function TaskCardOverlay(props: { task: Task }) {
  return (
    <div class="rounded-xl border border-accent-primary bg-background-base p-3 shadow-lg">
      <div class="text-13-medium text-text-strong">{props.task.title}</div>
    </div>
  )
}
