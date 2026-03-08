import { Show, createEffect, createMemo, createSignal, onMount, onCleanup } from "solid-js"
import { createStore } from "solid-js/store"
import { Markdown } from "@opencode-ai/ui/markdown"
import { Button } from "@opencode-ai/ui/button"
import { IconButton } from "@opencode-ai/ui/icon-button"
import { ScrollView } from "@opencode-ai/ui/scroll-view"
import { useFile } from "@/context/file"
import { useSDK } from "@/context/sdk"
import type { TaskBoard } from "@/pages/tasks/state"

interface DocumentPanelProps {
  planPath?: string
  onTaskCheck?: (taskId: string, checked: boolean) => void
}

type Mode = "preview" | "edit"

interface Task {
  id: string
  checked: boolean
  text: string
}

export function DocumentPanel(props: DocumentPanelProps) {
  const file = useFile()
  const sdk = useSDK()
  let contentRef: HTMLDivElement | undefined

  const [state, setState] = createStore({
    mode: "preview" as Mode,
    content: "",
  })
  const [updating, setUpdating] = createSignal<number | null>(null)
  const [board, setBoard] = createSignal<TaskBoard | null>(null)

  const planFileState = createMemo(() => (props.planPath ? file.get(props.planPath) : undefined))
  const planLoading = createMemo(() => Boolean(planFileState()?.loading))

  createEffect(() => {
    const path = props.planPath
    if (!path) {
      setState("content", "# No plan selected\n\nCreate a plan to get started.")
      return
    }

    void file.load(path)
  })

  createEffect(() => {
    const path = props.planPath
    if (!path) return

    const fileData = file.get(path)
    const fileContent = fileData?.content
    if (fileContent?.type === "text") {
      setState("content", fileContent.content)
    }
  })

  async function loadBoard() {
    try {
      const client = sdk.client as unknown as {
        get: <T>(opts: { url: string }) => Promise<{ data?: T }>
      }
      const res = await client.get<TaskBoard>({ url: "/task-board" })
      if (res.data) setBoard(res.data)
    } catch (e) {
      console.error("Failed to load task board:", e)
    }
  }

  createEffect(() => {
    void loadBoard()
  })

  const handleTaskToggle = async (taskIndex: number, checked: boolean) => {
    const b = board()
    if (!b) return

    const task = b.tasks[taskIndex]
    if (!task) return

    setUpdating(taskIndex)
    try {
      const client = sdk.client as unknown as {
        patch: <T, E>(opts: { url: string; body: T; headers?: Record<string, string> }) => Promise<{ data?: T }>
      }

      const newStatus = checked ? "done" : "backlog"

      const res = await client.patch<TaskBoard, unknown>({
        url: "/task-board",
        body: {
          ...b,
          tasks: b.tasks.map((t, i) =>
            i === taskIndex ? { ...t, status: newStatus, time: { ...t.time, updated: Date.now() } } : t,
          ),
        },
        headers: { "Content-Type": "application/json" },
      })

      if (res.data) {
        setBoard(res.data)
        props.onTaskCheck?.(task.id, checked)
      }
    } catch (err) {
      console.error("Failed to update task:", err)
    } finally {
      setUpdating(null)
    }
  }

  function handleCheckboxClick(e: Event) {
    const target = e.target as HTMLInputElement
    if (target.tagName !== "INPUT" || target.type !== "checkbox") return

    e.preventDefault()

    const checkboxes = Array.from(contentRef?.querySelectorAll('input[type="checkbox"]') || [])
    const index = checkboxes.indexOf(target)
    if (index === -1) return

    const checked = !target.checked
    target.checked = checked

    void handleTaskToggle(index, checked)
  }

  onMount(() => {
    if (!contentRef) return
    contentRef.addEventListener("click", handleCheckboxClick)
    onCleanup(() => contentRef?.removeEventListener("click", handleCheckboxClick))
  })

  const tasks = createMemo(() => {
    const taskRegex = /^- \[([ x])\] (.+)$/gm
    const matches = [...state.content.matchAll(taskRegex)]
    return matches.map(
      (match, index): Task => ({
        id: `task-${index}`,
        checked: match[1] === "x",
        text: match[2],
      }),
    )
  })

  const completedCount = createMemo(() => tasks().filter((t) => t.checked).length)
  const totalCount = createMemo(() => tasks().length)

  return (
    <div class="flex flex-col h-full">
      <div class="flex items-center justify-between px-4 py-2 border-b border-border-weak-base">
        <span class="text-12-medium text-text-strong">Plan</span>

        <div class="flex items-center gap-2">
          <Button
            variant={state.mode === "preview" ? "secondary" : "ghost"}
            size="small"
            onClick={() => setState("mode", "preview")}
          >
            Preview
          </Button>
          <Button
            variant={state.mode === "edit" ? "secondary" : "ghost"}
            size="small"
            onClick={() => setState("mode", "edit")}
          >
            Edit
          </Button>

          <Show when={props.planPath}>
            <IconButton
              icon="arrow-down-to-line"
              variant="ghost"
              size="small"
              onClick={() => file.tree.refresh(".ideaspace/plans")}
              title="Refresh plan"
            />
          </Show>
        </div>
      </div>

      <ScrollView class="flex-1 scroll-smooth">
        <Show when={state.mode === "preview"}>
          <Show
            when={!planLoading() || !props.planPath}
            fallback={
              <div class="p-4 space-y-3">
                <div class="h-4 bg-background-stronger rounded animate-pulse w-3/4" />
                <div class="h-4 bg-background-stronger rounded animate-pulse" />
                <div class="h-4 bg-background-stronger rounded animate-pulse w-5/6" />
              </div>
            }
          >
            <div ref={contentRef} class="p-4 document-panel transition-all duration-200">
              <Markdown text={state.content} class="prose prose-invert max-w-none" />
            </div>
          </Show>
        </Show>

        <Show when={state.mode === "edit"}>
          <textarea
            class="w-full h-full min-h-[400px] bg-transparent p-4 font-mono text-13-regular resize-none transition-colors focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-primary/70"
            value={state.content}
            onInput={(e) => setState("content", e.currentTarget.value)}
            placeholder="# Enter your plan here..."
          />
        </Show>
      </ScrollView>

      <Show when={totalCount() > 0}>
        <div class="border-t border-border-weak-base px-4 py-2">
          <div class="text-11-regular text-text-weak">
            {completedCount()} / {totalCount()} tasks complete
          </div>
        </div>
      </Show>
    </div>
  )
}
