# Phase 1 Implementation Guide: V3 Foundation

## Blank Workspace + Top Bar + Sidebar

**Phase:** 1 of 7  
**Estimated Time:** 4 hours  
**Goal:** Create the foundational layout for Ideaspace V3

---

## 📁 Files to Create

### 1. `packages/app/src/layouts/v3-layout.tsx`

**Purpose:** Main layout wrapper for V3 interface

```tsx
import { ParentProps, createMemo } from "solid-js"
import { useParams } from "@solidjs/router"
import { useLayout } from "@/context/layout"
import { decode64 } from "@/utils/base64"
import { getFilename } from "@opencode-ai/util/path"
import { V3Sidebar } from "@/components/v3-sidebar"
import { V3Topbar } from "@/components/v3-topbar"

export function V3Layout(props: ParentProps) {
  const params = useParams()
  const layout = useLayout()

  const dir = createMemo(() => decode64(params.dir) ?? "")
  const project = createMemo(() =>
    layout.projects.list().find((item) => item.worktree === dir() || item.sandboxes?.includes(dir())),
  )
  const projectName = createMemo(() => project()?.name || getFilename(dir()) || "Ideaspace")

  return (
    <div class="flex flex-col h-screen bg-background-base">
      <V3Topbar projectName={projectName()} />
      <div class="flex flex-1 overflow-hidden">
        <V3Sidebar />
        <main class="flex-1 overflow-hidden">{props.children}</main>
      </div>
    </div>
  )
}
```

**Key Points:**

- Uses `h-screen` for full viewport height
- Topbar gets project name dynamically
- Sidebar is always visible
- Main content area is scrollable

---

### 2. `packages/app/src/components/v3-topbar.tsx`

**Purpose:** Header with logo, project info, search, settings, token counter

```tsx
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
      {/* Logo */}
      <div class="flex items-center gap-2">
        <div class="w-8 h-8 rounded-lg bg-accent-primary flex items-center justify-center text-black font-bold text-16">
          🧠
        </div>
        <span class="text-14-semibold text-text-strong hidden sm:block">Ideaspace</span>
      </div>

      {/* Project Info */}
      <div class="flex-1 px-4 min-w-0">
        <div class="text-11-medium text-text-weak uppercase tracking-wider">Project</div>
        <div class="text-14-semibold text-text-strong truncate">{props.projectName}</div>
      </div>

      {/* Search */}
      <div class="hidden md:flex items-center">
        <input
          type="text"
          placeholder="Search..."
          class="w-64 h-9 px-3 rounded-lg bg-background-base border border-border-weak-base text-13-regular placeholder:text-text-weaker focus:outline-none focus:border-accent-primary transition-colors"
        />
      </div>

      {/* Settings */}
      <IconButton icon="settings" variant="ghost" size="small" onClick={() => navigate("/settings")} title="Settings" />

      {/* Token Counter */}
      <TokenCounter />
    </header>
  )
}
```

**Key Points:**

- Fixed height: 56px (h-14)
- Logo with emoji (🧠) + text
- Project name with label
- Responsive search (hidden on mobile)
- TokenCounter component already exists

---

### 3. `packages/app/src/components/v3-sidebar.tsx`

**Purpose:** Left sidebar with navigation, sessions, skills, file tree

```tsx
import { createSignal, For } from "solid-js"
import { A, useNavigate, useParams } from "@solidjs/router"
import { Button } from "@opencode-ai/ui/button"
import { ScrollView } from "@opencode-ai/ui/scroll-view"

// Default skills data (will be replaced with real data later)
const defaultSkills = [
  { id: "write", name: "Write Content", icon: "✍️", description: "Technical writing and documentation" },
  { id: "review", name: "Code Review", icon: "👨‍💻", description: "Review and improve code" },
  { id: "plan", name: "Project Plan", icon: "📊", description: "Plan and organize work" },
]

export function V3Sidebar() {
  const navigate = useNavigate()
  const params = useParams()
  const [sessions] = createSignal([{ id: "1", name: "First workspace", preview: "Getting started...", time: "2h ago" }])

  return (
    <aside class="w-64 border-r border-border-weak-base bg-background-stronger flex flex-col">
      {/* Quick Actions */}
      <div class="p-3 space-y-2">
        <A
          href={`/${params.dir || "."}/v3`}
          class="flex items-center gap-2 px-3 py-2 rounded-lg text-13-medium text-text-strong hover:bg-background-base transition-colors"
          activeClass="bg-accent-primary/10 text-accent-primary"
        >
          <span>🏠</span>
          <span>Home</span>
        </A>

        <Button
          variant="secondary"
          size="small"
          class="w-full justify-start gap-2"
          onClick={() => navigate(`/${params.dir || "."}/session`)}
        >
          <span>➕</span>
          <span>New Session</span>
        </Button>
      </div>

      <ScrollView class="flex-1">
        {/* Sessions Section */}
        <div class="px-3 py-2">
          <div class="text-11-medium text-text-weak uppercase tracking-wider mb-2 px-3">My Work</div>
          <For each={sessions()}>
            {(session) => (
              <button
                class="w-full text-left px-3 py-2 rounded-lg hover:bg-background-base transition-colors group"
                onClick={() => navigate(`/${params.dir || "."}/session/${session.id}`)}
              >
                <div class="text-13-medium text-text-strong truncate">{session.name}</div>
                <div class="text-11-regular text-text-weak truncate">{session.preview}</div>
              </button>
            )}
          </For>
        </div>

        {/* Skills Section */}
        <div class="px-3 py-2">
          <div class="text-11-medium text-text-weak uppercase tracking-wider mb-2 px-3">Skills</div>
          <For each={defaultSkills}>
            {(skill) => (
              <button
                class="w-full text-left px-3 py-2 rounded-lg hover:bg-background-base transition-colors flex items-center gap-2 group"
                onClick={() => navigate(`/${params.dir || "."}/session?skill=${skill.id}`)}
                title={skill.description}
              >
                <span class="text-16">{skill.icon}</span>
                <span class="text-13-regular text-text-strong">{skill.name}</span>
              </button>
            )}
          </For>
          <button
            class="w-full text-left px-3 py-2 rounded-lg hover:bg-background-base transition-colors text-13-regular text-accent-primary flex items-center gap-2"
            onClick={() => navigate(`/${params.dir || "."}/skills/new`)}
          >
            <span>➕</span>
            <span>Create Skill</span>
          </button>
        </div>

        {/* File Tree Placeholder */}
        <div class="px-3 py-2">
          <div class="text-11-medium text-text-weak uppercase tracking-wider mb-2 px-3">Files</div>
          <div class="px-3 py-2 text-13-regular text-text-weak">File tree will appear here</div>
        </div>
      </ScrollView>
    </aside>
  )
}
```

**Key Points:**

- Fixed width: 256px (w-64)
- Three main sections: My Work, Skills, Files
- Skills have icons and descriptions
- "Create Skill" button at bottom of Skills section
- Scrollable content area

---

### 4. `packages/app/src/components/v3-blank-workspace.tsx`

**Purpose:** Main content area when no session is active

```tsx
import { useNavigate, useParams } from "@solidjs/router"

export function V3BlankWorkspace() {
  const navigate = useNavigate()
  const params = useParams()

  return (
    <div class="h-full flex items-center justify-center p-8">
      <div class="max-w-2xl text-center space-y-8">
        {/* Welcome */}
        <div class="space-y-2">
          <h1 class="text-28-semibold text-text-strong">👋 Welcome Back</h1>
          <p class="text-15-regular text-text-weak">Your workspace is ready. Start with intention.</p>
        </div>

        {/* Options */}
        <div class="grid gap-4 max-w-md mx-auto">
          {/* Pick Skill */}
          <button
            onClick={() => navigate(`/${params.dir || "."}/skills`)}
            class="p-4 rounded-2xl border border-border-weak-base bg-background-stronger hover:border-accent-primary hover:bg-accent-primary/5 transition-all text-left group"
          >
            <div class="flex items-center gap-3">
              <span class="text-24">🎨</span>
              <div>
                <div class="text-15-semibold text-text-strong">Pick a Skill</div>
                <div class="text-13-regular text-text-weak">Choose a pre-configured skill to get started fast</div>
              </div>
            </div>
          </button>

          {/* Add Files */}
          <button
            onClick={() => navigate(`/${params.dir || "."}/context`)}
            class="p-4 rounded-2xl border border-border-weak-base bg-background-stronger hover:border-accent-primary hover:bg-accent-primary/5 transition-all text-left group"
          >
            <div class="flex items-center gap-3">
              <span class="text-24">📁</span>
              <div>
                <div class="text-15-semibold text-text-strong">Add Files to Context</div>
                <div class="text-13-regular text-text-weak">Select files from your project to work with</div>
              </div>
            </div>
          </button>

          {/* Start Blank */}
          <button
            onClick={() => navigate(`/${params.dir || "."}/session`)}
            class="p-4 rounded-2xl border border-border-weak-base bg-background-stronger hover:border-accent-primary hover:bg-accent-primary/5 transition-all text-left group"
          >
            <div class="flex items-center gap-3">
              <span class="text-24">💬</span>
              <div>
                <div class="text-15-semibold text-text-strong">Start Blank Session</div>
                <div class="text-13-regular text-text-weak">Jump right in and ask the AI anything</div>
              </div>
            </div>
          </button>
        </div>
      </div>
    </div>
  )
}
```

**Key Points:**

- Centered layout
- Friendly welcome message
- Three clear starting options
- Hover effects for interactivity
- Uses emojis for visual appeal

---

## 📁 Files to Modify

### 5. `packages/app/src/app.tsx`

**Add these imports at the top:**

```tsx
const V3Layout = lazy(() => import("@/layouts/v3-layout"))
const V3BlankWorkspace = lazy(() => import("@/components/v3-blank-workspace"))
```

**Add this route inside the Router:**

```tsx
<Route path="/:dir/v3" component={V3Layout}>
  <Route path="/" component={V3BlankWorkspace} />
</Route>
```

**Placement:** Add after the existing `/:dir` route or alongside it.

---

## ✅ Verification Steps

1. **Type Check:**

   ```bash
   cd packages/app && bun run typecheck
   ```

   Should pass with no errors.

2. **Build:**

   ```bash
   cd packages/app && bun run build
   ```

   Should complete successfully.

3. **Visual Test:**
   - Navigate to `http://localhost:4444/{your-project}/v3`
   - Should see:
     - Top bar with logo, project name, search, settings, token counter
     - Left sidebar with Home, New Session, My Work, Skills, Files sections
     - Blank workspace with three starting options

---

## 🎨 Design Tokens Used

| Token                     | Value               | Usage            |
| ------------------------- | ------------------- | ---------------- |
| `bg-background-base`      | Main background     | Page background  |
| `bg-background-stronger`  | Elevated background | Sidebar, top bar |
| `border-border-weak-base` | Subtle borders      | Separators       |
| `text-text-strong`        | Primary text        | Headings, labels |
| `text-text-weak`          | Secondary text      | Descriptions     |
| `text-accent-primary`     | Brand color         | Links, buttons   |
| `text-11-medium`          | Small uppercase     | Section headers  |
| `text-13-regular`         | Body text           | Content          |
| `text-14-semibold`        | Emphasized          | Project name     |
| `text-15-semibold`        | Large               | Card titles      |
| `text-28-semibold`        | Hero                | Welcome heading  |

---

## 📝 Notes

- **Responsive:** Search hidden on mobile (`hidden md:flex`)
- **Accessibility:** Buttons have clear labels and hover states
- **Extensible:** Skills data will be replaced with real data in Phase 2
- **File Tree:** Placeholder section ready for Phase 4

---

## 🚀 Next Phase

After Phase 1 is complete, move to **Phase 2: Skills System** where we'll:

- Create skill data models
- Build skill creation/editing UI
- Wire up skills to sessions

**Phase 1 creates the foundation. Phase 2 brings it to life!**
