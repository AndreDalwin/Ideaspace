# Phase 5 Implementation Guide: Workspace Integration

## Blank State Welcome, Skill Sessions, and Context Visualization

**Phase:** 5 of 7  
**Estimated Time:** 3 hours  
**Goal:** Wire up blank workspace to actual functionality, integrate skills with sessions

---

## 🎯 What We're Building

Enhanced workspace that:

- Blank state with working action buttons
- Skill-based session creation with auto-loaded context
- Visual context indicator showing attached files
- Smooth transitions between states

---

## 📁 Files to Create

### 1. `packages/app/src/components/workspace-context-indicator.tsx`

**Purpose:** Shows current context status in workspace

```tsx
import { Show, For } from "solid-js"
import { useContextBank } from "@/context/context-bank"
import { useSkills } from "@/context/skills"

interface WorkspaceContextIndicatorProps {
  activeSkillId?: string
}

export function WorkspaceContextIndicator(props: WorkspaceContextIndicatorProps) {
  const context = useContextBank()
  const skills = useSkills()

  const activeSkill = () => {
    if (!props.activeSkillId) return null
    return skills.getSkill(props.activeSkillId)
  }

  const totalFiles = () => context.globalContext.files.length + context.sessionContext.files.length

  return (
    <div class="rounded-2xl border border-border-weak-base bg-background-stronger p-4">
      <Show when={activeSkill()}>
        {(skill) => (
          <div class="flex items-center gap-3 mb-3 pb-3 border-b border-border-weak-base">
            <span class="text-24">{skill().icon}</span>
            <div>
              <div class="text-13-medium text-accent-primary">Using Skill</div>
              <div class="text-15-semibold text-text-strong">{skill().name}</div>
            </div>
          </div>
        )}
      </Show>

      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <span class="text-16">📎</span>
          <span class="text-13-medium text-text-strong">
            {totalFiles()} file{totalFiles() === 1 ? "" : "s"} attached
          </span>
        </div>
        <button class="text-13-regular text-accent-primary hover:underline">Manage Context</button>
      </div>

      <Show when={totalFiles() > 0}>
        <div class="mt-2 space-y-1">
          <For each={context.globalContext.files}>
            {(file) => (
              <div class="flex items-center gap-2 text-12-regular text-text-weak">
                <span>🌍</span>
                <span class="truncate">{file}</span>
              </div>
            )}
          </For>
          <For each={context.sessionContext.files}>
            {(file) => (
              <div class="flex items-center gap-2 text-12-regular text-text-weak">
                <span>📌</span>
                <span class="truncate">{file}</span>
              </div>
            )}
          </For>
        </div>
      </Show>
    </div>
  )
}
```

**Key Points:**

- Shows active skill if one is selected
- Displays total attached files count
- Lists global (🌍) and session (📌) files separately
- "Manage Context" button for quick access

---

### 2. `packages/app/src/components/skill-picker-dialog.tsx`

**Purpose:** Dialog for picking a skill to start with

```tsx
import { For } from "solid-js"
import { useNavigate, useParams } from "@solidjs/router"
import { useSkills } from "@/context/skills"
import { useContextBank } from "@/context/context-bank"
import { Button } from "@opencode-ai/ui/button"
import { ScrollView } from "@opencode-ai/ui/scroll-view"

interface SkillPickerDialogProps {
  isOpen: boolean
  onClose: () => void
}

export function SkillPickerDialog(props: SkillPickerDialogProps) {
  const navigate = useNavigate()
  const params = useParams()
  const skills = useSkills()
  const context = useContextBank()

  const handleSelectSkill = (skillId: string) => {
    const skill = skills.getSkill(skillId)
    if (!skill) return

    // Add skill's default context to session
    skill.defaultContext.forEach((file) => {
      context.addToSession(file)
    })

    // Navigate to session with skill
    navigate(`/${params.dir || "."}/session?skill=${skillId}`)
    props.onClose()
  }

  if (!props.isOpen) return null

  return (
    <div class="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div class="absolute inset-0 bg-black/50" onClick={props.onClose} />

      {/* Dialog */}
      <div class="relative w-full max-w-lg rounded-2xl border border-border-weak-base bg-background-base shadow-2xl">
        <div class="p-6 border-b border-border-weak-base">
          <h2 class="text-20-semibold text-text-strong">Pick a Skill</h2>
          <p class="text-14-regular text-text-weak mt-1">Choose a pre-configured skill to get started</p>
        </div>

        <ScrollView class="max-h-[400px] p-4">
          <div class="space-y-2">
            <For each={skills.skills}>
              {(skill) => (
                <button
                  class="w-full p-4 rounded-xl border border-border-weak-base bg-background-stronger hover:border-accent-primary hover:bg-accent-primary/5 transition-all text-left"
                  onClick={() => handleSelectSkill(skill.id)}
                >
                  <div class="flex items-center gap-3">
                    <span class="text-24">{skill.icon}</span>
                    <div>
                      <div class="text-15-semibold text-text-strong">{skill.name}</div>
                      <div class="text-13-regular text-text-weak">{skill.description}</div>
                      {skill.defaultContext.length > 0 && (
                        <div class="text-11-regular text-accent-primary mt-1">
                          Includes {skill.defaultContext.length} file
                          {skill.defaultContext.length === 1 ? "" : "s"}
                        </div>
                      )}
                    </div>
                  </div>
                </button>
              )}
            </For>
          </div>
        </ScrollView>

        <div class="p-4 border-t border-border-weak-base flex justify-end">
          <Button variant="secondary" onClick={props.onClose}>
            Cancel
          </Button>
        </div>
      </div>
    </div>
  )
}
```

**Key Points:**

- Modal dialog for skill selection
- Shows skill icon, name, description
- Indicates default context files count
- On select: adds default context, navigates to session

---

### 3. `packages/app/src/components/file-picker-dialog.tsx`

**Purpose:** Dialog for picking files to add to context

```tsx
import { createSignal, createMemo, For, Show } from "solid-js"
import { useParams } from "@solidjs/router"
import { useFile } from "@/context/file"
import { useContextBank } from "@/context/context-bank"
import { Button } from "@opencode-ai/ui/button"
import { ScrollView } from "@opencode-ai/ui/scroll-view"
import FileTree from "./file-tree"
import type { FileNode } from "@opencode-ai/sdk/v2"

interface FilePickerDialogProps {
  isOpen: boolean
  onClose: () => void
  mode: "session" | "global"
}

export function FilePickerDialog(props: FilePickerDialogProps) {
  const params = useParams()
  const file = useFile()
  const context = useContextBank()

  const [selected, setSelected] = createSignal<Set<string>>(new Set())

  const root = createMemo(() => {
    const dir = params.dir
    if (!dir) return "."
    return atob(dir)
  })

  const handleFileClick = (node: FileNode) => {
    if (node.type !== "file" || node.ignored) return

    const next = new Set(selected())
    if (next.has(node.path)) {
      next.delete(node.path)
    } else {
      next.add(node.path)
    }
    setSelected(next)
  }

  const handleAdd = () => {
    const files = [...selected()]
    files.forEach((path) => {
      if (props.mode === "global") {
        context.addToGlobal(path)
      } else {
        context.addToSession(path)
      }
    })
    setSelected(new Set())
    props.onClose()
  }

  const title = () => (props.mode === "global" ? "Add to Global Context" : "Add to Session Context")

  if (!props.isOpen) return null

  return (
    <div class="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div class="absolute inset-0 bg-black/50" onClick={props.onClose} />

      <div class="relative w-full max-w-md rounded-2xl border border-border-weak-base bg-background-base shadow-2xl flex flex-col max-h-[600px]">
        <div class="p-6 border-b border-border-weak-base">
          <h2 class="text-20-semibold text-text-strong">{title()}</h2>
          <p class="text-14-regular text-text-weak mt-1">Select files to include in context</p>
        </div>

        <div class="flex-1 min-h-0 p-4">
          <ScrollView class="h-full border border-border-weak-base rounded-xl">
            <FileTree
              path={root()}
              onFileClick={handleFileClick}
              nodeClass={(node) => (selected().has(node.path) ? "bg-accent-primary/10" : "")}
            />
          </ScrollView>
        </div>

        <Show when={selected().size > 0}>
          <div class="px-4 py-2 border-t border-border-weak-base bg-background-stronger">
            <div class="text-13-medium text-text-strong">
              {selected().size} file{selected().size === 1 ? "" : "s"} selected
            </div>
          </div>
        </Show>

        <div class="p-4 border-t border-border-weak-base flex justify-end gap-2">
          <Button variant="secondary" onClick={props.onClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleAdd} disabled={selected().size === 0}>
            Add {selected().size > 0 ? `(${selected().size})` : ""}
          </Button>
        </div>
      </div>
    </div>
  )
}
```

**Key Points:**

- File tree with multi-select
- Highlight selected files
- Shows selection count
- Mode: "session" or "global" context

---

## 📁 Files to Modify

### 4. `packages/app/src/components/v3-blank-workspace.tsx`

**Update to add working actions:**

```tsx
import { createSignal } from "solid-js"
import { useNavigate, useParams } from "@solidjs/router"
import { SkillPickerDialog } from "./skill-picker-dialog"
import { FilePickerDialog } from "./file-picker-dialog"

export function V3BlankWorkspace() {
  const navigate = useNavigate()
  const params = useParams()
  const [showSkillPicker, setShowSkillPicker] = createSignal(false)
  const [showFilePicker, setShowFilePicker] = createSignal(false)
  const [filePickerMode, setFilePickerMode] = createSignal<"session" | "global">("session")

  const handleAddFiles = () => {
    setFilePickerMode("session")
    setShowFilePicker(true)
  }

  return (
    <>
      <div class="h-full flex items-center justify-center p-8">
        {/* ... existing welcome content ... */}

        <div class="grid gap-4 max-w-md mx-auto">
          {/* Pick Skill - Updated */}
          <button
            onClick={() => setShowSkillPicker(true)}
            class="p-4 rounded-2xl border border-border-weak-base bg-background-stronger hover:border-accent-primary hover:bg-accent-primary/5 transition-all text-left group"
          >
            {/* ... same content ... */}
          </button>

          {/* Add Files - Updated */}
          <button
            onClick={handleAddFiles}
            class="p-4 rounded-2xl border border-border-weak-base bg-background-stronger hover:border-accent-primary hover:bg-accent-primary/5 transition-all text-left group"
          >
            {/* ... same content ... */}
          </button>

          {/* Start Blank - Works as is */}
          <button
            onClick={() => navigate(`/${params.dir || "."}/session`)}
            class="p-4 rounded-2xl border border-border-weak-base bg-background-stronger hover:border-accent-primary hover:bg-accent-primary/5 transition-all text-left group"
          >
            {/* ... same content ... */}
          </button>
        </div>
      </div>

      <SkillPickerDialog isOpen={showSkillPicker()} onClose={() => setShowSkillPicker(false)} />

      <FilePickerDialog isOpen={showFilePicker()} onClose={() => setShowFilePicker(false)} mode={filePickerMode()} />
    </>
  )
}
```

---

### 5. `packages/app/src/pages/session.tsx` (Skill Integration)

**Add skill loading on session start:**

```tsx
import { useSearchParams } from "@solidjs/router"
import { useSkills } from "@/context/skills"
import { useContextBank } from "@/context/context-bank"

// In Session component:
const [searchParams] = useSearchParams<{ skill?: string }>()
const skills = useSkills()
const context = useContextBank()

// Load skill when session starts
const [activeSkill, setActiveSkill] = createSignal<Skill | null>(null)

createEffect(() => {
  const skillId = searchParams.skill
  if (!skillId) {
    setActiveSkill(null)
    return
  }

  const skill = skills.getSkill(skillId)
  if (!skill) return

  setActiveSkill(skill)

  // Add default context files
  skill.defaultContext.forEach((file) => {
    context.addToSession(file)
  })

  // Prepend skill instructions to system prompt
  // (Integrate with your session system)
})
```

---

## 🔗 Integration with Previous Phases

### Phase 1 (Foundation)

- Blank workspace now has working buttons
- Layout remains the same
- Navigation works through SolidJS router

### Phase 2 (Skills)

- Skill picker loads skills from SkillsContext
- Selecting a skill adds its defaultContext
- Skill instructions loaded into session

### Phase 3 (Context Bank)

- File picker adds to session/global context
- Context indicator shows current state
- Context Bank panel reflects changes immediately

### Phase 4 (File Tree)

- File picker reuses FileTree component
- Respects .gitignore (ignored files not selectable)
- Same visual styling

---

## ✅ Verification Steps

1. **Type Check:**

   ```bash
   cd packages/app && bun run typecheck
   ```

2. **Skill Flow:**
   - Click "Pick a Skill" → Dialog opens
   - Select skill → Adds default context, navigates to session
   - Session shows skill indicator

3. **File Flow:**
   - Click "Add Files to Context" → File picker opens
   - Select files → Click Add → Files appear in Context Bank
   - Files show in both workspace indicator and right panel

4. **Blank Session:**
   - Click "Start Blank Session" → Goes to session
   - No skill loaded, empty context

---

## 🎨 Design Notes

| State          | Visual                        |
| -------------- | ----------------------------- |
| Skill active   | Shows skill card in workspace |
| Files attached | Shows count + file list       |
| Empty state    | Shows "0 files attached"      |
| Dialog open    | Backdrop + centered card      |

---

## 📝 Key Features

1. **Working Buttons:** All three blank workspace options functional
2. **Skill Integration:** Auto-loads skill context and instructions
3. **File Picker:** Multi-select with visual feedback
4. **Context Indicator:** Always-visible context summary

---

## 🚀 Next Phase

After Phase 5 is complete, move to **Phase 6: Tasks Tab** where we'll:

- Integrate existing Kanban component
- Link tasks to sessions
- Show task context in workspace

**Phase 5 brings the workspace to life with skill-driven sessions!**
