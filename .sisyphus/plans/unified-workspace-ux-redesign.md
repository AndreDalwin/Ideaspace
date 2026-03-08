# Ideaspace UX/UI Redesign Plan

## Unified Document-First AI Workspace

**Version:** 1.0  
**Date:** March 8, 2026  
**Status:** Research Complete → Ready for Implementation

---

## 🎯 Executive Summary

Based on comprehensive research of modern AI workspaces (Windsurf, Cursor, ChatGPT Canvas, Notion AI), this plan proposes a **unified document-first interface** that eliminates tab-switching and creates a seamless flow between planning, conversation, and execution.

**Core Insight:** The current tab-based approach creates cognitive overhead. Users want to see their document AND chat with AI simultaneously, with clear visibility into what's included in the context.

---

## 📊 Research Synthesis

### 7 Key UX Patterns from Leading AI Tools

| Pattern                     | Tool Example      | Why It Works                           |
| --------------------------- | ----------------- | -------------------------------------- |
| **1. Side-by-Side Layout**  | Cursor, Windsurf  | Document + Chat visible simultaneously |
| **2. Context Transparency** | Cursor @-mentions | Users see exactly what's included      |
| **3. Inline Actions**       | ChatGPT Canvas    | AI suggestions appear in context       |
| **4. Token Visibility**     | Claude Code       | Real-time token usage awareness        |
| **5. Document as Source**   | Notion AI         | The document IS the workspace          |
| **6. Mode-Based UI**        | Windsurf Cascade  | Different modes for different tasks    |
| **7. Minimal Chrome**       | Linear            | Remove unnecessary UI elements         |

### What Users Actually Want (from research)

1. **See the document while chatting** - Not tabs, not switching
2. **Know what's in context** - Token count, included files
3. **Quick actions without leaving flow** - Inline, not modal
4. **Progress visibility** - Tasks, status, what's done
5. **One-page experience** - Everything accessible without navigation

---

## 🏗️ Proposed Architecture: The "Canvas" Model

### Visual Layout

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ IDEASPACE HEADER (Simplified)                                                │
│ Project: idea space                                  [Token: 12k/128k] ⚡   │
├──────────────────┬───────────────────────────────┬──────────────────────────┤
│                  │                               │                          │
│  📄 DOCUMENT     │     💬 AI CONVERSATION        │   📊 CONTEXT PANEL       │
│  (Left Panel)    │     (Center Panel)            │   (Right Panel)          │
│                  │                               │                          │
│  ┌───────────┐   │   ┌───────────────────────┐   │   ┌─────────────────┐    │
│  │ ## Plan   │   │   │ 🤖 AI Assistant       │   │   │ 📎 Context      │    │
│  │           │   │   │                       │   │   │ • file1.md      │    │
│  │ - [ ] Task│   │   │ Working on: Task #3   │   │   │ • file2.ts      │    │
│  │   details │   │   │                       │   │   │ • plan.md       │   │
│  │ - [x] Done│   │   │ Message history...    │   │   │                 │   │
│  │           │   │   │                       │   │   │ 🎯 Active Task  │   │
│  │ [Edit]    │   │   │ ┌─────────────────┐   │   │   │ Implement auth  │   │
│  └───────────┘   │   │ │ Ask anything... │   │   │   │ [Work on this]  │   │
│                  │   │ └─────────────────┘   │   │   │                 │   │
│  [Quick Actions] │   │ [Tools: 📎 🔧 📋]      │   │   │ 📈 Progress     │   │
│  • Summarize     │   │                       │   │   │ 3/5 tasks done  │   │
│  • Expand        │   │                       │   │   │                 │   │
│  • Create task   │   │                       │   │   │                 │   │
│                  │   │                       │   │   └─────────────────┘   │
└──────────────────┴───────────────────────────────┴──────────────────────────┘
     30% width              50% width                    20% width
```

### Key Changes from Current Design

| Current                        | Proposed                   | Benefit                              |
| ------------------------------ | -------------------------- | ------------------------------------ |
| Tabs (Session/Workspace/Tasks) | **Unified 3-panel layout** | No context switching                 |
| Separate pages                 | **Single workspace view**  | Always see document + chat           |
| Hidden context                 | **Context panel**          | Know what's included                 |
| Manual convert button          | **Auto-sync tasks**        | Plan checkboxes = Task board         |
| No token visibility            | **Live token counter**     | Manage context limits                |
| Static UI                      | **Mode-switching**         | Plan mode → Build mode → Review mode |

---

## 🎨 Detailed Design Specifications

### 1. Simplified Header

**Remove:**

- Duplicate tab bars (the bug!)
- "Ideaspace project" label
- Redundant navigation

**Keep:**

- Project name
- **Token counter** (NEW)
- Quick actions (New session, Settings)

```
┌──────────────────────────────────────────────────────────────┐
│ idea space                              Tokens: 12k/128k ⚡  │
│                                                  [New] [⚙️]  │
└──────────────────────────────────────────────────────────────┘
```

### 2. Document Panel (Left)

**Features:**

- Render markdown plans
- **Editable inline** (click to edit)
- **Checkboxes are live** - Check a box → Task moves to Done
- **Quick action buttons** appear on hover:
  - "Summarize this section"
  - "Expand with details"
  - "Convert to task"

**Interaction Pattern:**

```
## Plan: Authentication

- [x] Setup database        [✨ Summarize]
- [ ] Implement JWT         [✨ Start implementation]
  Need to add middleware    [✨ Expand]
- [ ] Add tests
```

### 3. AI Conversation Panel (Center)

**Features:**

- Full chat history
- **Task badge** - Shows what you're working on
- **Composer** with context tools:
  - 📎 Attach file
  - 🔧 Run command
  - 📋 Insert plan snippet
- **Inline suggestions** - AI can propose edits that appear as diff

**Smart Context:**

- Automatically includes open document
- Shows "Context: plan.md + 3 files" above chat
- Click to expand and manage

### 4. Context Panel (Right)

**Three Sections:**

**A. Attached Context**

```
📎 Context (4 items)
├── plan.md (active)
├── schema.sql
├── auth.ts
└── [+ Add file]
```

**B. Active Task**

```
🎯 Working On
Implement JWT middleware
[Backlog → Progress → Done]
[Mark complete]
```

**C. Progress Overview**

```
📈 Progress
3/5 tasks complete
├── Done: 2
├── Progress: 1
└── Backlog: 2
```

### 5. Mode Switcher (Floating or Top)

Three modes that change the interface subtly:

| Mode       | Document Panel | AI Behavior                 | Right Panel    |
| ---------- | -------------- | --------------------------- | -------------- |
| **Plan**   | Full editor    | Suggest, outline, structure | Templates      |
| **Build**  | Preview        | Implement, code, execute    | Tasks, files   |
| **Review** | Diff view      | Analyze, improve, test      | Changes, tests |

---

## 🚀 Implementation Phases

### Phase 1: Foundation (Week 1)

**Goal:** Fix immediate issues and establish new layout

**Tasks:**

1. ✅ **Fix duplicate tabs bug** (Remove ProjectTabs from session.tsx)
2. **Create unified layout component**
   - 3-column grid layout
   - Collapsible panels
   - Responsive (hide right panel on small screens)
3. **Merge Session + Workspace routes**
   - Single `/workspace` route
   - Remove tab-based navigation
4. **Add token counter** (backend + frontend)
   - Track context size
   - Display in header

**Deliverable:** Working unified layout with no tabs

### Phase 2: Document Integration (Week 2)

**Goal:** Make document and chat work together

**Tasks:**

1. **Live document preview**
   - Render plan markdown
   - Real-time updates when plan changes
2. **Context panel**
   - List attached files
   - Drag-and-drop to add
   - Remove items
3. **Auto-sync tasks**
   - Checkbox in document ↔ Task status
   - No manual "Convert to Tasks" button needed
4. **Inline quick actions**
   - Hover buttons on sections
   - "Summarize", "Expand", "Implement"

**Deliverable:** Document and chat are connected, tasks sync automatically

### Phase 3: Smart Context (Week 3)

**Goal:** AI knows what you're working on

**Tasks:**

1. **Task context injection**
   - Click task → AI knows context
   - Shows in conversation
2. **Mode switcher**
   - Plan/Build/Review modes
   - Changes AI behavior
3. **Context awareness**
   - AI suggests relevant actions
   - "I see you're working on auth..."
4. **Progress tracking**
   - Visual progress bars
   - Completion estimates

**Deliverable:** AI feels aware of your work

### Phase 4: Polish & Power Features (Week 4)

**Goal:** Make it delightful

**Tasks:**

1. **Animations**
   - Smooth panel resizing
   - Task completion celebrations
   - Mode transitions
2. **Keyboard shortcuts**
   - Cmd+1/2/3 for panels
   - Cmd+Shift+M for mode
   - Cmd+Enter to send
3. **Mobile responsive**
   - Collapse to single column
   - Swipe between panels
4. **Onboarding**
   - First-use tutorial
   - Highlight key features

**Deliverable:** Production-ready, polished experience

---

## 🎭 User Workflows

### Workflow 1: Planning a Feature

```
1. User opens workspace
2. Clicks "New Plan" (or AI suggests)
3. Document panel shows template:
   ## Feature: [Name]

   ### Overview
   [AI suggests based on prompt]

   ### TODOs
   - [ ] Task 1
   - [ ] Task 2

4. User chats with AI to refine plan
5. Tasks auto-appear in right panel
6. User clicks first task to start
```

### Workflow 2: Implementing a Task

```
1. User clicks task in document or right panel
2. Task becomes "Active" with highlight
3. AI greets: "I'll help you implement [task]"
4. User and AI discuss implementation
5. AI suggests code changes (inline diff)
6. User approves → code applied
7. User checks off task → auto-moves to Done
```

### Workflow 3: Reviewing Work

```
1. User switches to Review mode
2. Document shows diff view
3. AI analyzes changes
4. Suggests improvements
5. User applies fixes
6. All tasks complete → Project done!
```

---

## 📐 Technical Architecture

### New Components to Create

```
packages/app/src/
├── layout/
│   └── unified-workspace.tsx      # Main 3-panel layout
├── components/
│   ├── document-panel.tsx          # Left: Markdown preview/edit
│   ├── conversation-panel.tsx      # Center: Chat + composer
│   ├── context-panel.tsx           # Right: Context + tasks
│   ├── token-counter.tsx           # Header token display
│   ├── mode-switcher.tsx           # Plan/Build/Review toggle
│   └── inline-actions.tsx          # Hover quick actions
└── hooks/
    ├── use-document-sync.ts        # Sync doc ↔ tasks
    ├── use-token-count.ts          # Track context size
    └── use-active-task.ts          # Manage current task
```

### Modified Components

```
packages/app/src/
├── pages/
│   ├── project.tsx                 # Simplified, no tabs
│   ├── session.tsx                 # Integrated into workspace
│   └── workspace/
│       └── index.tsx               # New unified view
└── components/
    └── project-tabs.tsx            # Remove or repurpose
```

### Backend Changes (Minimal)

```
packages/ideaspace/src/
└── server/routes/
    └── session.ts                  # Add token count endpoint
```

---

## 🎯 Success Metrics

### User Experience

- [ ] **Zero tab switching** for core workflow
- [ ] **Context visible** at all times
- [ ] **Task completion** < 3 clicks from document
- [ ] **Token awareness** always visible

### Performance

- [ ] **First paint** < 1 second
- [ ] **Document sync** real-time
- [ ] **Chat response** streaming
- [ ] **Panel resize** 60fps

### Adoption

- [ ] Users prefer over tabbed interface
- [ ] Average session time increases
- [ ] Task completion rate improves

---

## 🛠️ Dev Mode with Hot Reload

### Setup

```bash
# Terminal 1 - Backend
cd packages/ideaspace
bun run --conditions=browser ./src/index.ts serve --port 4096

# Terminal 2 - App (Hot Reload)
cd packages/app
bun dev -- --port 4444

# Open http://localhost:4444
# Changes to .tsx files auto-reload!
```

### Quick Iteration Workflow

```bash
# Make changes to packages/app/src/components/*.tsx
# Browser auto-refreshes
# No rebuild needed for UI changes!
```

---

## 🎁 Bonus Features (Future)

### Phase 5: Advanced AI Features

- **Voice input** - Talk to AI
- **Screen sharing** - AI sees your screen
- **Multiplayer** - Real-time collaboration
- **Custom agents** - Train AI on your codebase

### Phase 6: Ecosystem

- **Templates** - Starting points for common projects
- **Plugins** - Community extensions
- **Marketplace** - Share plans, tasks, agents

---

## ✅ Immediate Next Steps

**To start implementing:**

1. **Fix the duplicate tabs bug** (5 minutes)
   - Remove `<ProjectTabs />` from `session.tsx`

2. **Set up dev mode** (2 minutes)
   - Run backend + app in separate terminals
   - Enable hot reload

3. **Create unified layout** (1 hour)
   - Build 3-column grid
   - Make panels collapsible
   - Test responsive behavior

4. **Merge Session + Workspace** (2 hours)
   - Remove tab navigation
   - Combine components
   - Update routes

**Total time to Phase 1 completion: ~4 hours**

---

## 📚 References

### Research Sources

- [ChatGPT Canvas Interface](https://openai.com/index/introducing-canvas)
- [Cursor AI UX Patterns](https://cursor.com)
- [Windsurf Cascade Flow](https://windsurf.com)
- [Notion AI Integration](https://notion.so)
- [7 Key AI UI Patterns](https://uxplanet.org/7-key-design-patterns-for-ai-interfaces-893ab96988f6)
- [Where Should AI Sit in Your UI](https://uxdesign.cc/where-should-ai-sit-in-your-ui-1710a258390e)

### Design Inspiration

- Linear (minimal chrome)
- Figma (collaborative canvas)
- GitHub Copilot (inline suggestions)
- Claude Code (context transparency)

---

## 🤔 Open Questions

1. **Mobile experience:** How should 3-panel layout work on phones?
2. **Offline mode:** Should document edits work offline?
3. **Collaboration:** Multiple users on same document?
4. **Integrations:** Connect to Linear, Jira, GitHub?

---

**Ready to implement?** Start with Phase 1 - Fix the duplicate tabs and create the unified layout!
