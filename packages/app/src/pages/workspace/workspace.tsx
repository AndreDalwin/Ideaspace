import { A, useParams } from "@solidjs/router"
import { For, Show, createMemo, createSignal } from "solid-js"
import { Button } from "@opencode-ai/ui/button"
import { IconButton } from "@opencode-ai/ui/icon-button"
import { ScrollView } from "@opencode-ai/ui/scroll-view"
import { Markdown } from "@opencode-ai/ui/markdown"
import { createWorkspaceState } from "./state"
import { useSDK } from "../../context/sdk"
import { CmdKHint } from "@/components/cmd-k-hint"

export default function Workspace() {
  const params = useParams()
  const workspace = createWorkspaceState()
  const sdk = useSDK()
  const [converting, setConverting] = createSignal(false)
  const [lastResult, setLastResult] = createSignal<{ imported: number; skipped: number } | null>(null)

  const plannerSeed = encodeURIComponent("Enter plan mode and create or update the project plan.")
  const plannerHeaderPrompt = encodeURIComponent("Enter plan mode")

  const handleConvert = async () => {
    const selected = workspace.selected()
    if (!selected) return

    setConverting(true)
    try {
      const client = sdk.client as unknown as {
        post: <T, E>(opts: { url: string; body: E; headers?: Record<string, string> }) => Promise<{ data?: T }>
      }
      const res = await client.post<{ imported: number; skipped: number }, { planPath: string }>({
        url: "/task-board/import",
        body: { planPath: selected },
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (res.data) {
        setLastResult(res.data)
        alert(`Imported ${res.data.imported} tasks, skipped ${res.data.skipped} duplicates`)
      }
    } finally {
      setConverting(false)
    }
  }

  const planFiles = createMemo(() => workspace.planFiles())
  const selectedContent = createMemo(() => workspace.selectedContent())
  const contentText = createMemo(() => {
    const content = selectedContent()
    if (!content || content.type !== "text") return null
    return content.content
  })

  const selectedFileName = createMemo(() => {
    const path = workspace.selected()
    if (!path) return "Preview"
    const file = workspace.planFiles().find((p) => p.path === path)
    return file?.name ?? "Preview"
  })

  return (
    <div class="flex h-full flex-col gap-4">
      <div class="flex-1 grid gap-5 xl:grid-cols-[280px_1fr]">
        <div class="flex flex-col gap-3">
          <div class="flex items-center justify-between mb-3">
            <h3 class="text-14-semibold text-text-strong">Plans</h3>
            <div class="flex items-center gap-2">
              <A
                href={`/${params.dir}/session?prompt=${plannerHeaderPrompt}`}
                class="inline-flex h-8 items-center justify-center rounded-lg bg-accent-primary px-3 text-12-medium text-black"
              >
                Start planner
              </A>
              <IconButton
                icon="arrow-down-to-line"
                variant="ghost"
                size="small"
                onClick={() => workspace.refresh()}
                title="Refresh plan list"
              />
            </div>
          </div>

          <ScrollView class="flex-1 border border-border-weak-base rounded-xl">
            <div class="p-2">
              <Show when={planFiles().length === 0}>
                <div class="p-4 text-13-regular text-text-weak text-center">
                  No plans yet. Create one to get started.
                </div>
              </Show>

              <For each={planFiles()}>
                {(plan) => (
                  <button
                    class={`w-full text-left px-3 py-2 rounded-lg text-13-regular transition-colors ${
                      workspace.selected() === plan.path
                        ? "bg-accent-primary/10 text-text-strong"
                        : "text-text-weak hover:bg-background-stronger"
                    }`}
                    onClick={() => workspace.setSelected(plan.path)}
                  >
                    <div class="truncate">{plan.name}</div>
                    <div class="text-11-regular text-text-weaker">{new Date(plan.modified).toLocaleDateString()}</div>
                  </button>
                )}
              </For>
            </div>
          </ScrollView>

          <div class="flex flex-col gap-2">
            <A
              href={`/${params.dir}/session?prompt=${plannerSeed}`}
              class="inline-flex h-10 items-center justify-center rounded-xl bg-accent-primary px-4 text-13-medium text-black"
            >
              Start planner session
            </A>
            <A
              href={`/${params.dir}/session`}
              class="inline-flex h-10 items-center justify-center rounded-xl border border-border-strong-base px-4 text-13-medium text-text-strong"
            >
              Open AI session
            </A>
            <Button
              variant="secondary"
              size="large"
              onClick={handleConvert}
              disabled={!workspace.selected() || converting()}
              class="w-full"
            >
              {converting() ? "Converting..." : "Convert to Tasks"}
            </Button>
            <Show when={lastResult()}>
              <div class="text-12-regular text-text-weak text-center">
                Last import: {lastResult()?.imported} tasks, {lastResult()?.skipped} skipped
              </div>
            </Show>
          </div>
        </div>

        <div class="flex flex-col border border-border-weak-base rounded-xl overflow-hidden">
          <div class="flex items-center justify-between px-4 py-3 border-b border-border-weak-base">
            <h3 class="text-14-semibold text-text-strong">{selectedFileName()}</h3>
          </div>

          <ScrollView class="flex-1 p-4">
            <Show
              when={contentText()}
              fallback={
                <div class="flex h-full items-center justify-center text-13-regular text-text-weak">
                  Select a plan to preview
                </div>
              }
            >
              <Markdown text={contentText()!} class="prose prose-invert max-w-none" />
            </Show>
          </ScrollView>
        </div>
      </div>
      <CmdKHint />
    </div>
  )
}
