# Phase 3 Implementation Guide: Context Management

## Global + Selected Context System

**Phase:** 3 of 7  
**Estimated Time:** 3 hours  
**Goal:** Build intentional context management with user-selected global and per-session context

---

## 🎯 Core Principles

1. **User picks what to include** - NOT auto-include everything
2. **Token-conscious** - Always visible token count
3. **Global Context** - User-selected files always included
4. **Selected Context** - Per-session file picking
5. **Context Sets** - Save and reuse file groups

---

## 📁 Files to Create

### 1. `packages/app/src/types/context.ts`

```typescript
export interface ContextFile {
  path: string
  name: string
  type: "file" | "folder"
  tokenCount?: number
}

export interface ContextSet {
  id: string
  name: string
  description: string
  files: string[] // File paths
  icon?: string
  createdAt: number
}

export interface GlobalContext {
  files: string[] // Always included files
}

export interface SessionContext {
  sessionId: string
  files: string[] // Files for this session only
  sets: string[] // Context set IDs added
}
```

---

### 2. `packages/app/src/context/context-bank.tsx`

```tsx
import { createContext, useContext, ParentProps, createSignal, createMemo } from "solid-js"
import { createStore } from "solid-js/store"
import type { ContextSet, GlobalContext, SessionContext, ContextFile } from "@/types/context"

interface ContextBankValue {
  // Global context
  globalContext: GlobalContext
  addToGlobal: (filePath: string) => void
  removeFromGlobal: (filePath: string) => void

  // Session context
  sessionContext: SessionContext
  addToSession: (filePath: string) => void
  removeFromSession: (filePath: string) => void
  clearSession: () => void

  // Context sets
  contextSets: ContextSet[]
  createSet: (name: string, description: string, files: string[]) => ContextSet
  applySet: (setId: string) => void
  deleteSet: (setId: string) => void

  // Calculated
  totalTokens: () => number
  allContextFiles: () => string[] // global + session
}

const ContextBankContext = createContext<ContextBankValue>()

export function ContextBankProvider(props: ParentProps) {
  const [globalContext, setGlobalContext] = createStore<GlobalContext>({
    files: [], // Start empty - user adds what they want
  })

  const [sessionContext, setSessionContext] = createStore<SessionContext>({
    sessionId: "",
    files: [],
    sets: [],
  })

  const [contextSets, setContextSets] = createStore<ContextSet[]>([
    // Example sets
    {
      id: "set_1",
      name: "Blog Writing Kit",
      description: "Everything needed for blog posts",
      files: [".ideaspace/style-guide.md", ".ideaspace/brand-voice.md"],
      icon: "✍️",
      createdAt: Date.now(),
    },
    {
      id: "set_2",
      name: "API Development",
      description: "API layer files",
      files: ["src/api.ts", "src/types.ts", "docs/api.md"],
      icon: "👨‍💻",
      createdAt: Date.now(),
    },
  ])

  // Global context actions
  const addToGlobal = (filePath: string) => {
    if (!globalContext.files.includes(filePath)) {
      setGlobalContext("files", (prev) => [...prev, filePath])
    }
  }

  const removeFromGlobal = (filePath: string) => {
    setGlobalContext("files", (prev) => prev.filter((f) => f !== filePath))
  }

  // Session context actions
  const addToSession = (filePath: string) => {
    if (!sessionContext.files.includes(filePath)) {
      setSessionContext("files", (prev) => [...prev, filePath])
    }
  }

  const removeFromSession = (filePath: string) => {
    setSessionContext("files", (prev) => prev.filter((f) => f !== filePath))
  }

  const clearSession = () => {
    setSessionContext({ sessionId: "", files: [], sets: [] })
  }

  // Context sets
  const createSet = (name: string, description: string, files: string[]): ContextSet => {
    const set: ContextSet = {
      id: `set_${Date.now()}`,
      name,
      description,
      files,
      createdAt: Date.now(),
    }
    setContextSets((prev) => [...prev, set])
    return set
  }

  const applySet = (setId: string) => {
    const set = contextSets.find((s) => s.id === setId)
    if (set) {
      set.files.forEach((file) => addToSession(file))
      setSessionContext("sets", (prev) => [...prev, setId])
    }
  }

  const deleteSet = (setId: string) => {
    setContextSets((prev) => prev.filter((s) => s.id !== setId))
  }

  // Token calculation (placeholder)
  const totalTokens = createMemo(() => {
    // In real implementation, calculate from file contents
    return (globalContext.files.length + sessionContext.files.length) * 500
  })

  const allContextFiles = createMemo(() => {
    return [...globalContext.files, ...sessionContext.files]
  })

  return (
    <ContextBankContext.Provider
      value={{
        globalContext,
        addToGlobal,
        removeFromGlobal,
        sessionContext,
        addToSession,
        removeFromSession,
        clearSession,
        contextSets,
        createSet,
        applySet,
        deleteSet,
        totalTokens,
        allContextFiles,
      }}
    >
      {props.children}
    </ContextBankContext.Provider>
  )
}

export function useContextBank() {
  const context = useContext(ContextBankContext)
  if (!context) throw new Error("useContextBank must be used within ContextBankProvider")
  return context
}
```

---

### 3. `packages/app/src/components/context-bank-panel.tsx`

```tsx
import { For, Show } from "solid-js"
import { IconButton } from "@opencode-ai/ui/icon-button"
import { ScrollView } from "@opencode-ai/ui/scroll-view"
import { useContextBank } from "@/context/context-bank"

export function ContextBankPanel() {
  const {
    globalContext,
    removeFromGlobal,
    sessionContext,
    removeFromSession,
    contextSets,
    applySet,
    deleteSet,
    totalTokens,
  } = useContextBank()

  return (
    <aside class="w-72 border-l border-border-weak-base bg-background-stronger flex flex-col">
      <div class="h-14 border-b border-border-weak-base flex items-center px-4">
        <h2 class="text-14-semibold text-text-strong">Context Bank</h2>
      </div>

      <ScrollView class="flex-1">
        {/* Global Context */}
        <div class="p-4 border-b border-border-weak-base">
          <div class="flex items-center justify-between mb-3">
            <div class="flex items-center gap-2">
              <span class="text-16">🌍</span>
              <span class="text-12-semibold text-text-strong uppercase tracking-wider">Global Context</span>
            </div>
            <span class="text-11-regular text-text-weaker">Always on</span>
          </div>

          <Show
            when={globalContext.files.length > 0}
            fallback={<div class="text-13-regular text-text-weak py-2">No global files set</div>}
          >
            <For each={globalContext.files}>
              {(file) => (
                <div class="flex items-center justify-between py-1">
                  <span class="text-13-regular text-text-strong truncate">{file}</span>
                  <IconButton icon="x" variant="ghost" size="small" onClick={() => removeFromGlobal(file)} />
                </div>
              )}
            </For>
          </Show>

          <button class="text-13-regular text-accent-primary mt-2">+ Add Global File</button>
        </div>

        {/* Session Context */}
        <div class="p-4 border-b border-border-weak-base">
          <div class="flex items-center justify-between mb-3">
            <div class="flex items-center gap-2">
              <span class="text-16">📌</span>
              <span class="text-12-semibold text-text-strong uppercase tracking-wider">Session Context</span>
            </div>
            <span class="text-11-medium text-accent-primary">{totalTokens()} tokens</span>
          </div>

          <Show
            when={sessionContext.files.length > 0}
            fallback={<div class="text-13-regular text-text-weak py-2">No files in session</div>}
          >
            <For each={sessionContext.files}>
              {(file) => (
                <div class="flex items-center justify-between py-1">
                  <span class="text-13-regular text-text-strong truncate">{file}</span>
                  <IconButton icon="x" variant="ghost" size="small" onClick={() => removeFromSession(file)} />
                </div>
              )}
            </For>
          </Show>

          <button class="text-13-regular text-accent-primary mt-2">+ Add File to Session</button>
        </div>

        {/* Context Sets */}
        <div class="p-4">
          <div class="flex items-center justify-between mb-3">
            <div class="flex items-center gap-2">
              <span class="text-16">📚</span>
              <span class="text-12-semibold text-text-strong uppercase tracking-wider">Saved Sets</span>
            </div>
          </div>

          <For each={contextSets}>
            {(set) => (
              <div class="p-3 rounded-lg bg-background-base border border-border-weak-base mb-2">
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-2">
                    <span>{set.icon || "📁"}</span>
                    <span class="text-13-medium text-text-strong">{set.name}</span>
                  </div>
                  <div class="flex gap-1">
                    <button
                      class="text-11-medium text-accent-primary px-2 py-1 rounded hover:bg-accent-primary/10"
                      onClick={() => applySet(set.id)}
                    >
                      Apply
                    </button>
                  </div>
                </div>
                <div class="text-12-regular text-text-weak mt-1">{set.description}</div>
                <div class="text-11-regular text-text-weaker mt-1">{set.files.length} files</div>
              </div>
            )}
          </For>

          <button class="w-full py-2 text-13-regular text-accent-primary border border-dashed border-accent-primary/30 rounded-lg hover:bg-accent-primary/5">
            💾 Save Current as Set
          </button>
        </div>
      </ScrollView>
    </aside>
  )
}
```

---

## 📁 Files to Modify

### 4. `packages/app/src/app.tsx`

**Add ContextBankProvider:**

```tsx
import { ContextBankProvider } from "@/context/context-bank"

// Wrap app:
;<ContextBankProvider>
  <SkillsProvider>{props.children}</SkillsProvider>
</ContextBankProvider>
```

### 5. `packages/app/src/layouts/v3-layout.tsx`

**Add ContextBankPanel to layout:**

```tsx
import { ContextBankPanel } from "@/components/context-bank-panel"

// In the layout:
<div class="flex flex-1 overflow-hidden">
  <V3Sidebar />
  <main class="flex-1 overflow-hidden">
    {props.children}
  </main>
  <ContextBankPanel />  {&lt;-- Add this -->}
</div>
```

---

## ✅ Verification

1. Context Bank panel visible on right side
2. Global Context section shows always-on files
3. Session Context shows current session files
4. Token count visible
5. Can add/remove files from both contexts
6. Context Sets can be created and applied

---

## 🎯 Key UX Points

- **Empty by default** - No auto-include
- **User picks** what goes in global
- **Token count** always visible
- **Context Sets** for quick switching
- **Per-session** additions don't affect global

**Next: Phase 4 - File Tree**
