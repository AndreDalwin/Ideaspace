import { For, Show, createSignal, onMount } from "solid-js"
import { createStore } from "solid-js/store"
import { useSDK } from "@/context/sdk"
import type { AgentRun } from "@opencode-ai/sdk/v2/client"

export default function AgentsTab() {
  const sdk = useSDK()
  const [store, setStore] = createStore<{ runs: AgentRun[]; loading: boolean }>({ runs: [], loading: true })

  onMount(async () => {
    const response = await sdk.client.agentRun.list({}, { throwOnError: true })
    setStore("runs", response.data ?? [])
    setStore("loading", false)
  })

  const stats = () => {
    const runs = store.runs
    return {
      running: runs.filter((r) => r.status === "running").length,
      queued: runs.filter((r) => r.status === "queued").length,
      done: runs.filter((r) => r.status === "done").length,
      failed: runs.filter((r) => r.status === "failed").length,
    }
  }

  const statCards = () => [
    { label: "Running", value: stats().running },
    { label: "Queued", value: stats().queued },
    { label: "Completed", value: stats().done },
    { label: "Failed", value: stats().failed },
  ]

  return (
    <div class="flex flex-col gap-5">
      <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <For each={statCards()}>
          {(stat) => (
            <div class="rounded-[18px] border border-border-weak-base bg-background-stronger p-5">
              <div class="text-12-medium uppercase tracking-[0.16em] text-text-weak">{stat.label}</div>
              <div class="mt-3 text-32-semibold text-text-strong">{stat.value}</div>
            </div>
          )}
        </For>
      </div>

      <section class="rounded-[18px] border border-border-weak-base bg-background-stronger p-5">
        <div class="mb-4">
          <h2 class="text-16-medium text-text-strong">Agent runs</h2>
          <p class="text-13-regular text-text-weak">History of agent executions in this project</p>
        </div>
        <Show
          when={store.runs.length > 0}
          fallback={
            <div class="py-12 text-center">
              <div class="text-14-medium text-text-strong">No agent runs yet</div>
              <div class="mt-1 text-13-regular text-text-weak">
                Runs will appear here as agents execute tasks in this project.
              </div>
            </div>
          }
        >
          <div class="flex flex-col gap-2">
            <For each={store.runs}>
              {(run) => <RunRow run={run} />}
            </For>
          </div>
        </Show>
      </section>
    </div>
  )
}

function RunRow(props: { run: AgentRun }) {
  const statusColor: Record<string, string> = {
    running: "bg-accent-primary/12 text-accent-primary",
    queued: "bg-surface-warning-base/18 text-text-strong",
    done: "bg-surface-success-base/18 text-text-strong",
    failed: "bg-red-500/20 text-red-400",
  }

  const duration = () => {
    if (!props.run.startedAt) return undefined
    const end = props.run.endedAt ?? Date.now()
    const seconds = Math.round((end - props.run.startedAt) / 1000)
    if (seconds < 60) return `${seconds}s`
    return `${Math.round(seconds / 60)}m`
  }

  return (
    <div class="flex items-center gap-3 rounded-2xl border border-border-weak-base bg-background-base p-4">
      <div class="flex-1 min-w-0">
        <div class="flex items-center gap-2">
          <span class={`inline-flex rounded-full px-2 py-0.5 text-11-medium ${statusColor[props.run.status] ?? statusColor.queued}`}>
            {props.run.status}
          </span>
          <span class="text-13-medium text-text-strong">{props.run.agentKind}</span>
        </div>
        <Show when={props.run.summary}>
          <div class="mt-1 text-12-regular text-text-weak line-clamp-1">{props.run.summary}</div>
        </Show>
      </div>
      <div class="flex items-center gap-3 shrink-0 text-12-regular text-text-weak">
        <Show when={duration()}>
          <span>{duration()}</span>
        </Show>
        <Show when={props.run.tokensIn || props.run.tokensOut}>
          <span>
            {props.run.tokensIn ?? 0}in / {props.run.tokensOut ?? 0}out
          </span>
        </Show>
      </div>
    </div>
  )
}
