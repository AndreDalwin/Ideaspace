import { Show, For, createEffect, createSignal, onCleanup } from "solid-js"
import { ScrollView } from "@opencode-ai/ui/scroll-view"
import { IconButton } from "@opencode-ai/ui/icon-button"
import { showToast } from "@opencode-ai/ui/toast"
import { useSDK } from "@/context/sdk"
import type { Task, TaskBoard } from "@/pages/tasks/state"

interface ContextPanelProps {
  attachedFiles?: string[]
  onAddFile?: () => void
  onRemoveFile?: (path: string) => void
}

export function ContextPanel(props: ContextPanelProps) {
  const sdk = useSDK()
  const [board, setBoard] = createSignal<TaskBoard | null>(null)
  const [loading, setLoading] = createSignal(true)
  const [prevCompleted, setPrevCompleted] = createSignal(0)
  const [baselineReady, setBaselineReady] = createSignal(false)

  const REFRESH_INTERVAL = 2000

  async function loadBoard() {
    try {
      const client = sdk.client as unknown as {
        get: <T>(opts: { url: string }) => Promise<{ data?: T }>
      }
      const res = await client.get<TaskBoard>({
        url: "/task-board",
      })
      if (res.data) {
        setBoard(res.data)
      }
    } catch (e) {
      console.error("Failed to load task board:", e)
    } finally {
      setLoading(false)
    }
  }

  createEffect(() => {
    void loadBoard()

    const interval = setInterval(() => {
      void loadBoard()
    }, REFRESH_INTERVAL)

    onCleanup(() => clearInterval(interval))
  })

  const tasks = () => board()?.tasks || []
  const completedTasks = () => tasks().filter((t) => t.status === "done").length
  const inProgressTasks = () => tasks().filter((t) => t.status === "progress").length
  const backlogTasks = () => tasks().filter((t) => t.status === "backlog").length

  createEffect(() => {
    if (loading()) return
    const current = completedTasks()
    if (!baselineReady()) {
      setPrevCompleted(current)
      setBaselineReady(true)
      return
    }
    if (current > prevCompleted()) {
      const diff = current - prevCompleted()
      showToast({
        title: "Task complete!",
        description: `Great progress — ${diff} more task${diff === 1 ? "" : "s"} done!`,
        icon: "check",
        variant: "success",
        duration: 2500,
      })
    }
    setPrevCompleted(current)
  })

  return (
    <div class="flex flex-col h-full">
      <div class="border-b border-border-weak-base">
        <div class="flex items-center justify-between px-4 py-2 border-b border-border-weak-base">
          <span class="text-12-medium text-text-strong">Attached Files</span>
          <IconButton
            icon="plus"
            variant="ghost"
            size="small"
            onClick={props.onAddFile}
            title="Add file"
            class="motion-safe:transition-colors duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-primary/70"
          />
        </div>

        <div class="p-2">
          <Show
            when={props.attachedFiles && props.attachedFiles.length > 0}
            fallback={<div class="text-11-regular text-text-weak text-center py-2">No files attached</div>}
          >
            <For each={props.attachedFiles}>
              {(file) => (
                <div class="flex items-center justify-between px-2 py-1 rounded transition-colors duration-200 motion-safe:transition-colors hover:bg-background-stronger">
                  <span class="text-12-regular text-text-strong truncate">{file}</span>
                  <IconButton
                    icon="close"
                    variant="ghost"
                    size="small"
                    onClick={() => props.onRemoveFile?.(file)}
                    class="motion-safe:transition-colors duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-primary/70"
                  />
                </div>
              )}
            </For>
          </Show>
        </div>
      </div>

      <div class="border-b border-border-weak-base">
        <div class="px-4 py-2 border-b border-border-weak-base">
          <span class="text-12-medium text-text-strong">Progress</span>
        </div>

        <div class="p-4">
          <Show when={!loading()} fallback={<div class="text-11-regular text-text-weak">Loading...</div>}>
            <div class="flex items-center justify-between mb-2">
              <span class="text-14-semibold text-text-strong">
                {completedTasks()} / {tasks().length}
              </span>
              <span class="text-11-regular text-text-weak">tasks complete</span>
            </div>

            <div class="h-2 bg-background-stronger rounded-full overflow-hidden">
              <div
                class="h-full bg-accent-primary motion-safe:transition-all motion-safe:duration-300 motion-safe:ease-out"
                style={{
                  width: `${tasks().length > 0 ? (completedTasks() / tasks().length) * 100 : 0}%`,
                }}
              />
            </div>

            <div class="flex gap-3 mt-3">
              <div class="flex items-center gap-1">
                <div class="w-2 h-2 rounded-full bg-surface-success-base" />
                <span class="text-11-regular text-text-weak">{completedTasks()} Done</span>
              </div>
              <div class="flex items-center gap-1">
                <div class="w-2 h-2 rounded-full bg-accent-primary" />
                <span class="text-11-regular text-text-weak">{inProgressTasks()} In Progress</span>
              </div>
              <div class="flex items-center gap-1">
                <div class="w-2 h-2 rounded-full bg-border-strong-base" />
                <span class="text-11-regular text-text-weak">{backlogTasks()} Backlog</span>
              </div>
            </div>
          </Show>
        </div>
      </div>

      <ScrollView class="flex-1 scroll-smooth">
        <div class="px-4 py-2 border-b border-border-weak-base">
          <span class="text-12-medium text-text-strong">Active Tasks</span>
        </div>

        <div class="p-2">
          <Show
            when={!loading() && tasks().length > 0}
            fallback={<div class="text-11-regular text-text-weak text-center py-4">No tasks yet</div>}
          >
            <For each={tasks().filter((t) => t.status !== "done")}>
              {(task) => (
                <div class="px-2 py-2 rounded transition-colors duration-200 motion-safe:transition-colors hover:bg-background-stronger cursor-pointer">
                  <div class="text-12-medium text-text-strong truncate">{task.title}</div>
                  <div class="flex items-center gap-2 mt-1">
                    <span
                      class={`text-10-regular px-1.5 py-0.5 rounded ${
                        task.status === "progress"
                          ? "bg-accent-primary/20 text-accent-primary"
                          : "bg-border-weak-base text-text-weak"
                      }`}
                    >
                      {task.status}
                    </span>
                    <Show when={task.deps.length > 0}>
                      <span class="text-10-regular text-text-weaker">{task.deps.length} deps</span>
                    </Show>
                  </div>
                </div>
              )}
            </For>
          </Show>
        </div>
      </ScrollView>

      <div class="border-t border-border-weak-base px-4 py-3">
        <div class="flex items-center justify-between">
          <span class="text-11-regular text-text-weak">Tokens</span>
          <span class="text-11-medium text-text-strong">-- / --</span>
        </div>
        <div class="text-10-regular text-text-weaker mt-1">Context usage will be shown here</div>
      </div>
    </div>
  )
}
