import { createMemo, type JSX } from "solid-js"
import { Select } from "@opencode-ai/ui/select"
import { useAgents } from "@/context/agents"
import { useGlobalSync } from "@/context/global-sync"

export default function AgentsPage(): JSX.Element {
  const agents = useAgents()
  const globalSync = useGlobalSync()

  const primaryAgents = createMemo(() => agents.primary)

  const defaultAgent = createMemo(() => {
    const name = globalSync.data.config.default_agent
    if (!name) return undefined
    return agents.get(name)
  })

  const handleSelectDefault = async (agent: { name: string } | undefined) => {
    const next: typeof globalSync.data.config = {
      ...globalSync.data.config,
      default_agent: agent?.name,
    }
    await globalSync.updateConfig(next)
  }

  return (
    <div class="flex h-full flex-col p-6">
      <header class="mb-6 flex items-start justify-between">
        <div>
          <h1 class="text-2xl font-semibold">Agents</h1>
          <p class="text-muted-foreground mt-1">Configure and manage your agents</p>
        </div>
        <div class="flex items-center gap-3">
          <span class="text-13-regular text-text-weak">Default agent</span>
          <Select
            options={primaryAgents()}
            current={defaultAgent()}
            value={(a) => a.name}
            label={(a) => a.name}
            placeholder="Select default agent"
            onSelect={handleSelectDefault}
            variant="outline"
            size="small"
          />
        </div>
      </header>
      <div class="flex-1 rounded-lg border bg-card p-8">
        <p class="text-muted-foreground">Agents configuration coming soon...</p>
      </div>
    </div>
  )
}
