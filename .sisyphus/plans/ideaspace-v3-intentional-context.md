# Ideaspace Refined UX Plan V3

## Intentional Context Management for Non-Tech Users

**Version:** 3.0  
**Date:** March 8, 2026  
**Status:** Planning Phase

---

## 🎯 Core Philosophy

**"Start Simple, Build Intentionally"**

- Workspace starts **blank/clean**
- Users add context **on-demand** (not auto-include)
- **Token-conscious**: Only include what you need
- **Template-driven**: Skills and hooks for non-tech workflows
- **Respects .gitignore**: Clean file tree

---

## 🏗️ Architecture

### Core Concepts

**1. Skills** (System-level capabilities)

- Pre-configured AI behaviors
- Examples: "Technical Writing", "Code Review", "Project Planning"
- Include prompt templates + default context
- Users can create custom skills

**2. Hooks** (Workflow automations)

- Triggered actions based on events
- Examples: "On save, run linter", "On task complete, update plan"
- Non-tech friendly rule builder

**3. Templates** (Session starters)

- Based on Skills
- Examples: "Write a blog post", "Review this code", "Plan a feature"
- Include starter context + skill configuration

**4. Context Bank** (File management)

- **Global Context**: Always included (user selects)
- **Selected Context**: Per-session files
- **Respects .gitignore**: Clean file tree

---

## 📱 Layout

```
┌─────────────────────────────────────────────────────────────────────────┐
│ TOP BAR                                                                  │
│ [Logo] [Project: idea-space] [Search] [Settings] [Token: 12k/128k]      │
├──────────┬────────────────────────────────────────────┬─────────────────┤
│ SIDEBAR  │  MAIN AREA                                   │ CONTEXT PANEL   │
│          │                                              │                 │
│ 🏠 Home  │  [Tabs: Workspace | Tasks | Context Bank]   │ 📌 ATTACHED     │
│ ➕ New   │                                              │ • plan.md       │
│   Session│                                              │ • style.css     │
│ ───────  │  WORKSPACE TAB (Default, starts BLANK):    │ [+ Add Files]   │
│          │                                              │                 │
│ 📋 My    │  ┌──────────────────────────────────┐       │ 📚 GLOBAL       │
│    Work  │  │                                  │       │ (Always On)     │
│ ───────  │  │  👋 Welcome to your workspace    │       │ • README.md ✓   │
│          │  │                                  │       │ • .cursorrules✓ │
│ 🎨 Skills│  │  This is your blank canvas.      │       │                 │
│ • Write  │  │  Start by:                       │       │ 📁 SAVED SETS   │
│ • Review │  │                                  │       │ • "Blog Setup"  │
│ • Plan   │  │  1. Pick a skill/template        │       │ • "API Dev"     │
│ ───────  │  │  2. Add files to context         │       │ [Save Current]  │
│          │  │  3. Start working with AI        │       │                 │
│ 📁 Files │  │                                  │       │ 🔍 SEARCH       │
│ 📂 docs  │  │  [🎨 Pick Skill] [📁 Add Files]   │       │ Search files... │
│ 📂 src   │  │                                  │       │                 │
│ 📄 .md   │  └──────────────────────────────────┘       └─────────────────┘
└──────────┴────────────────────────────────────────────┴─────────────────┘
```

---

## 🎨 Detailed Components

### 1. Top Bar

```
┌─────────────────────────────────────────────────────────────────────────┐
│  🧠 Ideaspace          idea-space                Search...    ⚙️  12k/128k│
│                        ~/Documents/idea-space                        🔋│
└─────────────────────────────────────────────────────────────────────────┘
```

**Elements:**

- Logo + App name
- Current project name + path
- Global search
- Settings button
- Token counter (visible but not intrusive)

---

### 2. Left Sidebar

#### Section A: Quick Actions

```
┌─────────────┐
│ 🏠 Home     │  ← Go to welcome/landing
├─────────────┤
│ ➕ New      │  ← Start fresh session
│   Session   │
└─────────────┘
```

#### Section B: My Work (Sessions)

```
┌─────────────┐
│ 📋 My Work  │
├─────────────┤
│ 📝 Blog post│  ← Active session
│ 💻 API dev  │
│ 🔍 Bug fix  │
│ ...         │
└─────────────┘
```

#### Section C: Skills (The Game Changer)

```
┌─────────────┐
│ 🎨 Skills   │
├─────────────┤
│ ✍️ Write    │  ← Technical writing skill
│   Content   │
│             │
│ 👨‍💻 Code    │  ← Development skill
│   Review    │
│             │
│ 📊 Project  │  ← Planning skill
│   Plan      │
│             │
│ 🎨 Custom   │  ← User-created
│   Design    │
│             │
│ ➕ Create   │  ← Build new skill
│   Skill     │
└─────────────┘
```

**Skill Detail (on hover/click):**

```
Skill: "Write Content"
─────────────────────────
Purpose: Technical writing
and documentation

Default Context:
• style-guide.md
• brand-voice.md

Prompt Template:
"You are a technical writer.
Review for clarity, grammar,
and consistency..."

[Use This Skill] [Edit]
```

#### Section D: File Tree

```
┌─────────────┐
│ 📁 Files    │
│ (respects   │
│  .gitignore)│
├─────────────┤
│ 📂 docs     │
│  📄 api.md  │
│ 📂 src      │
│  📄 app.ts  │
│  📄 utils.ts│
│ 📄 README   │
└─────────────┘

Right-click menu:
• Add to Context
• Add to Global
• Open in Workspace
• Copy Path
```

---

### 3. Main Area: Tabs

#### Tab: Workspace (Default, Blank State)

**Blank State:**

```
┌──────────────────────────────────────────────┐
│                                              │
│              👋 Welcome Back                 │
│                                              │
│         Your workspace is ready.             │
│                                              │
│   Start with intention. What would you       │
│   like to accomplish today?                  │
│                                              │
│     ┌────────────────────────────┐          │
│     │ 🎨 Pick a Skill            │          │
│     │                            │          │
│     │ Choose a pre-configured    │          │
│     │ skill to get started fast  │          │
│     └────────────────────────────┘          │
│                                              │
│     ┌────────────────────────────┐          │
│     │ 📁 Add Files to Context    │          │
│     │                            │          │
│     │ Select files from your     │          │
│     │ project to work with       │          │
│     └────────────────────────────┘          │
│                                              │
│     ┌────────────────────────────┐          │
│     │ 💬 Start Blank Session     │          │
│     │                            │          │
│     │ Jump right in and ask      │          │
│     │ the AI anything            │          │
│     └────────────────────────────┘          │
│                                              │
└──────────────────────────────────────────────┘
```

**Active State (after picking skill):**

```
┌──────────────────────────────────────────────┐
│ 🎨 Using Skill: "Write Content"              │
│ Context: 3 files attached                    │
│ [Manage Context]                             │
├──────────────────────────────────────────────┤
│                                              │
│  💬 Conversation with AI                     │
│                                              │
│  🤖: I'll help you write content. I see     │
│      you have the style guide loaded.       │
│                                              │
│  👤: Help me write a blog post about...     │
│                                              │
├──────────────────────────────────────────────┤
│  Ask anything...                    [Send]   │
│  [📎] [🔧] [📋]                              │
└──────────────────────────────────────────────┘
```

#### Tab: Tasks (Kanban)

```
┌──────────────────────────────────────────────┐
│ 📊 Tasks                              [+ New]│
├──────────────────────────────────────────────┤
│                                              │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐      │
│  │ BACKLOG │  │PROGRESS │  │  DONE   │      │
│  │   5     │  │   2     │  │   8     │      │
│  ├─────────┤  ├─────────┤  ├─────────┤      │
│  │ Write   │  │ Review  │  │ Setup   │      │
│  │ intro   │  │ API     │  │ repo    │      │
│  │         │  │ docs    │  │         │      │
│  │ Plan    │  │         │  │ Deploy  │      │
│  │ outline │  │         │  │         │      │
│  └─────────┘  └─────────┘  └─────────┘      │
│                                              │
│  [Drag cards between columns]                │
│                                              │
└──────────────────────────────────────────────┘
```

#### Tab: Context Bank

```
┌──────────────────────────────────────────────┐
│ 📚 Context Bank                              │
├──────────────────────────────────────────────┤
│                                              │
│ 📌 ATTACHED (Current Session)                │
│ ─────────────────────────────────────────    │
│ • style-guide.md                    [✕]     │
│ • brand-voice.md                    [✕]     │
│ • blog-draft.md                     [✕]     │
│                                              │
│ [+ Add More Files]                           │
│                                              │
│ 📚 GLOBAL (Always Included)                  │
│ ─────────────────────────────────────────    │
│ ☑ README.md                                  │
│ ☑ .cursorrules                               │
│ ☐ package.json                    [Add]      │
│ ☐ tsconfig.json                   [Add]      │
│                                              │
│ 💾 SAVED CONTEXT SETS                        │
│ ─────────────────────────────────────────    │
│ 📁 "Blog Writing Kit"            [Load]      │
│    style-guide + brand-voice                 │
│                                              │
│ 📁 "API Development"             [Load]      │
│    api.ts + types.ts + docs                  │
│                                              │
│ [💾 Save Current as Set]                     │
│                                              │
│ 🔍 QUICK SEARCH                              │
│ ─────────────────────────────────────────    │
│ [Search files...]                            │
│                                              │
│ Results:                                     │
│ • 📄 src/components/Button.tsx  [+ Add]      │
│ • 📄 src/styles/theme.css       [+ Add]      │
│                                              │
└──────────────────────────────────────────────┘
```

---

### 4. Right Panel: Context at a Glance

Always visible mini version:

```
┌────────────────┐
│ 📌 Context     │
├────────────────┤
│ 3 files        │
│ attached       │
│                │
│ [View All]     │
│                │
│ 📚 Global:     │
│ 2 files        │
│                │
│ [Manage]       │
└────────────────┘
```

Expanded (click to expand):

```
┌──────────────────────────┐
│ 📌 Context Bank          │
├──────────────────────────┤
│                          │
│ ATTACHED (Session)       │
│ • style-guide.md    [✕]  │
│ • brand-voice.md    [✕]  │
│ • blog-draft.md     [✕]  │
│                          │
│ [+ Add File]             │
│                          │
│ GLOBAL (Always On)       │
│ ☑ README.md              │
│ ☑ .cursorrules           │
│                          │
│ [Manage Global]          │
│                          │
│ 💾 SAVED SETS            │
│ • "Blog Kit" →           │
│ • "API Dev" →            │
│                          │
│ [Save Current]           │
│                          │
└──────────────────────────┘
```

---

## 🎭 Skills System (Non-Tech Friendly)

### What is a Skill?

A **Skill** is a pre-configured AI assistant setup:

- **Name**: "Write Blog Posts"
- **Icon**: 📝
- **Purpose**: Technical writing and content creation
- **Prompt**: "You are a technical writer..."
- **Default Context**: style-guide.md, brand-voice.md
- **Hooks**: None (or "On save, suggest improvements")

### Creating a Skill (Simple Form)

```
Create New Skill
────────────────

Name: [Write Blog Posts        ]

Icon: [📝] (picker)

Purpose:
[Technical writing for      ]
[our developer blog         ]

AI Instructions:
[You are a technical writer  ]
[specialized in developer    ]
[content...                  ]

Default Files to Include:
☑ style-guide.md
☑ brand-voice.md
☑ examples/ folder

[Save Skill]
```

### Using a Skill

1. Click skill in sidebar
2. New session starts with:
   - Skill's prompt template loaded
   - Default files auto-added to context
   - Context bank shows attached files
3. Start chatting with AI

---

## 🪝 Hooks System (Optional Power Feature)

For advanced users, add automation:

```
Hooks for "Write Content" Skill
────────────────────────────────

When: [On File Save ▼]
Do:   [Check grammar and suggest]
      [improvements                ]

When: [On Task Complete ▼]
Do:   [Update plan document with]
      [completion status           ]
```

**Non-tech friendly:** Use plain English + dropdowns

---

## 🔄 Example Workflows

### Workflow 1: Non-Tech User Writes Blog Post

1. **Open app** → See blank workspace
2. **Click** "📝 Write Content" skill
3. **Session starts** with style-guide.md loaded
4. **AI greets**: "I'll help you write. I see your style guide."
5. **User**: "Help me write about our new API"
6. **AI**: Writes content following style guide
7. **User drags** api.ts into context
8. **AI**: Now knows API details, references them
9. **Save**: Context saved as "API Blog Post" set

### Workflow 2: Developer Reviews Code

1. **Click** "👨‍💻 Code Review" skill
2. **Drag files** from tree to context
3. **Ask AI**: "Review these files for bugs"
4. **AI analyzes** with code review skill
5. **Click** Tasks tab → create task from finding
6. **Fix bug** → mark task done

### Workflow 3: Building Custom Skill

1. **Click** "➕ Create Skill"
2. **Name**: "Customer Support"
3. **Upload**: faq.pdf, products.csv
4. **Write**: "You are a helpful support agent..."
5. **Save**
6. **Team member** clicks skill → gets support agent

---

## 🛠️ Implementation Phases

### Phase 1: Foundation (4 hours)

- Blank workspace default
- Top bar with token counter
- Sidebar structure
- Tab navigation

### Phase 2: Skills System (4 hours)

- Skill data model
- Skill creation form
- Skill selector in sidebar
- Skills applied to sessions

### Phase 3: Context Management (3 hours)

- Global context (user-selected)
- Selected context (per-session)
- Context Bank panel
- Save/load context sets

### Phase 4: File Tree (2 hours)

- Respect .gitignore
- File tree in sidebar
- Add to context actions

### Phase 5: Workspace Integration (3 hours)

- Blank state welcome
- Skill-based sessions
- Context visualization
- Hook system (basic)

### Phase 6: Tasks Tab (2 hours)

- Bring back Kanban
- Task-to-skill linking

### Phase 7: Polish (2 hours)

- Smooth animations
- Empty states
- Onboarding

**Total: 20 hours**

---

## ✅ Success Criteria

- [ ] Workspace starts blank with welcome message
- [ ] Skills system: create, edit, use
- [ ] Global context: user selects what's always on
- [ ] Selected context: per-session file picking
- [ ] File tree respects .gitignore
- [ ] Context Bank: save/load sets
- [ ] Token counter visible
- [ ] Non-tech users can create skills
- [ ] Workflows feel intentional, not overwhelming

---

## 🎁 Key Differentiators

1. **Skills System**: Pre-configured AI personalities
2. **Intentional Context**: User picks, not auto-include
3. **Token-Conscious**: Always visible token count
4. **Non-Tech Friendly**: Skills make AI accessible
5. **Builds Up**: Start blank, add complexity as needed
6. **Respects .gitignore**: Clean file tree

---

## 🚀 Next Steps

1. **Review** this refined plan
2. **Confirm** skills concept resonates
3. **Start Phase 1** implementation
4. **Test** with non-tech user scenario

**This version focuses on intentional, skill-driven workflows that start simple and scale with user needs!**
