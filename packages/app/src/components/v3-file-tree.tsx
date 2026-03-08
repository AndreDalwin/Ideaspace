import { createMemo } from "solid-js"
import { useParams } from "@solidjs/router"
import { ScrollView } from "@opencode-ai/ui/scroll-view"
import { useContextBank } from "@/context/context-bank"
import FileTree from "./file-tree"

export function V3FileTree() {
  const params = useParams()
  const context = useContextBank()
  const root = createMemo(() => {
    const dir = params.dir
    if (!dir) return "."
    return atob(dir)
  })
  const handleFileClick = (node: { path: string; type: string }) => {
    if (node.type === "file") {
      const sessionId = params.id
      if (sessionId) {
        context.actions.addToSession(sessionId, node.path)
      }
    }
  }
  return (
    <div class="flex flex-col h-full">
      <ScrollView class="flex-1 px-2 py-2">
        <FileTree path={root()} draggable onFileClick={handleFileClick} />
      </ScrollView>
    </div>
  )
}
