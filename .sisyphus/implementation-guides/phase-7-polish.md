# Phase 7 Implementation Guide: Polish

## Animations, Empty States, and Onboarding

**Phase:** 7 of 7  
**Estimated Time:** 2 hours  
**Goal:** Add smooth animations, helpful empty states, and onboarding flow

---

## 🎯 What We're Building

Final polish layer:

- Smooth transitions between states
- Helpful empty states with CTAs
- First-time user onboarding
- Micro-interactions throughout

---

## 📁 Files to Create

### 1. `packages/app/src/components/empty-state.tsx`

**Purpose:** Reusable empty state component

```tsx
import { Show } from "solid-js"

interface EmptyStateProps {
  icon: string
  title: string
  description: string
  action?: {
    label: string
    onClick: () => void
  }
  secondaryAction?: {
    label: string
    onClick: () => void
  }
}

export function EmptyState(props: EmptyStateProps) {
  return (
    <div class="flex flex-col items-center justify-center p-8 text-center animate-fade-in">
      <div class="text-48 mb-4 animate-bounce-subtle">{props.icon}</div>

      <h3 class="text-18-semibold text-text-strong mb-2">{props.title}</h3>

      <p class="text-14-regular text-text-weak max-w-sm mb-6">{props.description}</p>

      <Show when={props.action}>
        {(action) => (
          <div class="flex flex-col gap-3">
            <button
              onClick={action().onClick}
              class="px-4 py-2 rounded-lg bg-accent-primary text-black text-14-semibold hover:bg-accent-primary/90 transition-colors"
            >
              {action().label}
            </button>

            <Show when={props.secondaryAction}>
              {(secondary) => (
                <button onClick={secondary().onClick} class="text-14-regular text-accent-primary hover:underline">
                  {secondary().label}
                </button>
              )}
            </Show>
          </div>
        )}
      </Show>
    </div>
  )
}
```

**Key Points:**

- Animated icon with subtle bounce
- Fade-in animation on mount
- Primary and secondary actions
- Consistent styling across all empty states

---

### 2. `packages/app/src/components/transitions.tsx`

**Purpose:** Shared transition components

```tsx
import { children, type ParentProps } from "solid-js"

// Fade in on mount
export function FadeIn(props: ParentProps & { delay?: number }) {
  const c = children(() => props.children)
  return (
    <div class="animate-fade-in" style={{ "animation-delay": `${props.delay || 0}ms` }}>
      {c()}
    </div>
  )
}

// Slide up and fade in
export function SlideUp(props: ParentProps & { delay?: number }) {
  const c = children(() => props.children)
  return (
    <div class="animate-slide-up" style={{ "animation-delay": `${props.delay || 0}ms` }}>
      {c()}
    </div>
  )
}

// Stagger children
export function StaggerContainer(props: ParentProps & { stagger?: number }) {
  return <div class="contents">{props.children}</div>
}

export function StaggerItem(props: ParentProps & { index: number; stagger?: number }) {
  const c = children(() => props.children)
  const delay = () => (props.index || 0) * (props.stagger || 50)
  return (
    <div class="animate-fade-in" style={{ "animation-delay": `${delay()}ms` }}>
      {c()}
    </div>
  )
}

// Page transition wrapper
export function PageTransition(props: ParentProps) {
  const c = children(() => props.children)
  return <div class="animate-page-in">{c()}</div>
}
```

**Key Points:**

- Reusable animation wrappers
- Configurable delays
- Stagger support for lists
- Page-level transitions

---

### 3. `packages/app/src/components/onboarding-modal.tsx`

**Purpose:** First-time user onboarding

```tsx
import { createSignal, Show, For } from "solid-js"
import { useNavigate, useParams } from "@solidjs/router"
import { Button } from "@opencode-ai/ui/button"

const ONBOARDING_STEPS = [
  {
    icon: "👋",
    title: "Welcome to Ideaspace",
    description: "Your AI-powered workspace for intentional development. Start simple, add complexity as you need it.",
  },
  {
    icon: "🎨",
    title: "Skills System",
    description:
      "Create pre-configured AI assistants for specific tasks. Each skill has its own instructions and default context.",
  },
  {
    icon: "📁",
    title: "Intentional Context",
    description:
      "You control what the AI sees. Add files to Global Context (always on) or Session Context (per conversation).",
  },
  {
    icon: "📋",
    title: "Task Management",
    description:
      "Track your work with the Kanban board. Drag tasks between columns and work on them with AI assistance.",
  },
  {
    icon: "🚀",
    title: "You're Ready!",
    description: "Start by picking a skill or creating a new session. Your workspace is yours to customize.",
  },
]

export function OnboardingModal() {
  const navigate = useNavigate()
  const params = useParams()
  const [step, setStep] = createSignal(0)
  const [show, setShow] = createSignal(!localStorage.getItem("ideaspace:onboarded"))

  const currentStep = () => ONBOARDING_STEPS[step()]
  const isLast = () => step() === ONBOARDING_STEPS.length - 1
  const isFirst = () => step() === 0

  const handleNext = () => {
    if (isLast()) {
      localStorage.setItem("ideaspace:onboarded", "true")
      setShow(false)
    } else {
      setStep((s) => s + 1)
    }
  }

  const handleSkip = () => {
    localStorage.setItem("ideaspace:onboarded", "true")
    setShow(false)
  }

  const handleStart = () => {
    localStorage.setItem("ideaspace:onboarded", "true")
    setShow(false)
    navigate(`/${params.dir || "."}/skills`)
  }

  if (!show()) return null

  return (
    <div class="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div class="w-full max-w-md rounded-2xl border border-border-weak-base bg-background-base shadow-2xl overflow-hidden animate-scale-in">
        {/* Progress */}
        <div class="h-1 bg-background-stronger">
          <div
            class="h-full bg-accent-primary transition-all duration-300"
            style={{ width: `${((step() + 1) / ONBOARDING_STEPS.length) * 100}%` }}
          />
        </div>

        {/* Content */}
        <div class="p-8 text-center">
          <div class="text-64 mb-4 animate-bounce-subtle">{currentStep().icon}</div>

          <h2 class="text-24-semibold text-text-strong mb-3">{currentStep().title}</h2>

          <p class="text-15-regular text-text-weak leading-relaxed">{currentStep().description}</p>

          {/* Dots */}
          <div class="flex justify-center gap-2 mt-6">
            <For each={ONBOARDING_STEPS}>
              {(_, i) => (
                <button
                  class={`w-2 h-2 rounded-full transition-colors ${
                    i() === step() ? "bg-accent-primary" : "bg-border-weak-base"
                  }`}
                  onClick={() => setStep(i())}
                />
              )}
            </For>
          </div>
        </div>

        {/* Footer */}
        <div class="p-4 border-t border-border-weak-base flex justify-between items-center">
          <Show
            when={!isFirst()}
            fallback={
              <button class="text-14-regular text-text-weak hover:text-text-strong" onClick={handleSkip}>
                Skip
              </button>
            }
          >
            <button class="text-14-regular text-text-weak hover:text-text-strong" onClick={() => setStep((s) => s - 1)}>
              Back
            </button>
          </Show>

          <Show
            when={!isLast()}
            fallback={
              <Button variant="primary" onClick={handleStart}>
                Get Started 🚀
              </Button>
            }
          >
            <Button variant="primary" onClick={handleNext}>
              Next →
            </Button>
          </Show>
        </div>
      </div>
    </div>
  )
}
```

**Key Points:**

- 5-step onboarding flow
- Progress indicator
- Skip option available
- Saves completion to localStorage
- Final step links to skills

---

### 4. `packages/app/src/components/skill-empty-state.tsx`

**Purpose:** Empty state for skills page

```tsx
import { useNavigate, useParams } from "@solidjs/router"
import { EmptyState } from "./empty-state"

export function SkillEmptyState() {
  const navigate = useNavigate()
  const params = useParams()

  return (
    <EmptyState
      icon="🎨"
      title="No Skills Yet"
      description="Skills are pre-configured AI assistants. Create your first skill to get started faster."
      action={{
        label: "Create Your First Skill",
        onClick: () => navigate(`/${params.dir || "."}/skills/new`),
      }}
      secondaryAction={{
        label: "Learn more about skills",
        onClick: () => window.open("https://docs.ideaspace.ai/skills", "_blank"),
      }}
    />
  )
}
```

---

### 5. `packages/app/src/components/context-empty-state.tsx`

**Purpose:** Empty state for Context Bank

```tsx
import { useNavigate, useParams } from "@solidjs/router"
import { EmptyState } from "./empty-state"

interface ContextEmptyStateProps {
  type: "global" | "session"
}

export function ContextEmptyState(props: ContextEmptyStateProps) {
  const navigate = useNavigate()
  const params = useParams()

  const isGlobal = () => props.type === "global"

  return (
    <EmptyState
      icon={isGlobal() ? "🌍" : "📌"}
      title={isGlobal() ? "No Global Context" : "No Session Context"}
      description={
        isGlobal()
          ? "Global context files are always included. Add files you reference often."
          : "Add files to give the AI context for this conversation."
      }
      action={{
        label: "Add Files",
        onClick: () => navigate(`/${params.dir || "."}/context`),
      }}
    />
  )
}
```

---

### 6. Add CSS Animations

**Add to `packages/app/src/styles/animations.css` (or existing CSS file):**

```css
/* Fade in */
@keyframes fade-in {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.animate-fade-in {
  animation: fade-in 0.3s ease-out forwards;
}

/* Slide up */
@keyframes slide-up {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-slide-up {
  animation: slide-up 0.3s ease-out forwards;
}

/* Scale in */
@keyframes scale-in {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.animate-scale-in {
  animation: scale-in 0.2s ease-out forwards;
}

/* Page in */
@keyframes page-in {
  from {
    opacity: 0;
    transform: translateX(10px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.animate-page-in {
  animation: page-in 0.25s ease-out forwards;
}

/* Bounce subtle */
@keyframes bounce-subtle {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-5px);
  }
}

.animate-bounce-subtle {
  animation: bounce-subtle 2s ease-in-out infinite;
}

/* Pulse ring */
@keyframes pulse-ring {
  0% {
    box-shadow: 0 0 0 0 rgba(var(--accent-primary-rgb), 0.4);
  }
  70% {
    box-shadow: 0 0 0 10px rgba(var(--accent-primary-rgb), 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(var(--accent-primary-rgb), 0);
  }
}

.animate-pulse-ring {
  animation: pulse-ring 2s ease-out infinite;
}

/* Shimmer loading */
@keyframes shimmer {
  0% {
    background-position: -200% 0;
  }
  100% {
    background-position: 200% 0;
  }
}

.animate-shimmer {
  background: linear-gradient(
    90deg,
    var(--background-stronger) 25%,
    var(--background-base) 50%,
    var(--background-stronger) 75%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}
```

---

## 📁 Files to Modify

### 7. `packages/app/src/components/v3-blank-workspace.tsx`

**Add animations:**

```tsx
import { FadeIn, SlideUp, StaggerItem } from "./transitions"

// Wrap content:
;<div class="h-full flex items-center justify-center p-8">
  <div class="max-w-2xl text-center">
    <FadeIn>
      <div class="space-y-2 mb-8">
        <h1 class="text-28-semibold text-text-strong">👋 Welcome Back</h1>
        <p class="text-15-regular text-text-weak">Your workspace is ready. Start with intention.</p>
      </div>
    </FadeIn>

    <div class="grid gap-4 max-w-md mx-auto">
      <StaggerItem index={0}>
        <SlideUp>{/* Pick Skill button */}</SlideUp>
      </StaggerItem>

      <StaggerItem index={1}>
        <SlideUp delay={100}>{/* Add Files button */}</SlideUp>
      </StaggerItem>

      <StaggerItem index={2}>
        <SlideUp delay={200}>{/* Start Blank button */}</SlideUp>
      </StaggerItem>
    </div>
  </div>
</div>
```

---

### 8. `packages/app/src/pages/skills.tsx`

**Add empty state:**

```tsx
import { SkillEmptyState } from "@/components/skill-empty-state"
import { FadeIn } from "@/components/transitions"

// In the render, when no skills:
;<Show
  when={skills.skills.length > 0}
  fallback={
    <FadeIn>
      <SkillEmptyState />
    </FadeIn>
  }
>
  {/* existing skills list */}
</Show>
```

---

### 9. `packages/app/src/components/context-bank-panel.tsx`

**Add empty states:**

```tsx
import { ContextEmptyState } from "./context-empty-state"

// In Global Context section:
<Show
  when={globalContext.files.length > 0}
  fallback={
    <div class="py-4">
      <ContextEmptyState type="global" />
    </div>
  }
>
  {/* existing file list */}
</Show>

// In Session Context section:
<Show
  when={sessionContext.files.length > 0}
  fallback={
    <div class="py-4">
      <ContextEmptyState type="session" />
    </div>
  }
>
  {/* existing file list */}
</Show>
```

---

### 10. `packages/app/src/layouts/v3-layout.tsx`

**Add onboarding modal:**

```tsx
import { OnboardingModal } from "@/components/onboarding-modal"

// In the layout:
;<div class="flex flex-col h-screen bg-background-base">
  <V3Topbar projectName={projectName()} />
  <div class="flex flex-1 overflow-hidden">
    <V3Sidebar />
    <main class="flex-1 overflow-hidden">
      <PageTransition>{props.children}</PageTransition>
    </main>
    <ContextBankPanel />
  </div>

  <OnboardingModal />
</div>
```

---

### 11. `packages/app/src/components/v3-sidebar.tsx`

**Add hover animations:**

```tsx
// Update button styles to include transitions:
class="flex items-center gap-2 px-3 py-2 rounded-lg text-13-medium text-text-strong
       hover:bg-background-base hover:translate-x-0.5
       transition-all duration-150"
```

---

## 🔗 Integration with Previous Phases

### All Phases

- Empty states for every major section
- Animations on page transitions
- Staggered list animations
- Onboarding covers all features

---

## ✅ Verification Steps

1. **Type Check:**

   ```bash
   cd packages/app && bun run typecheck
   ```

2. **Onboarding:**
   - Clear localStorage (`delete localStorage['ideaspace:onboarded']`)
   - Refresh page → Onboarding modal appears
   - Navigate through all 5 steps
   - Click "Get Started" → Goes to skills

3. **Empty States:**
   - Skills page with no skills → Shows empty state
   - Context Bank with no files → Shows empty states
   - Each has clear CTA

4. **Animations:**
   - Page transitions smooth
   - List items stagger in
   - Buttons have hover states
   - Loading states have shimmer

---

## 🎨 Animation Guidelines

| Animation | Duration  | Use Case           |
| --------- | --------- | ------------------ |
| Fade in   | 300ms     | Content appearance |
| Slide up  | 300ms     | Cards, modals      |
| Scale in  | 200ms     | Popovers, menus    |
| Page in   | 250ms     | Route changes      |
| Bounce    | 2s loop   | Empty state icons  |
| Shimmer   | 1.5s loop | Loading states     |

---

## 📝 Key Features

1. **Onboarding:** 5-step guided tour for new users
2. **Empty States:** Helpful placeholders with CTAs
3. **Animations:** Smooth, purposeful transitions
4. **Micro-interactions:** Hover states, feedback

---

## ✅ Phase 7 Complete - V3 Ready!

All 7 phases complete:

1. ✅ Foundation - Layout, topbar, sidebar
2. ✅ Skills System - Create, edit, use skills
3. ✅ Context Management - Global + session context
4. ✅ File Tree - .gitignore respect, context actions
5. ✅ Workspace Integration - Working blank state
6. ✅ Tasks Tab - Kanban with session linking
7. ✅ Polish - Animations, empty states, onboarding

**Ideaspace V3 is now complete with intentional context management for non-tech users!**
