import { For } from "solid-js"

type WorkMode = "plan" | "build" | "review"

interface ModeSwitcherProps {
  mode: WorkMode
  onModeChange: (mode: WorkMode) => void
}

const modes: { id: WorkMode; label: string; description: string }[] = [
  {
    id: "plan",
    label: "Plan",
    description: "Outline, structure, and design",
  },
  {
    id: "build",
    label: "Build",
    description: "Implement and execute",
  },
  {
    id: "review",
    label: "Review",
    description: "Analyze and improve",
  },
]

export function ModeSwitcher(props: ModeSwitcherProps) {
  return (
    <div class="flex items-center gap-1 p-1 rounded-xl bg-background-stronger border border-border-weak-base">
      <For each={modes}>
        {(mode) => (
          <button
            class={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-12-medium transition-all ${
              props.mode === mode.id
                ? "bg-accent-primary text-black shadow-sm"
                : "text-text-weak hover:text-text-strong hover:bg-background-base"
            }`}
            onClick={() => props.onModeChange(mode.id)}
            title={mode.description}
          >
            <span class={props.mode === mode.id ? "text-black" : ""}>{mode.label}</span>
          </button>
        )}
      </For>
    </div>
  )
}

export type { WorkMode }
