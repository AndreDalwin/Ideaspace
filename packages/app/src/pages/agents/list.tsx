import { createMemo, createSignal, For, Show } from "solid-js"
import { Card } from "@opencode-ai/ui/card"
import { Tag } from "@opencode-ai/ui/tag"
import { Icon } from "@opencode-ai/ui/icon"
import { useAgents } from "@/context/agents"
import type { Agent } from "@opencode-ai/sdk/v2/client"

interface AgentListProps {
  onSelect?: (agent: Agent) => void
  selected?: string
}

export function AgentList(props: AgentListProps) {
  const agents = useAgents()
  const [query, setQuery] = createSignal("")

  const filtered = createMemo(() => {
    const q = query().toLowerCase()
    if (!q) return agents.list
    return agents.list.filter(
      (a) => a.name.toLowerCase().includes(q) || (a.description?.toLowerCase().includes(q) ?? false),
    )
  })

  const primary = createMemo(() => filtered().filter((a) => a.mode === "primary" || a.mode === "all"))

  const subagents = createMemo(() => filtered().filter((a) => a.mode === "subagent"))

  const handleClick = (agent: Agent) => {
    props.onSelect?.(agent)
  }

  return (
    <div class="flex h-full flex-col gap-4">
      <div class="relative">
        <div class="pointer-events-none absolute inset-y-0 left-3 flex items-center">
          <Icon name="magnifying-glass" size="small" class="text-text-weak" />
        </div>
        <input
          type="text"
          placeholder="Search agents..."
          value={query()}
          onInput={(e) => setQuery(e.currentTarget.value)}
          class="h-10 w-full rounded-lg border border-border-weak-base bg-background-base pl-9 pr-3 text-14-regular text-text-strong placeholder:text-text-weak focus:border-border-strong-base focus:outline-none"
        />
      </div>

      <div class="flex-1 overflow-y-auto">
        <Show when={primary().length > 0}>
          <div class="mb-4">
            <div class="mb-2 text-12-medium uppercase tracking-[0.12em] text-text-weak">Primary Agents</div>
            <div class="flex flex-col gap-2">
              <For each={primary()}>
                {(agent) => (
                  <AgentCard
                    agent={agent}
                    selected={props.selected === agent.name}
                    onClick={() => handleClick(agent)}
                  />
                )}
              </For>
            </div>
          </div>
        </Show>

        <Show when={subagents().length > 0}>
          <div>
            <div class="mb-2 text-12-medium uppercase tracking-[0.12em] text-text-weak">Subagents</div>
            <div class="flex flex-col gap-2">
              <For each={subagents()}>
                {(agent) => (
                  <AgentCard
                    agent={agent}
                    selected={props.selected === agent.name}
                    onClick={() => handleClick(agent)}
                  />
                )}
              </For>
            </div>
          </div>
        </Show>

        <Show when={filtered().length === 0}>
          <div class="flex flex-col items-center justify-center py-12 text-center">
            <Icon name="magnifying-glass" size="large" class="mb-3 text-text-weaker" />
            <div class="text-14-medium text-text-weak">No agents found</div>
            <div class="mt-1 text-13-regular text-text-weaker">Try adjusting your search</div>
          </div>
        </Show>
      </div>
    </div>
  )
}

interface AgentCardProps {
  agent: Agent
  selected?: boolean
  onClick: () => void
}

function AgentCard(props: AgentCardProps) {
  return (
    <Card
      onClick={props.onClick}
      classList={{
        "cursor-pointer rounded-xl border p-3 transition-colors": true,
        "border-border-strong-base bg-background-stronger": props.selected,
        "border-border-weak-base bg-background-base hover:border-border-base hover:bg-background-strong":
          !props.selected,
      }}
    >
      <div class="flex items-start justify-between gap-2">
        <div class="min-w-0 flex-1">
          <div class="flex items-center gap-2">
            <span class="truncate text-14-semibold text-text-strong">{props.agent.name}</span>
            <Show when={props.agent.native}>
              <Tag size="normal" class="shrink-0 text-11-medium text-accent-base">
                Built-in
              </Tag>
            </Show>
          </div>
          <Show when={props.agent.description}>
            <div class="mt-1 truncate text-13-regular text-text-weak">{props.agent.description}</div>
          </Show>
        </div>
        <Tag
          size="normal"
          classList={{
            "shrink-0 text-11-medium": true,
            "text-accent-base": props.agent.mode === "primary" || props.agent.mode === "all",
            "text-text-weak": props.agent.mode === "subagent",
          }}
        >
          {props.agent.mode}
        </Tag>
      </div>
    </Card>
  )
}
