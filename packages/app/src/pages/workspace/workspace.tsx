import { A, useParams } from "@solidjs/router"
import { For, Show, createMemo, createSignal } from "solid-js"
import { Button } from "@opencode-ai/ui/button"
import { IconButton } from "@opencode-ai/ui/icon-button"
import { ScrollView } from "@opencode-ai/ui/scroll-view"
import { Markdown } from "@opencode-ai/ui/markdown"
import { Icon } from "@opencode-ai/ui/icon"
import { Spinner } from "@opencode-ai/ui/spinner"
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
        <div class="flex flex-col gap-3 h-full min-h-0">
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
                <div class="p-6 flex flex-col items-center gap-3 text-center">
                  <div class="w-10 h-10 rounded-full bg-background-stronger flex items-center justify-center">
                    <Icon name="folder" class="size-5 text-text-weak" />
                  </div>
                  <div>
                    <div class="text-13-regular text-text-strong">No plans yet</div>
                    <div class="text-12-regular text-text-weak mt-0.5">Start by creating your first plan</div>
                  </div>
                  <A
                    href={`/${params.dir}/session?prompt=${plannerHeaderPrompt}`}
                    class="inline-flex h-8 items-center justify-center rounded-lg bg-accent-primary px-3 text-12-medium text-black mt-1"
                  >
                    Start Planner
                  </A>
                </div>
              </Show>

              <div class="flex flex-col gap-1">
                <For each={planFiles()}>
                  {(plan) => {
                    const selected = workspace.selected() === plan.path
                    return (
                      <button
                        class={`w-full text-left px-3 py-2.5 rounded-lg text-13-regular transition-all ${
                          selected
                            ? "bg-accent-primary/10 text-text-strong border-l-2 border-accent-primary"
                            : "text-text-weak hover:bg-background-stronger hover:text-text-base border-l-2 border-transparent"
                        }`}
                        onClick={() => workspace.setSelected(plan.path)}
                      >
                        <div class="flex items-center gap-2">
                          <Icon
                            name="folder"
                            class={`size-4 shrink-0 ${selected ? "text-accent-primary" : "text-text-weaker"}`}
                          />
                          <div class="truncate flex-1">{plan.name}</div>
                        </div>
                        <div class="text-11-regular text-text-weaker ml-6">
                          {new Date(plan.modified).toLocaleDateString()}
                        </div>
                      </button>
                    )
                  }}
                </For>
              </div>
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
              {converting() ? (
                <>
                  <Spinner class="size-4 mr-2" />
                  Converting...
                </>
              ) : (
                "Convert to Tasks"
              )}
            </Button>
            <Show when={lastResult()}>
              <div class="text-12-regular text-text-weak text-center">
                Last import: {lastResult()?.imported} tasks, {lastResult()?.skipped} skipped
              </div>
            </Show>
          </div>
        </div>

        <div class="flex flex-col h-full border border-border-weak-base rounded-xl overflow-hidden">
          <div class="flex items-center justify-between px-4 py-3 border-b border-border-weak-base">
            <h3 class="text-14-semibold text-text-strong">{selectedFileName()}</h3>
          </div>

          <ScrollView class="flex-1 p-4">
            <Show
              when={contentText()}
              fallback={
                <div class="flex h-full flex-col items-center justify-center gap-3 text-center">
                  <div class="w-12 h-12 rounded-full bg-background-stronger flex items-center justify-center">
                    <Icon name="eye" class="size-6 text-text-weak" />
                  </div>
                  <div>
                    <div class="text-13-regular text-text-strong">Select a plan to preview</div>
                    <div class="text-12-regular text-text-weaker mt-1">
                      Or start a new planner session to create one
                    </div>
                  </div>
                  <A
                    href={`/${params.dir}/session?prompt=${plannerHeaderPrompt}`}
                    class="inline-flex h-8 items-center justify-center rounded-lg border border-border-strong-base px-3 text-12-medium text-text-strong mt-2"
                  >
                    Start Planner
                  </A>
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
