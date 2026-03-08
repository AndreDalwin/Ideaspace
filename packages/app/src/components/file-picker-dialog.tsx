import { Button } from "@opencode-ai/ui/button"
import { useDialog } from "@opencode-ai/ui/context/dialog"
import { Dialog } from "@opencode-ai/ui/dialog"
import { Icon } from "@opencode-ai/ui/icon"
import { FileIcon } from "@opencode-ai/ui/file-icon"
import { useParams } from "@solidjs/router"
import { For, Show, createMemo, onMount } from "solid-js"
import { createStore } from "solid-js/store"
import { useFile } from "@/context/file"
import { useContextBank } from "@/context/context-bank"
import type { FileNode } from "@opencode-ai/sdk/v2"

interface FilePickerDialogProps {
  onClose: () => void
  mode: "session" | "global"
}

export function FilePickerDialog(props: FilePickerDialogProps) {
  const file = useFile()
  const ctx = useContextBank()
  const params = useParams()
  const dialog = useDialog()
  const [selectedPaths, setSelectedPaths] = createStore<Set<string>>(new Set())
  const [expandedDirs, setExpandedDirs] = createStore<Set<string>>(new Set())

  onMount(() => {
    void file.tree.list("")
  })

  const rootNodes = createMemo(() => file.tree.children(""))

  const selectionCount = createMemo(() => selectedPaths.size)

  const isSelected = (path: string) => selectedPaths.has(path)

  const isExpanded = (path: string) => expandedDirs.has(path)

  const toggleSelection = (path: string) => {
    setSelectedPaths((prev) => {
      const next = new Set(prev)
      if (next.has(path)) {
        next.delete(path)
      } else {
        next.add(path)
      }
      return next
    })
  }

  const toggleExpanded = (path: string) => {
    setExpandedDirs((prev) => {
      const next = new Set(prev)
      if (next.has(path)) {
        next.delete(path)
      } else {
        next.add(path)
      }
      return next
    })
    void file.tree.list(path)
  }

  const handleConfirm = () => {
    const paths = [...selectedPaths]
    if (paths.length === 0) return

    if (props.mode === "global") {
      paths.forEach((p) => ctx.actions.addToGlobal(p))
    } else {
      const sessionId = params.id || "new"
      paths.forEach((p) => ctx.actions.addToSession(sessionId, p))
    }

    dialog.close()
    props.onClose()
  }

  const handleCancel = () => {
    dialog.close()
    props.onClose()
  }

  return (
    <Dialog
      title={props.mode === "session" ? "Add Files to Session" : "Add Files to Global Context"}
      class="w-full max-w-[560px] mx-auto"
    >
      <div class="flex flex-col gap-4 p-6 pt-0">
        <p class="text-14-regular text-text-weak">
          Select files to add to {props.mode === "session" ? "this session" : "global context"}.
        </p>

        <div class="border border-border-weak-base rounded-lg overflow-hidden">
          <div class="max-h-[320px] overflow-auto p-2">
            <For each={rootNodes()}>
              {(node) => (
                <FileNodeRow
                  node={node}
                  level={0}
                  isSelected={isSelected}
                  isExpanded={isExpanded}
                  onToggleSelect={toggleSelection}
                  onToggleExpand={toggleExpanded}
                />
              )}
            </For>
          </div>
        </div>

        <div class="flex items-center justify-between">
          <span class="text-13-regular text-text-weak">
            {selectionCount()} file{selectionCount() === 1 ? "" : "s"} selected
          </span>

          <div class="flex gap-2">
            <Button type="button" variant="ghost" size="large" onClick={handleCancel}>
              Cancel
            </Button>
            <Button
              type="button"
              variant="primary"
              size="large"
              disabled={selectionCount() === 0}
              onClick={handleConfirm}
            >
              Add Files
            </Button>
          </div>
        </div>
      </div>
    </Dialog>
  )
}

function FileNodeRow(props: {
  node: FileNode
  level: number
  isSelected: (path: string) => boolean
  isExpanded: (path: string) => boolean
  onToggleSelect: (path: string) => void
  onToggleExpand: (path: string) => void
}) {
  const file = useFile()
  const indent = () => props.level * 16

  const selected = () => props.isSelected(props.node.path)
  const expanded = () => props.isExpanded(props.node.path)
  const children = createMemo(() => file.tree.children(props.node.path))
  const hasChildren = () => props.node.type === "directory" && children().length > 0

  return (
    <>
      <div
        classList={{
          "flex items-center gap-2 p-2 rounded-md cursor-pointer transition-colors": true,
          "bg-accent-base/10": selected(),
          "hover:bg-background-stronger": !selected(),
        }}
        style={{ "padding-left": `${12 + indent()}px` }}
      >
        <Show when={props.node.type === "directory"}>
          <button
            onClick={() => props.onToggleExpand(props.node.path)}
            class="size-5 flex items-center justify-center rounded hover:bg-background-stronger"
          >
            <Icon name={expanded() ? "chevron-down" : "chevron-right"} class="size-4 text-text-weak" />
          </button>
        </Show>
        <Show when={props.node.type === "file"}>
          <div class="size-5" />
        </Show>

        <button
          onClick={() => props.node.type === "file" && props.onToggleSelect(props.node.path)}
          class="flex items-center gap-2 flex-1 min-w-0"
          disabled={props.node.type === "directory"}
        >
          <div
            classList={{
              "size-4 rounded border flex items-center justify-center transition-colors": true,
              "bg-accent-base border-accent-base": selected(),
              "border-border-weak-base": !selected(),
            }}
          >
            <Show when={selected()}>
              <Icon name="check" class="size-3 text-white" />
            </Show>
          </div>

          <FileIcon node={props.node} class="size-4 shrink-0" />

          <span class="text-13-regular text-text-strong truncate">{props.node.name}</span>
        </button>
      </div>

      <Show when={props.node.type === "directory" && expanded()}>
        <For each={children()}>
          {(child) => (
            <FileNodeRow
              node={child}
              level={props.level + 1}
              isSelected={props.isSelected}
              isExpanded={props.isExpanded}
              onToggleSelect={props.onToggleSelect}
              onToggleExpand={props.onToggleExpand}
            />
          )}
        </For>
      </Show>
    </>
  )
}
