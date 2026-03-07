import { Dialog as Kobalte } from "@kobalte/core/dialog"
import { useNavigate } from "@solidjs/router"
import { Dialog } from "@opencode-ai/ui/dialog"
import type { JSX } from "solid-js"
import { AgentDetail } from "./detail"

export default function AgentsPage(): JSX.Element {
  const navigate = useNavigate()
  const close = () => {
    if (window.history.length > 1) {
      window.history.back()
      return
    }
    navigate("/")
  }

  return (
    <Kobalte modal open onOpenChange={(open) => !open && close()}>
      <Kobalte.Portal>
        <Kobalte.Overlay data-component="dialog-overlay" onClick={close} />
        <Dialog title="Agents" size="x-large" transition class="overflow-hidden">
          <div class="h-[80vh] w-[min(1200px,90vw)] max-w-full overflow-hidden">
            <AgentDetail />
          </div>
        </Dialog>
      </Kobalte.Portal>
    </Kobalte>
  )
}
