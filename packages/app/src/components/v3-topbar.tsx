import { useNavigate } from "@solidjs/router"
import { IconButton } from "@opencode-ai/ui/icon-button"
import { TokenCounter } from "./token-counter"

interface V3TopbarProps {
  projectName: string
}

export function V3Topbar(props: V3TopbarProps) {
  const navigate = useNavigate()
  return (
    <header class="h-14 border-b border-border-weak-base bg-background-stronger flex items-center px-4 gap-4">
      <div class="flex items-center gap-2">
        <div class="w-8 h-8 rounded-lg bg-accent-primary flex items-center justify-center text-black font-bold text-16">
          🧠
        </div>
        <span class="text-14-semibold text-text-strong hidden sm:block">Ideaspace</span>
      </div>
      <div class="flex-1 px-4 min-w-0">
        <div class="text-11-medium text-text-weak uppercase tracking-wider">Project</div>
        <div class="text-14-semibold text-text-strong truncate">{props.projectName}</div>
      </div>
      <div class="hidden md:flex items-center">
        <input
          type="text"
          placeholder="Search..."
          class="w-64 h-9 px-3 rounded-lg bg-background-base border border-border-weak-base text-13-regular placeholder:text-text-weaker focus:outline-none focus:border-accent-primary transition-colors"
        />
      </div>
      <IconButton
        icon="settings-gear"
        variant="ghost"
        size="small"
        onClick={() => navigate("/settings")}
        title="Settings"
      />
      <TokenCounter />
    </header>
  )
}
