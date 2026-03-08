import { Dialog } from "@opencode-ai/ui/dialog"
import type { JSX } from "solid-js"
import { AgentDetail } from "./detail"

export default function AgentsPage(): JSX.Element {
  return (
    <Dialog title="Agents" size="x-large" transition class="overflow-hidden">
      <div class="h-[80vh] w-[min(1200px,90vw)] max-w-full overflow-hidden">
        <AgentDetail />
      </div>
    </Dialog>
  )
}
