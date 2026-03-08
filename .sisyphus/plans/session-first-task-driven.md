# Hackathon Features: Session-First + Task-Driven + Command Palette

## Overview

Transform Ideaspace into a seamless AI workspace where:

1. **Session is the 1st tab** - AI chat is the primary interface
2. **Task-driven sessions** - Click any task → AI helps you complete it
3. **Command palette** - Cmd+K anywhere for instant actions

## Flow Architecture

```
┌────────────────────────────────────────────────────────────────────┐
│  [Session]  [Workspace]  [Tasks]  [Agents]  [Context]              │
│  ─────────────────────────────────────────────────────             │
│                                                                    │
│  💬 Session Tab (Default)                                          │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  🤖 AI: "What would you like to work on?"                   │  │
│  │  👤 User: "Implement the auth module"                        │  │
│  │  🤖 AI: "I see you have task #42 for that. Starting now..." │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                    │
│  🏃 Tasks Tab                                                      │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  [Implement auth] [Progress] → [Work on this ▼]             │  │
│  │  [Setup database] [Backlog]  → [Work on this ▼]             │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                    │
│  ⌨️ Command Palette (Cmd+K anywhere)                               │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  > Work on "Implement auth"                                  │  │
│  │  > Start planner session                                     │  │
│  │  > Create new task                                           │  │
│  │  > Open recent files                                         │  │
│  └──────────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────┘
```

## Task Breakdown

### Task 1: Reorder Tabs - Session Becomes 1st/Default (15 min)

**Files:**

- `packages/app/src/components/project-tabs.tsx` - Reorder tabs array
- `packages/app/src/app.tsx` - Update default route
- `packages/app/src/pages/project.tsx` - Add Session as tab content

**Changes:**

1. Move Session to index 0 in tabs array
2. Update default route from `/` redirect to SessionIndexRoute
3. Handle session/:id? route inside ProjectRoute Switch
4. Remove separate SessionRoute from app.tsx

**Verification:**

- Opening `/:dir/` lands on Session tab
- Session tab is visually first
- Session content renders within project layout

---

### Task 2: Task-Driven Sessions - "Work on This" Button (30 min)

**Files:**

- `packages/app/src/pages/tasks/index.tsx` - Add action button to cards
- `packages/app/src/pages/session/...` - Create task context initialization
- `packages/app/src/context/session.ts` - (create) Session context provider

**Changes:**

1. Add "Work on this" dropdown to each task card
2. Options: "Chat about this", "Start implementation", "Break into subtasks"
3. Navigate to session with task context in URL query
4. Session reads query param and initializes with task context
5. AI receives: task title, body, dependencies, current status

**Verification:**

- Click task card → see "Work on this" options
- Select option → navigates to Session tab
- Session shows task context indicator
- AI greeting acknowledges the task

---

### Task 3: Task Context in Session (30 min)

**Files:**

- `packages/app/src/pages/session.tsx` - Read task context from URL
- `packages/app/src/pages/session/composer/session-composer-region.tsx` - Show task badge
- `packages/app/src/context/session.tsx` - (create) Manage session state

**Changes:**

1. Read `?task=task-id` from URL in Session component
2. Fetch task details from task-board API
3. Display floating task badge in composer
4. Inject task context into first AI message
5. Track session as "working on task X" in metadata

**Verification:**

- URL `?task=abc123` shows task badge
- Task title visible in composer
- First AI message: "I'll help you with [task name]"
- Closing/reopening session restores task context

---

### Task 4: Unified Command Palette - Cmd+K (45 min)

**Files:**

- `packages/app/src/components/command-palette.tsx` - (create) Main component
- `packages/app/src/context/command-palette.tsx` - (create) State management
- `packages/app/src/app.tsx` - Global keyboard listener
- `packages/app/src/pages/project.tsx` - Contextual actions

**Changes:**

1. Create CommandPalette component with fuzzy search
2. Global Cmd+K listener (preventDefault when open)
3. Contextual commands based on current route:
   - From Tasks: "Work on [specific task]"
   - From Workspace: "Start planner for [selected plan]"
   - From Session: "Attach current task to [column]"
4. Quick actions: "New task", "Open planner", "Recent files"
5. Visual: Spotlight-style overlay, keyboard navigation

**Command Categories:**

- **Navigation**: Switch tabs, recent projects
- **Tasks**: Work on task, move task, create task
- **Session**: New session, attach context, run command
- **Workspace**: Open plan, refresh plans, convert to tasks

**Verification:**

- Cmd+K opens palette from any page
- Type filters commands instantly
- Arrow keys navigate, Enter selects
- Escape closes palette

---

### Task 5: Contextual Quick Actions (20 min)

**Files:**

- `packages/app/src/pages/tasks/index.tsx` - Task-specific actions
- `packages/app/src/pages/workspace/index.tsx` - Plan-specific actions
- `packages/app/src/pages/session.tsx` - Session-specific actions

**Changes:**

1. Tasks: Quick filter by status, bulk actions
2. Workspace: Quick "Start planner" button in header
3. Session: Floating action button for common operations
4. All tabs: Consistent "Cmd+K for commands" hint

**Verification:**

- Each tab has contextual quick actions
- Consistent UI pattern across tabs
- Actions are discoverable

---

### Task 6: Polish & Integration (15 min)

**Files:**

- `packages/app/src/pages/project.tsx` - Smooth tab transitions
- `packages/app/src/...` - Animation polish

**Changes:**

1. Add tab switch animation
2. Session tab indicator when task is active
3. Task card highlight when session is working on it
4. Loading states for async operations

---

## Demo Script for Hackathon

### The Setup (30 seconds)

"Ideaspace is an AI-native workspace. Unlike other tools where you leave context to chat with AI, we've made the AI session the **center of your workflow**."

### Demo 1: Session-First (20 seconds)

1. Open project → Lands directly on Session tab
2. "Notice you're immediately in the AI chat - no clicking around"

### Demo 2: Task-Driven Sessions (30 seconds)

1. Click Tasks tab → Shows Kanban
2. Point to task "Implement auth module"
3. Click "Work on this" → "Start implementation"
4. Auto-switches to Session tab
5. "AI immediately knows the task context and starts helping"
6. Show task badge floating in composer

### Demo 3: Command Palette (20 seconds)

1. Press Cmd+K anywhere
2. "Quick actions without leaving keyboard"
3. Type "work on auth" → Enter
4. "Instantly starts session for that task"

### The Close (10 seconds)

"This is the first AI workspace where your tasks, plans, and AI assistant are truly connected. Plan it, track it, build it - all in one seamless flow."

---

## Success Criteria

- [ ] Session is 1st tab and default landing page
- [ ] "Work on this" button appears on every task card
- [ ] Clicking it opens session with task context
- [ ] Cmd+K opens command palette from any page
- [ ] Commands are contextual and actionable
- [ ] Full demo completes in under 2 minutes
- [ ] No page reloads during demo (SPA feel)

---

## Technical Notes

### Session as Tab Challenge

Currently Session is a separate route outside ProjectRoute. Need to:

- Move it inside ProjectRoute's Switch
- Handle session/:id? route matching
- Ensure session state persists across tab switches

### Task Context Challenge

Need to pass task ID across tab switch. Options:

- URL query param: `?task=abc123` (chosen - simple, bookmarkable)
- State management: Context provider (complex, doesn't survive refresh)
- LocalStorage: Persist last task (invisible to user)

### Command Palette Challenge

Need to:

- Prevent default Cmd+K behavior
- Build fuzzy search (fuse.js or simple includes)
- Generate commands dynamically based on current state
- Handle keyboard navigation (arrows, enter, escape)

---

## Files to Create

1. `packages/app/src/components/command-palette.tsx` - Main palette UI
2. `packages/app/src/context/command-palette.tsx` - Palette state management
3. `packages/app/src/hooks/use-command-palette.tsx` - Keyboard shortcut hook

## Files to Modify

1. `packages/app/src/components/project-tabs.tsx` - Reorder tabs
2. `packages/app/src/app.tsx` - Update routing
3. `packages/app/src/pages/project.tsx` - Add Session to tabs
4. `packages/app/src/pages/tasks/index.tsx` - Add work buttons
5. `packages/app/src/pages/session.tsx` - Read task context
6. `packages/app/src/pages/session/composer/session-composer-region.tsx` - Task badge

---

## Dependencies

No new dependencies needed. Uses existing:

- `@solidjs/router` for routing
- `@opencode-ai/ui` for components
- SolidJS signals/stores for state

---

## 🎯 SESSION ORCHESTRATION ARCHITECTURE (CRITICAL)

Your understanding is correct! **Session is the orchestrator** that controls the entire workflow:

### Current Flow (What We Built)

```
┌────────────────────────────────────────────────────────────┐
│  SESSION (AI Chat Interface)                               │
│  ┌────────────────────────────────────────────────────┐   │
│  │  Plan Mode (via PlanEnterTool)                     │   │
│  │  ├── Creates .ideaspace/plans/{timestamp}-{slug}.md│   │
│  │  ├── Writes TODOs with - [ ] Task format          │   │
│  │  └── Stored in markdown with metadata             │   │
│  │                                                    │   │
│  │  Build Mode (via PlanExitTool)                     │   │
│  │  ├── Edits files directly                         │   │
│  │  └── Executes commands                            │   │
│  └────────────────────────────────────────────────────┘   │
│                            ↓                               │
│              Workspace Tab (View Plans)                    │
│              [Convert to Tasks] → Tasks Tab               │
│                            ↓                               │
│              Task Board (Kanban)                           │
└────────────────────────────────────────────────────────────┘
```

### Target Flow (What We're Building)

```
┌────────────────────────────────────────────────────────────┐
│  SESSION (The Orchestrator)                                │
│                                                            │
│  Plan Mode ───────────────────────────────────────────┐   │
│  │  AI creates plan with TODOs                          │   │
│  │  Saves to .ideaspace/plans/*.md                     │   │
│  │                                                      │   │
│  │  [NEW] Auto-import to task board                    │   │
│  │  ├─ Session calls TaskBoard.importFromPlan()        │   │
│  │  └─ Tasks appear in Kanban                          │   │
│  └─────────────────────────────────────────────────────┘   │
│                            ↓                               │
│  Task Mode ───────────────────────────────────────────┐   │
│  │  "Work on task #5"                                  │   │
│  │  ├─ Load task context (title, body, deps)          │   │
│  │  ├─ AI helps implement                            │   │
│  │  └─ [NEW] Auto-update task status when done        │   │
│  │     Task moves: Progress → Review/Done             │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                            │
│  Build Mode ──────────────────────────────────────────┐   │
│  │  Direct file editing (existing)                     │   │
│  │  Command execution                                  │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

### Session Orchestration Tools Needed

1. **PlanEnterTool** ✅ (Exists) - Switch to plan mode
2. **PlanExitTool** ✅ (Exists) - Switch to build mode
3. **ImportTasksTool** ❌ (NEW) - Auto-import plan to task board
4. **UpdateTaskTool** ❌ (NEW) - Update task status from session
5. **GetTaskContextTool** ❌ (NEW) - Load task details for AI context

### Updated Task Breakdown with Orchestration

#### Task 7: Session Can Auto-Import Plans to Tasks (20 min)

**Purpose:** Session orchestrates the plan → task conversion

**Files:**

- `packages/ideaspace/src/tool/task-import.ts` - (create) New tool
- `packages/ideaspace/src/tool/registry.ts` - Register tool
- `packages/ideaspace/src/session/prompt.ts` - Add to agent prompt

**Changes:**

1. Create `ImportTasksTool` that:
   - Takes a plan file path
   - Calls `TaskBoard.importFromPlan()`
   - Reports success/failure to AI
2. Register for both plan and build agents
3. AI can say "I'll convert this plan to tasks"

**Verification:**

- AI can invoke import tool
- Tasks appear in Kanban after AI call
- No manual button clicking needed

---

#### Task 8: Session Can Update Task Status (20 min)

**Purpose:** Session tracks and updates task progress

**Files:**

- `packages/ideaspace/src/tool/task-update.ts` - (create) New tool
- `packages/ideaspace/src/tool/registry.ts` - Register tool
- `packages/app/src/pages/tasks/state.ts` - Real-time sync

**Changes:**

1. Create `UpdateTaskTool` that:
   - Takes task ID and new status
   - Updates `.ideaspace/tasks.json`
   - Broadcasts update via WebSocket
2. Session can auto-update when:
   - Task implementation started → "progress"
   - Task complete → "review" or "done"
3. Kanban board reflects changes in real-time

**Verification:**

- AI can move tasks between columns
- Task status persists
- Kanban updates without refresh

---

#### Task 9: Task-Aware Session Prompts (15 min)

**Purpose:** Session knows about tasks and can reference them

**Files:**

- `packages/ideaspace/src/session/prompt.ts` - Add task context
- `packages/ideaspace/src/task-board/index.ts` - Export task query functions

**Changes:**

1. When session starts with `?task=abc123`:
   - Load task details
   - Inject into system prompt
2. AI sees:
   ```
   You are working on task: "Implement auth module"
   Description: Setup JWT authentication...
   Dependencies: Setup database (must be done first)
   Current status: In Progress
   ```
3. AI can reference other tasks in the board

**Verification:**

- AI greets with task-specific message
- AI knows task dependencies
- AI suggests next steps based on task body

---

### Complete Orchestration Demo Script

**The Story (30 seconds):**
"Ideaspace is the first AI workspace where the AI session orchestrates your entire development workflow - from planning to implementation to completion."

**Demo Flow (90 seconds):**

1. **Open Session** (5 sec)
   - Lands on Session tab
   - "I'm your AI project orchestrator"

2. **Create Plan** (20 sec)
   - User: "Plan the authentication system"
   - AI: [PlanEnterTool] → Creates plan
   - AI writes TODOs with metadata

3. **Auto-Import to Tasks** (15 sec)
   - AI: "I'll convert this to trackable tasks"
   - [ImportTasksTool] → Tasks appear in Kanban
   - Click Tasks tab → See 4 tasks in backlog

4. **Work on Task** (30 sec)
   - Click Tasks tab
   - Point to "Implement JWT auth"
   - Click "Work on this"
   - Auto-switches to Session with task context
   - AI: "I'll help you implement JWT auth. First, let me check the dependencies..."

5. **Complete Task** (15 sec)
   - AI implements the code
   - User: "Looks good, mark it done"
   - AI: [UpdateTaskTool] → Task moves to Done
   - Kanban updates in real-time

6. **Command Palette** (5 sec)
   - Cmd+K → "Work on next task"
   - AI picks next available task

**The Close (10 seconds):**
"From planning to tracking to building - one seamless AI-orchestrated flow. That's Ideaspace."

---

### New Files to Create

1. `packages/ideaspace/src/tool/task-import.ts` - Import plan to tasks
2. `packages/ideaspace/src/tool/task-update.ts` - Update task status
3. `packages/app/src/components/task-badge.tsx` - Show active task in session

### New Files to Modify

1. `packages/ideaspace/src/tool/registry.ts` - Register new tools
2. `packages/ideaspace/src/session/prompt.ts` - Task-aware prompts
3. `packages/ideaspace/src/server/server.ts` - WebSocket for real-time updates
4. `packages/app/src/pages/tasks/state.ts` - Real-time sync from server
