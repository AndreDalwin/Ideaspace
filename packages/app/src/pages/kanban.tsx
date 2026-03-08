import { Button } from "@opencode-ai/ui/button"
import { For, Show, createMemo, onMount, type ParentProps } from "solid-js"
import { createStore } from "solid-js/store"
import { createMediaQuery } from "@solid-primitives/media"
import { ProjectTabs } from "@/components/project-tabs"
import { useSDK } from "@/context/sdk"
import { SessionPage } from "@/pages/session"

type Card = {
  id: string
  title: string
  detail: string
  status: "planned" | "in_progress" | "done" | "blocked"
  priority: "high" | "medium" | "low"
}

function Pane(props: ParentProps<{ title: string; note: string }>) {
  return (
    <section class="rounded-[18px] border border-border-weak-base bg-background-stronger p-5">
      <div class="mb-4 flex flex-col gap-1">
        <h2 class="text-16-medium text-text-strong">{props.title}</h2>
        <p class="text-13-regular text-text-weak">{props.note}</p>
      </div>
      {props.children}
    </section>
  )
}

export default function KanbanPage() {
  const sdk = useSDK()
  const isDesktop = createMediaQuery("(min-width: 768px)")
  const [state, setState] = createStore({
    items: [] as Card[],
    busy: false,
    err: "",
  })

  const cols = createMemo(() => [
    { name: "Planned", items: state.items.filter((item) => item.status === "planned") },
    { name: "In progress", items: state.items.filter((item) => item.status === "in_progress") },
    { name: "Done", items: state.items.filter((item) => item.status === "done") },
    { name: "Blocked", items: state.items.filter((item) => item.status === "blocked") },
  ])

  const scan = async () => {
    setState({ busy: true, err: "" })
    const file = await sdk.client.file
      .read({ path: ".ideaspace/kanban.json" })
      .then((x) => x.data)
      .catch(() => undefined)
    if (!file) {
      setState({ items: [], busy: false, err: "" })
      return
    }
    if (file.type !== "text") {
      setState({ items: [], busy: false, err: "Kanban data is not a text file." })
      return
    }
    try {
      const parsed = JSON.parse(file.content) as { items?: Card[] }
      const items = Array.isArray(parsed.items) ? parsed.items : []
      setState({ items, busy: false, err: "" })
    } catch {
      setState({ items: [], busy: false, err: "Failed to parse .ideaspace/kanban.json" })
    }
  }

  onMount(() => {
    void scan()
    const refresh = () => {
      void scan()
    }
    window.addEventListener("focus", refresh)
  })

  return (
    <div class="relative bg-background-base size-full overflow-hidden flex flex-col">
      <ProjectTabs />

      <div class="flex-1 min-h-0 flex overflow-hidden">
        <div class="flex-1 min-w-0 overflow-auto p-4 md:p-5">
          <Pane
            title="Kanban"
            note="This board reads project cards from .ideaspace/kanban.json. Ask the planner on the right to convert an approved plan into kanban items."
          >
            <div class="mb-4 flex items-center justify-end">
              <Button size="small" variant="ghost" onClick={() => void scan()}>
                Refresh
              </Button>
            </div>

            <Show when={state.err}>
              <div class="mb-4 rounded-xl border border-surface-critical-base/40 bg-surface-critical-base/10 px-3 py-2 text-12-regular text-text-strong">
                {state.err}
              </div>
            </Show>

            <Show
              when={state.items.length > 0}
              fallback={
                <div class="rounded-2xl border border-dashed border-border-weak-base bg-background-base px-4 py-8 text-center text-13-regular text-text-weak">
                  No kanban cards yet. Use the planner on the right, approve the plan, then ask it to convert the plan
                  into kanban cards.
                </div>
              }
            >
              <div class="grid gap-4 xl:grid-cols-4">
                <For each={cols()}>
                  {(col) => (
                    <div class="rounded-2xl border border-border-weak-base bg-background-base p-3">
                      <div class="mb-3 flex items-center justify-between">
                        <div class="text-13-medium text-text-strong">{col.name}</div>
                        <div class="text-12-regular text-text-weak">{col.items.length}</div>
                      </div>
                      <div class="flex flex-col gap-3">
                        <Show
                          when={col.items.length > 0}
                          fallback={
                            <div class="rounded-xl border border-dashed border-border-weak-base px-3 py-5 text-center text-12-regular text-text-weak">
                              No cards
                            </div>
                          }
                        >
                          <For each={col.items}>
                            {(item) => (
                              <div class="rounded-xl border border-border-weak-base bg-background-stronger p-3">
                                <div class="text-13-medium text-text-strong">{item.title}</div>
                                <Show when={item.detail}>
                                  <div class="mt-1 text-12-regular text-text-weak">{item.detail}</div>
                                </Show>
                                <div class="mt-2 text-11-medium uppercase tracking-[0.08em] text-text-weaker">
                                  {item.priority} priority
                                </div>
                              </div>
                            )}
                          </For>
                        </Show>
                      </div>
                    </div>
                  )}
                </For>
              </div>
            </Show>
          </Pane>
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
