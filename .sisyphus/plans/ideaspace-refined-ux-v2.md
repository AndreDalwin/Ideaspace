# Ideaspace Refined UX Plan

## Conversation-First with Context Bank & Focus Mode

**Version:** 2.0  
**Date:** March 8, 2026  
**Status:** Planning Phase

---

## 🎯 Core Concept

**"Conversation-First AI Workspace with Smart Context Management"**

The app centers around talking to AI, with powerful tools to manage what the AI knows through a Context Bank system.

---

## 📱 Main Layout Structure

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ LEFT SIDEBAR          MAIN WORKSPACE                    RIGHT PANEL        │
│ ─────────────         ──────────────                    ───────────        │
│                                                                          │
│ ┌──────────┐  ┌───────────────────────────────────┐  ┌──────────────┐   │
│ │   Logo   │  │  HEADER                           │  │ Context Bank │   │
│ ├──────────┤  │  [Project Name]    [Tabs]        │  │              │   │
│ │ Sessions │  │  Workspace | Tasks | Agents      │  │ 📎 Files     │   │
│ │  List    │  │                                   │  │ 📋 Contexts  │   │
│ ├──────────┤  ├───────────────────────────────────┤  │ ⚙️ Global    │   │
│ │ Templates│  │                                   │  └──────────────┘   │
│ │  + New   │  │  CONTENT AREA                     │                      │
│ ├──────────┤  │  (Changes based on active tab)   │                      │
│ │  Files   │  │                                   │                      │
│ │  Tree    │  │  ┌─────────────────────────────┐ │                      │
│ │          │  │  │  CONVERSATION MODE          │ │                      │
│ │ 📁 src   │  │  │  - Chat with AI             │ │                      │
│ │ 📄 doc   │  │  │  - See selected context     │ │                      │
│ │ 📄 app   │  │  └─────────────────────────────┘ │                      │
│ └──────────┘  │                                   │                      │
│               │  ┌─────────────────────────────┐ │                      │
│  [New        │  │  FOCUS MODE (Workspace Tab) │ │                      │
│   Session]   │  │  - File browser (left)      │ │                      │
│               │  │  - Chat (center)            │ │                      │
│               │  │  - Selected context (right) │ │                      │
│               │  └─────────────────────────────┘ │                      │
│               │                                   │                      │
│               │  ┌─────────────────────────────┐ │                      │
│               │  │  KANBAN (Tasks Tab)         │ │                      │
│               │  │  - Task board               │ │                      │
│               │  │  - Drag & drop              │ │                      │
│               │  └─────────────────────────────┘ │                      │
│               │                                   │                      │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 🧩 Key Components

### 1. Left Sidebar

**A. Sessions List**

- Shows all active conversations
- Each session shows: name, last message preview, timestamp
- Click to switch sessions
- "+ New Session" button at top

**B. Templates Section**

- Quick-start templates:
  - "New Project Plan"
  - "Code Review"
  - "Documentation"
  - "Bug Fix"
  - "Custom..."
- Click to start new session with template context

**C. File Tree**

- Browse project files
- Click file to:
  - Add to context (if in conversation)
  - Open in focus mode (if in workspace)
- Collapsible folders
- Search/filter files

### 2. Main Workspace (Tab-Based)

**Tab: Conversation (Default)**

- Full-width chat interface
- Shows current session
- Context indicator at top: "Using: 5 files, 2 contexts"
- Click to expand and manage context
- Quick add from context bank

**Tab: Workspace (Focus Mode)**

- 3-column layout:
  - Left: File browser (collapsible)
  - Center: AI chat + file preview
  - Right: Selected context details
- Designed for focused work on specific files

**Tab: Tasks (Kanban)**

- Task board with columns: Backlog, Progress, Review, Done
- Cards show: title, status, assigned context
- Drag & drop between columns
- Click card to open related session

**Tab: Agents**

- List of available agents
- Their capabilities and status
- Start agent-specific sessions

**Tab: Context Bank**

- Manage all contexts:
  - 📎 Files (individual files)
  - 📋 Contexts (saved groups of files)
  - ⚙️ Global (always included)
- Drag to add to current session
- Create named contexts for reuse

### 3. Right Panel: Context Bank

**Always visible context management:**

**A. Attached Files**

- List of files currently in session context
- Shows: filename, token count, remove button
- "Add from files" button

**B. Saved Contexts**

- Named context groups:
  - "API Layer" (api.ts, routes.ts, types.ts)
  - "Auth Flow" (login.ts, auth.ts, middleware.ts)
  - "Database" (schema.ts, models.ts)
- Click to add all files to session
- Create new context from current selection

**C. Global Context**

- Files always included:
  - .cursorrules, README.md
  - Config files
  - Toggle on/off

**D. Context Search**

- Search through all available files/contexts
- Quick filter

---

## 🔄 Workflow Examples

### Workflow 1: Start New Project

1. Click "+ New Session" in sidebar
2. Select template: "New Project Plan"
3. AI guides you through planning
4. Plan document auto-saves to .ideaspace/plans/
5. Check items in plan → auto-create tasks in Tasks tab
6. Switch to Workspace tab to start implementing

### Workflow 2: Work on Existing Code

1. Click file in left sidebar file tree
2. Choose: "Add to context" or "Open in Workspace"
3. If Workspace: see file + chat side-by-side
4. Select additional files from Context Bank
5. Ask AI questions about selected code
6. AI answers with full context of selected files

### Workflow 3: Context Management

1. Right-click file in tree → "Add to Context Bank"
2. Select multiple files in Context Bank
3. Click "Save as Context" → name it "Auth System"
4. Later: start new session, click "Auth System" context
5. All auth files added to session automatically

### Workflow 4: Task-Driven Work

1. Open Tasks tab
2. See Kanban with tasks from plans
3. Drag task to "Progress"
4. Click task → opens session with task context
5. AI knows what you're working on
6. Complete task → moves to Done

---

## 🎨 UI Details

### Header

```
┌────────────────────────────────────────────────────────────┐
│ Ideaspace Project    [Conversation] [Workspace] [Tasks] [Agents] [Context]  │
│ idea space                                                                     │
│ ~/Documents/idea space                                                         │
└────────────────────────────────────────────────────────────┘
```

### Left Sidebar

```
┌─────────────┐
│    Logo     │
├─────────────┤
│ + New       │
│   Session   │
├─────────────┤
│ Sessions    │
│ • First...  │
│ • API Ref   │
│ • Bug fix   │
├─────────────┤
│ Templates   │
│ • Project   │
│ • Review    │
│ • Docs      │
├─────────────┤
│ Files       │
│ 📁 src      │
│  📄 app.ts  │
│  📄 api.ts  │
│ 📄 README   │
└─────────────┘
```

### Context Bank (Right Panel)

```
┌────────────────┐
│ Context Bank   │
├────────────────┤
│ 📎 Attached    │
│ • api.ts (x)   │
│ • types.ts (x) │
│ [+ Add File]   │
├────────────────┤
│ 📋 Contexts    │
│ • Auth System  │
│ • API Layer    │
│ • Database     │
├────────────────┤
│ ⚙️ Global      │
│ • README.md ✓  │
│ • .cursor ✓    │
├────────────────┤
│ Search...      │
└────────────────┘
```

### Conversation Tab

```
┌────────────────────────────────────────────┐
│ Context: 3 files, 1 context group          │
│ (expandable dropdown)                      │
├────────────────────────────────────────────┤
│                                            │
│  🤖 AI Assistant                           │
│  I'll help you implement the auth system   │
│  with the selected files...                │
│                                            │
├────────────────────────────────────────────┤
│  [Chat input]                              │
│  "Ask anything..."                         │
│  [📎] [🔧] [📋]                            │
└────────────────────────────────────────────┘
```

### Workspace Tab (Focus Mode)

```
┌──────────┬───────────────────┬─────────────┐
│ Files    │  AI Assistant     │ Selected    │
│ 📁 src   │                   │ Context     │
│ 📄 app   │  Working on:      │             │
│ 📄 api   │  api.ts           │ api.ts      │
│ 📄 types │                   │ types.ts    │
│          │  [Code diff       │ README.md   │
│          │   preview]        │             │
│          │                   │ Tokens: 2k  │
│          │  [Chat]           │             │
└──────────┴───────────────────┴─────────────┘
```

---

## 🛠️ Implementation Plan

### Phase 1: Restore Tab Navigation (2 hours)

1. Add back ProjectTabs to unified workspace
2. Create tab-based routing:
   - /:dir/ - Conversation (default)
   - /:dir/workspace - Focus Mode
   - /:dir/tasks - Kanban
   - /:dir/agents - Agents
   - /:dir/context - Context Bank
3. Ensure tabs are visible and clickable

### Phase 2: Left Sidebar (3 hours)

1. Create collapsible sidebar component
2. Sessions list with new session button
3. Templates section
4. File tree browser
5. Wire up file selection

### Phase 3: Context Bank Right Panel (3 hours)

1. Create ContextBank component
2. Attached files section
3. Saved contexts section
4. Global context toggle
5. Search functionality
6. Drag-and-drop support

### Phase 4: Conversation Tab (2 hours)

1. Full-width chat interface
2. Context indicator bar
3. Quick context management
4. Template selection on new session

### Phase 5: Workspace Tab - Focus Mode (3 hours)

1. 3-column layout
2. Left: File browser
3. Center: Chat + file preview
4. Right: Selected context
5. Synchronized with Context Bank

### Phase 6: Tasks Tab - Kanban (2 hours)

1. Bring back existing Kanban
2. Integrate with Context Bank
3. Task-to-session linking

### Phase 7: Polish (2 hours)

1. Animations between tabs
2. Context highlighting
3. File tree icons
4. Responsive adjustments

---

## 🎁 Differentiators

1. **Context Bank** - Save and reuse file groups
2. **Two-Level Context** - Global (always) + Selected (per-session)
3. **Templates** - Start with pre-loaded context
4. **Focus Mode** - Files + Chat side-by-side
5. **Task-to-Session** - Click task, get context automatically

---

## ✅ Success Criteria

- [ ] User can see and switch between tabs
- [ ] Left sidebar shows sessions, templates, and file tree
- [ ] Right panel shows Context Bank
- [ ] New session can pick a template
- [ ] Files can be added to context from file tree
- [ ] Context groups can be saved and reused
- [ ] Workspace tab shows 3-column focus mode
- [ ] Tasks tab shows Kanban board
- [ ] Context is visible and manageable in all modes

---

## 🚀 Next Steps

1. Review this plan
2. Approve direction
3. Start Phase 1 implementation
4. Test each phase
5. Final polish

**This brings back the structure you need while keeping the powerful context management concept!**
