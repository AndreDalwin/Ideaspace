import { createSignal, Show } from "solid-js"
import { useParams } from "@solidjs/router"
import { ScrollView } from "@opencode-ai/ui/scroll-view"
import { useContextBank } from "@/context/context-bank"
import FileTree from "./file-tree"
import { FileContextMenu } from "./file-context-menu"
import type { FileNode } from "@opencode-ai/sdk/v2"

export function V3FileTreeWithMenu() {
  const params = useParams()
  const context = useContextBank()
  const [menu, setMenu] = createSignal<{ x: number; y: number; node: FileNode } | null>(null)
  const root = () => {
    const dir = params.dir
    if (!dir) return "."
    return atob(dir)
  }
  const handleContextMenu = (e: MouseEvent, node: FileNode) => {
    e.preventDefault()
    setMenu({ x: e.clientX, y: e.clientY, node })
  }
  const handleFileClick = (node: FileNode) => {
    if (node.type === "file" && !node.ignored) {
      const sessionId = params.id
      if (sessionId) {
        context.actions.addToSession(sessionId, node.path)
      }
    }
  }
  return (
    <div class="flex flex-col h-full relative">
      <ScrollView class="flex-1 px-2 py-2">
        <FileTree path={root()} draggable onFileClick={handleFileClick} onContextMenu={handleContextMenu} />
      </ScrollView>
      <Show when={menu()}>
        {(m) => (
          <>
            <div class="fixed inset-0 z-40" onClick={() => setMenu(null)} />
            <FileContextMenu
              filePath={m().node.path}
              fileName={m().node.name}
              isIgnored={m().node.ignored}
              x={m().x}
              y={m().y}
              onClose={() => setMenu(null)}
            />
          </>
        )}
      </Show>
    </div>
  )
}
