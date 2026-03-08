# Phase 4 Implementation Guide: File Tree with .gitignore Support

## Integrate File Tree into V3 Sidebar with Context Actions

**Phase:** 4 of 7  
**Estimated Time:** 2 hours  
**Goal:** Add file tree to sidebar respecting .gitignore, with right-click context actions

---

## 🎯 What We're Building

A file tree component in the V3 sidebar that:

- Respects `.gitignore` (ignored files shown dimmed/strikethrough)
- Allows adding files to Global or Session context
- Supports right-click context menu
- Integrates with Phase 3's Context Bank

---

## 📁 Files to Create

### 1. `packages/app/src/components/v3-file-tree.tsx`

**Purpose:** V3-specific file tree wrapper with context integration

```tsx
import { createMemo, For, Show } from "solid-js"
import { useParams } from "@solidjs/router"
import { ScrollView } from "@opencode-ai/ui/scroll-view"
import { useFile } from "@/context/file"
import { useContextBank } from "@/context/context-bank"
import FileTree from "./file-tree"

export function V3FileTree() {
  const params = useParams()
  const file = useFile()
  const context = useContextBank()

  const root = createMemo(() => {
    const dir = params.dir
    if (!dir) return "."
    return atob(dir)
  })

  const handleFileClick = (node: { path: string; type: string }) => {
    if (node.type === "file") {
      context.addToSession(node.path)
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
```

**Key Points:**

- Uses existing `FileTree` component (already supports `.ignored` property)
- Decodes base64 directory from URL params
- Clicking a file adds it to session context
- ScrollView for long file lists

---

### 2. `packages/app/src/components/file-context-menu.tsx`

**Purpose:** Right-click context menu for file tree items

```tsx
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
    context.addToSession(props.filePath)
    props.onClose()
  }

  const handleAddToGlobal = () => {
    context.addToGlobal(props.filePath)
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
```

**Key Points:**

- Fixed position based on click coordinates
- Add to Context/Add to Global actions
- Copy path functionality
- Shows "Ignored" notice for .gitignore'd files

---

### 3. `packages/app/src/components/v3-file-tree-with-menu.tsx`

**Purpose:** File tree with right-click context menu support

```tsx
import { createSignal, Show } from "solid-js"
import { useParams } from "@solidjs/router"
import { ScrollView } from "@opencode-ai/ui/scroll-view"
import { useFile } from "@/context/file"
import { useContextBank } from "@/context/context-bank"
import FileTree from "./file-tree"
import { FileContextMenu } from "./file-context-menu"
import type { FileNode } from "@opencode-ai/sdk/v2"

export function V3FileTreeWithMenu() {
  const params = useParams()
  const file = useFile()
  const context = useContextBank()

  const [menu, setMenu] = createSignal<{
    x: number
    y: number
    node: FileNode
  } | null>(null)

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
      context.addToSession(node.path)
    }
  }

  return (
    <div class="flex flex-col h-full relative">
      <ScrollView class="flex-1 px-2 py-2">
        <FileTree path={root()} draggable onFileClick={handleFileClick} nodeClass="context-menu-trigger" />
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
```

**Key Points:**

- Wraps V3FileTree with context menu state
- Click outside to close menu
- Passes file info to menu component

---

## 📁 Files to Modify

### 4. `packages/app/src/components/v3-sidebar.tsx`

**Replace the File Tree placeholder section:**

```tsx
// Replace this section in v3-sidebar.tsx:
{
  /* File Tree Placeholder */
}
;<div class="px-3 py-2">
  <div class="text-11-medium text-text-weak uppercase tracking-wider mb-2 px-3">Files</div>
  <div class="px-3 py-2 text-13-regular text-text-weak">File tree will appear here</div>
</div>

// With this:
{
  /* File Tree */
}
;<div class="px-3 py-2 flex-1 min-h-0 flex flex-col">
  <div class="text-11-medium text-text-weak uppercase tracking-wider mb-2 px-3">Files</div>
  <div class="flex-1 min-h-0">
    <V3FileTreeWithMenu />
  </div>
</div>
```

**Add import at top:**

```tsx
import { V3FileTreeWithMenu } from "./v3-file-tree-with-menu"
```

---

### 5. `packages/app/src/components/file-tree.tsx` (Minor Enhancement)

**Add onContextMenu prop support to FileTreeNode:**

```tsx
// In FileTreeNode component props, add:
onContextMenu?: (e: MouseEvent) => void

// In Dynamic component props, add:
onContextMenu={local.onContextMenu}
```

**In the file node render section, add context menu handler:**

```tsx
<Match when={node.type === "file"}>
  <FileTreeNode
    node={node}
    level={level}
    active={props.active}
    nodeClass={props.nodeClass}
    draggable={draggable()}
    kinds={kinds()}
    marks={marks()}
    as="button"
    type="button"
    onClick={() => props.onFileClick?.(node)}
    onContextMenu={(e: MouseEvent) => props.onContextMenu?.(e, node)} // Add this
  >
    {/* ... rest of file node content */}
  </FileTreeNode>
</Match>
```

**Add to FileTree props:**

```tsx
export default function FileTree(props: {
  // ... existing props
  onContextMenu?: (e: MouseEvent, node: FileNode) => void // Add this
})
```

---

## 🔗 Integration with Previous Phases

### Phase 1 (Foundation)

- File tree appears in the sidebar below Skills section
- Uses same styling as other sidebar sections
- Scrollable within sidebar bounds

### Phase 2 (Skills)

- File tree doesn't directly interact with skills
- Skills can specify default context files that appear in tree

### Phase 3 (Context Bank)

- **Primary integration point**
- Click file → adds to Session Context
- Right-click → "Add to Global" adds to Global Context
- Context Bank panel immediately reflects changes

---

## ✅ Verification Steps

1. **Type Check:**

   ```bash
   cd packages/app && bun run typecheck
   ```

2. **Visual Test:**
   - Navigate to `/:dir/v3`
   - File tree appears in sidebar
   - Ignored files (from .gitignore) appear dimmed
   - Click file adds to Session Context (visible in right panel)
   - Right-click shows context menu
   - "Add to Global" adds to Global Context

3. **.gitignore Test:**
   - Create/modify `.gitignore` in project root
   - Add patterns like `node_modules/` or `*.log`
   - Refresh file tree
   - Ignored files should have `ignored: true` and appear dimmed

---

## 🎨 Design Notes

| Element         | Style                                |
| --------------- | ------------------------------------ |
| Ignored files   | `text-text-weaker` (dimmed)          |
| Normal files    | `text-text-strong`                   |
| Context menu    | `bg-background-stronger` with shadow |
| Selected/active | `bg-accent-primary/10`               |

---

## 📝 Key Features

1. **.gitignore Respect:** Files marked as `ignored` in FileNode are visually dimmed
2. **Context Integration:** Seamless add to Session/Global context
3. **Right-click Menu:** Standard context menu pattern
4. **Drag Support:** Files are draggable (existing FileTree feature)

---

## 🚀 Next Phase

After Phase 4 is complete, move to **Phase 5: Workspace Integration** where we'll:

- Wire up blank workspace actions to actual functionality
- Integrate skills with session creation
- Add context visualization to workspace

**Phase 4 brings the file tree to life with context integration!**
