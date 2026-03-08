# Phase 2 Implementation Guide: Skills System

## Create, Edit, and Use Skills

**Phase:** 2 of 7  
**Estimated Time:** 4 hours  
**Goal:** Build the skills system for non-tech users

---

## 🎯 What is a Skill?

A **Skill** is a pre-configured AI assistant setup that includes:

- **Name:** e.g., "Write Blog Posts"
- **Icon:** e.g., 📝
- **Description:** What the skill does
- **Instructions:** System prompt for the AI
- **Default Context:** Files to auto-include

---

## 📁 Files to Create

### 1. `packages/app/src/types/skill.ts`

```typescript
export interface Skill {
  id: string
  name: string
  icon: string
  description: string
  instructions: string
  defaultContext: string[] // File paths
  createdAt: number
  updatedAt: number
}

export interface SkillCreateInput {
  name: string
  icon: string
  description: string
  instructions: string
  defaultContext: string[]
}

export interface SkillUpdateInput extends Partial<SkillCreateInput> {
  id: string
}
```

---

### 2. `packages/app/src/context/skills.tsx`

```tsx
import { createContext, useContext, ParentProps, createSignal } from "solid-js"
import { createStore } from "solid-js/store"
import type { Skill, SkillCreateInput, SkillUpdateInput } from "@/types/skill"

interface SkillsContextValue {
  skills: Skill[]
  getSkill: (id: string) => Skill | undefined
  createSkill: (input: SkillCreateInput) => Skill
  updateSkill: (input: SkillUpdateInput) => void
  deleteSkill: (id: string) => void
}

const SkillsContext = createContext<SkillsContextValue>()

export function SkillsProvider(props: ParentProps) {
  const [skills, setSkills] = createStore<Skill[]>([
    // Default skills
    {
      id: "write",
      name: "Write Content",
      icon: "✍️",
      description: "Technical writing and documentation",
      instructions:
        "You are a technical writer. Help create clear, engaging content following the project's style guide.",
      defaultContext: [".ideaspace/style-guide.md"],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    },
    {
      id: "review",
      name: "Code Review",
      icon: "👨‍💻",
      description: "Review and improve code",
      instructions: "You are a senior developer. Review code for bugs, performance, and best practices.",
      defaultContext: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    },
    {
      id: "plan",
      name: "Project Plan",
      icon: "📊",
      description: "Plan and organize work",
      instructions: "You are a project manager. Help break down work into actionable tasks.",
      defaultContext: [".ideaspace/templates/plan.md"],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    },
  ])

  const getSkill = (id: string) => skills.find((s) => s.id === id)

  const createSkill = (input: SkillCreateInput): Skill => {
    const skill: Skill = {
      id: `skill_${Date.now()}`,
      ...input,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }
    setSkills((prev) => [...prev, skill])
    return skill
  }

  const updateSkill = (input: SkillUpdateInput) => {
    setSkills((s) => s.id === input.id, { ...input, updatedAt: Date.now() })
  }

  const deleteSkill = (id: string) => {
    setSkills((prev) => prev.filter((s) => s.id !== id))
  }

  return (
    <SkillsContext.Provider value={{ skills, getSkill, createSkill, updateSkill, deleteSkill }}>
      {props.children}
    </SkillsContext.Provider>
  )
}

export function useSkills() {
  const context = useContext(SkillsContext)
  if (!context) throw new Error("useSkills must be used within SkillsProvider")
  return context
}
```

---

### 3. `packages/app/src/pages/skills.tsx`

```tsx
import { For } from "solid-js"
import { useNavigate, useParams } from "@solidjs/router"
import { Button } from "@opencode-ai/ui/button"
import { IconButton } from "@opencode-ai/ui/icon-button"
import { ScrollView } from "@opencode-ai/ui/scroll-view"
import { useSkills } from "@/context/skills"

export default function SkillsPage() {
  const navigate = useNavigate()
  const params = useParams()
  const { skills } = useSkills()

  return (
    <div class="h-full flex flex-col p-6">
      <div class="flex items-center justify-between mb-6">
        <div>
          <h1 class="text-24-semibold text-text-strong">Skills</h1>
          <p class="text-14-regular text-text-weak mt-1">Pre-configured AI assistants for specific tasks</p>
        </div>
        <Button variant="primary" onClick={() => avigate(`/${params.dir || "."}/skills/new`)}>
          ➕ Create Skill
        </Button>
      </div>

      <ScrollView class="flex-1">
        <div class="grid gap-4">
          <For each={skills}>
            {(skill) => (
              <div class="p-4 rounded-xl border border-border-weak-base bg-background-stronger hover:border-accent-primary transition-colors">
                <div class="flex items-start gap-4">
                  <span class="text-32">{skill.icon}</span>
                  <div class="flex-1">
                    <div class="flex items-center justify-between">
                      <h3 class="text-16-semibold text-text-strong">{skill.name}</h3>
                      <div class="flex gap-2">
                        <IconButton
                          icon="pencil"
                          variant="ghost"
                          size="small"
                          onClick={() => navigate(`/${params.dir || "."}/skills/${skill.id}/edit`)}
                          title="Edit skill"
                        />
                        <IconButton
                          icon="play"
                          variant="primary"
                          size="small"
                          onClick={() => navigate(`/${params.dir || "."}/session?skill=${skill.id}`)}
                          title="Use skill"
                        />
                      </div>
                    </div>
                    <p class="text-13-regular text-text-weak mt-1">{skill.description}</p>

                    <div class="flex items-center gap-2 mt-3">
                      <span class="text-11-regular text-text-weaker">Default context:</span>
                      <span class="text-11-medium text-text-weak">
                        {skill.defaultContext.length > 0 ? `${skill.defaultContext.length} files` : "None"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </For>
        </div>
      </ScrollView>
    </div>
  )
}
```

---

### 4. `packages/app/src/pages/skill-editor.tsx`

```tsx
import { createSignal } from "solid-js"
import { useNavigate, useParams } from "@solidjs/router"
import { Button } from "@opencode-ai/ui/button"
import { useSkills } from "@/context/skills"

export default function SkillEditorPage() {
  const navigate = useNavigate()
  const params = useParams()
  const { getSkill, createSkill, updateSkill } = useSkills()

  const isEditing = () => Boolean(params.id)
  const existingSkill = () => (isEditing() ? getSkill(params.id!) : undefined)

  const [name, setName] = createSignal(existingSkill()?.name || "")
  const [icon, setIcon] = createSignal(existingSkill()?.icon || "🎨")
  const [description, setDescription] = createSignal(existingSkill()?.description || "")
  const [instructions, setInstructions] = createSignal(existingSkill()?.instructions || "")

  const handleSave = () => {
    const data = {
      name: name(),
      icon: icon(),
      description: description(),
      instructions: instructions(),
      defaultContext: existingSkill()?.defaultContext || [],
    }

    if (isEditing()) {
      updateSkill({ id: params.id!, ...data })
    } else {
      createSkill(data)
    }

    navigate(`/${params.dir || "."}/skills`)
  }

  return (
    <div class="h-full flex flex-col p-6 max-w-3xl mx-auto">
      <h1 class="text-24-semibold text-text-strong mb-6">{isEditing() ? "Edit Skill" : "Create Skill"}</h1>

      <div class="space-y-6">
        <div>
          <label class="block text-13-medium text-text-strong mb-2">Name</label>
          <input
            type="text"
            value={name()}
            onInput={(e) => setName(e.currentTarget.value)}
            placeholder="e.g., Write Blog Posts"
            class="w-full h-10 px-3 rounded-lg bg-background-stronger border border-border-weak-base text-13-regular focus:outline-none focus:border-accent-primary"
          />
        </div>

        <div>
          <label class="block text-13-medium text-text-strong mb-2">Icon</label>
          <input
            type="text"
            value={icon()}
            onInput={(e) => setIcon(e.currentTarget.value)}
            placeholder="e.g., 📝"
            class="w-20 h-10 px-3 rounded-lg bg-background-stronger border border-border-weak-base text-13-regular focus:outline-none focus:border-accent-primary text-center"
          />
        </div>

        <div>
          <label class="block text-13-medium text-text-strong mb-2">Description</label>
          <input
            type="text"
            value={description()}
            onInput={(e) => setDescription(e.currentTarget.value)}
            placeholder="What this skill does..."
            class="w-full h-10 px-3 rounded-lg bg-background-stronger border border-border-weak-base text-13-regular focus:outline-none focus:border-accent-primary"
          />
        </div>

        <div>
          <label class="block text-13-medium text-text-strong mb-2">AI Instructions</label>
          <textarea
            value={instructions()}
            onInput={(e) => setInstructions(e.currentTarget.value)}
            placeholder="You are a helpful assistant..."
            rows={6}
            class="w-full px-3 py-2 rounded-lg bg-background-stronger border border-border-weak-base text-13-regular focus:outline-none focus:border-accent-primary resize-none"
          />
          <p class="text-12-regular text-text-weak mt-1">
            These instructions guide how the AI behaves when using this skill.
          </p>
        </div>

        <div class="flex gap-3 pt-4">
          <Button variant="secondary" onClick={() => navigate(-1)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSave}>
            {isEditing() ? "Save Changes" : "Create Skill"}
          </Button>
        </div>
      </div>
    </div>
  )
}
```

---

## 📁 Files to Modify

### 5. `packages/app/src/app.tsx`

**Add imports:**

```tsx
const SkillsPage = lazy(() => import("@/pages/skills"))
const SkillEditorPage = lazy(() => import("@/pages/skill-editor"))
```

**Add routes inside V3Layout:**

```tsx
<Route path="/:dir/v3" component={V3Layout}>
  <Route path="/" component={V3BlankWorkspace} />
  <Route path="/skills" component={SkillsPage} />
  <Route path="/skills/new" component={SkillEditorPage} />
  <Route path="/skills/:id/edit" component={SkillEditorPage} />
</Route>
```

### 6. `packages/app/src/app.tsx` - Wrap with SkillsProvider

**Add to providers:**

```tsx
import { SkillsProvider } from "@/context/skills"

// Wrap the app:
;<SkillsProvider>{props.children}</SkillsProvider>
```

---

## 🔄 Integration with Sessions

When a user clicks a skill:

1. Navigate to `/:dir/session?skill={skillId}`
2. Session component reads the skill ID from URL
3. Loads the skill's instructions as system prompt
4. Auto-adds skill's defaultContext files

---

## ✅ Verification

1. Navigate to `/:dir/v3/skills`
2. See list of skills with icons
3. Click "Create Skill" → fill form → save
4. New skill appears in list
5. Click skill → starts session with that skill's configuration

---

## 📝 Skills UX Flow

```
User clicks "Write Content" skill
          ↓
Session starts with:
- System prompt: "You are a technical writer..."
- Context: style-guide.md auto-loaded
- AI greets: "I'll help you write content..."
          ↓
User chats with skill-configured AI
```

**Next: Phase 3 - Context Management**
