import { Button } from "@opencode-ai/ui/button"
import { Markdown } from "@opencode-ai/ui/markdown"
import { For, Show, createEffect, createMemo, onMount } from "solid-js"
import { createStore } from "solid-js/store"
import { createMediaQuery } from "@solid-primitives/media"
import { ProjectTabs } from "@/components/project-tabs"
import { useLocal } from "@/context/local"
import { useSDK } from "@/context/sdk"
import { SessionPage } from "@/pages/session"

const root = ".ideaspace/plans"

export default function PlanPage() {
  const sdk = useSDK()
  const local = useLocal()
  const isDesktop = createMediaQuery("(min-width: 768px)")
  const [state, setState] = createStore({
    list: [] as { name: string; path: string; type: "file" | "directory" }[],
    path: "",
    text: "",
    busy: false,
    err: "",
  })

  const files = createMemo(() => state.list.filter((item) => item.type === "file" && item.path.endsWith(".md")))

  const load = async (path: string) => {
    setState({ path, busy: true, err: "" })
    const file = await sdk.client.file
      .read({ path })
      .then((x) => x.data)
      .catch(() => undefined)
    if (!file) {
      setState({ text: "", busy: false, err: "Failed to load the selected plan." })
      return
    }
    if (file.type !== "text") {
      setState({ text: "", busy: false, err: "The selected plan is not a text markdown file." })
      return
    }
    setState({ text: file.content, busy: false, err: "" })
  }

  const scan = async () => {
    setState("busy", true)
    const list = await sdk.client.file
      .list({ path: root })
      .then((x) => x.data ?? [])
      .catch(() => [])
    const next = list
      .filter((item) => item.type === "file" && item.path.endsWith(".md"))
      .sort((a, b) => b.name.localeCompare(a.name))

    setState("list", next)

    const path = next.some((item) => item.path === state.path) ? state.path : (next[0]?.path ?? "")
    if (!path) {
      setState({ path: "", text: "", busy: false, err: "" })
      return
    }
    await load(path)
  }

  onMount(() => {
    void scan()
    const refresh = () => {
      void scan()
    }
    window.addEventListener("focus", refresh)
  })

  createEffect(() => {
    local.agent.set("plan")
  })

  return (
    <div class="relative bg-background-base size-full overflow-hidden flex flex-col">
      <ProjectTabs />

      <div class="flex-1 min-h-0 flex overflow-hidden">
        <div class="flex-1 min-w-0 overflow-hidden flex flex-col border-r border-border-weak-base">
          <div class="flex items-center justify-between gap-3 border-b border-border-weak-base px-4 py-3">
            <div class="flex flex-col gap-1">
              <div class="text-14-medium text-text-strong">Plans</div>
              <div class="text-12-regular text-text-weak">
                Planner sessions should write markdown plans into <code class="text-text-strong">.ideaspace/plans</code>
                .
              </div>
            </div>
            <Button size="small" variant="ghost" onClick={() => void scan()}>
              Refresh
            </Button>
          </div>

          <div class="flex-1 min-h-0 overflow-hidden grid md:grid-cols-[260px_minmax(0,1fr)]">
            <div class="border-r border-border-weak-base overflow-auto">
              <Show
                when={files().length > 0}
                fallback={
                  <div class="p-4 text-13-regular text-text-weak">
                    No plan files yet. Start using the planner on the right and it will write plans here.
                  </div>
                }
              >
                <div class="flex flex-col p-2">
                  <For each={files()}>
                    {(item) => (
                      <button
                        type="button"
                        class="rounded-xl border px-3 py-2 text-left transition-colors"
                        classList={{
                          "border-accent-primary bg-accent-primary/10": state.path === item.path,
                          "border-transparent hover:border-border-weak-base hover:bg-background-stronger":
                            state.path !== item.path,
                        }}
                        onClick={() => void load(item.path)}
                      >
                        <div class="text-13-medium text-text-strong">{item.name}</div>
                        <div class="mt-1 text-12-regular text-text-weak">{item.path}</div>
                      </button>
                    )}
                  </For>
                </div>
              </Show>
            </div>

            <div class="min-w-0 overflow-auto">
              <Show
                when={state.text}
                fallback={
                  <div class="flex h-full items-center justify-center p-6 text-center text-13-regular text-text-weak">
                    <div>
                      <div class="text-14-medium text-text-strong">No plan selected</div>
                      <div class="mt-2">
                        Use the planner on the right to create a markdown plan, then refresh this view.
                      </div>
                    </div>
                  </div>
                }
              >
                <div class="p-5">
                  <div class="rounded-[18px] border border-border-weak-base bg-background-stronger p-5">
                    <Show when={state.err}>
                      <div class="mb-4 rounded-xl border border-surface-critical-base/40 bg-surface-critical-base/10 px-3 py-2 text-12-regular text-text-strong">
                        {state.err}
                      </div>
                    </Show>
                    <Markdown text={state.text} class="text-13-regular" />
                  </div>
                </div>
              </Show>
            </div>
          </div>
        </div>

        <Show when={isDesktop()}>
          <div class="hidden md:flex md:w-[42rem] md:min-w-[32rem] md:max-w-[48rem]">
            <SessionPage embedded />
          </div>
        </Show>
      </div>
    </div>
  )
}
