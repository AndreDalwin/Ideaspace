import { type JSX } from "solid-js"

export default function AgentsPage(): JSX.Element {
  return (
    <div class="flex h-full flex-col p-6">
      <header class="mb-6">
        <h1 class="text-2xl font-semibold">Agents</h1>
        <p class="text-muted-foreground mt-1">Configure and manage your agents</p>
      </header>
      <div class="flex-1 rounded-lg border bg-card p-8">
        <p class="text-muted-foreground">Agents configuration coming soon...</p>
      </div>
    </div>
  )
}
