import { createSignal, Show } from "solid-js"
import { useContextBank } from "@/context/context-bank"

interface FileContextMenuProps {
  filePath: string
  fileName: string
  isIgnored: boolean
  x: number
  y: number
  onClose: () => void
}

export function FileContextMenu(props: FileContextMenuProps) {
  const context = useContextBank()
  const [copied, setCopied] = createSignal(false)
  const handleAddToContext = () => {
    context.actions.addToGlobal(props.filePath)
    props.onClose()
  }
  const handleAddToGlobal = () => {
    context.actions.addToGlobal(props.filePath)
    props.onClose()
  }
  const handleCopyPath = () => {
    navigator.clipboard.writeText(props.filePath)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }
  return (
    <div
      class="fixed z-50 min-w-[180px] rounded-lg border border-border-weak-base bg-background-stronger shadow-lg py-1"
      style={{ left: `${props.x}px`, top: `${props.y}px` }}
    >
      <Show when={!props.isIgnored}>
        <button
          class="w-full px-3 py-2 text-left text-13-regular text-text-strong hover:bg-accent-primary/10 transition-colors flex items-center gap-2"
          onClick={handleAddToContext}
        >
          <span>📌</span>
          Add to Context
        </button>
        <button
          class="w-full px-3 py-2 text-left text-13-regular text-text-strong hover:bg-accent-primary/10 transition-colors flex items-center gap-2"
          onClick={handleAddToGlobal}
        >
          <span>🌍</span>
          Add to Global
        </button>
        <div class="h-px bg-border-weak-base my-1" />
      </Show>
      <button
        class="w-full px-3 py-2 text-left text-13-regular text-text-strong hover:bg-accent-primary/10 transition-colors flex items-center gap-2"
        onClick={handleCopyPath}
      >
        <span>{copied() ? "✓" : "📋"}</span>
        {copied() ? "Copied!" : "Copy Path"}
      </button>
      <Show when={props.isIgnored}>
        <div class="px-3 py-2 text-11-regular text-text-weaker">Ignored by .gitignore</div>
      </Show>
    </div>
  )
}
