# Plan + Kanban Tabs with Chat Panel

## TL;DR

> **Summary**: Redesign project tabs to Plan + Kanban only, with chat session on the right side like Session tab. Remove Agents and Context tabs.
> **Deliverables**: Updated tab navigation, Plan tab with chat, Kanban tab with chat, removed Agents/Context
> **Effort**: Short (1.5 hours target)
> **Parallel**: NO - sequential due to shared components
> **Critical Path**: Update tabs → Create Plan page → Create Kanban page → Add right-panel chat to both

## Context

### Original Request

- Keep only Plan tab, Kanban tab, and Session tab
- Remove Agents and Context tabs ("context bank tab")
- Plan and Kanban should have chat session on the right side like Session tab
- 1.5 hour time constraint - build fast and simple

### Current Architecture

- **Tab definitions**: `packages/app/src/components/project-tabs.tsx` - defines 5 tabs: Workspace, Tasks, Agents, Context, Session
- **Tab content**: `packages/app/src/pages/project.tsx` - renders Workspace, Tasks, Agents, Context via Switch/Match
- **Session layout**: `packages/app/src/pages/session.tsx` - 3-panel layout with chat timeline left, SessionSidePanel right, Terminal bottom
- **Side panel**: `packages/app/src/pages/session/session-side-panel.tsx` - review tabs, file tree, resize handles

### Technical Decisions

1. **Reuse Session layout pattern** - Use flex row with session panel width calculation
2. **Simplified chat panel** - Don't need full SessionSidePanel complexity, just chat interface
3. **Repurpose existing components** - Use SessionComposerRegion for chat input, MessageTimeline-style display
4. **No session history window** - Keep it simple, just current chat

## Work Objectives

### Core Objective

Create Plan and Kanban tabs with integrated right-side chat, removing Agents and Context tabs from navigation.

### Deliverables

1. Updated project-tabs.tsx with 3 tabs: Plan, Kanban, Session
2. New Plan page with markdown/planning content + right chat panel
3. New Kanban page with kanban board + right chat panel
4. Shared ChatPanel component for reuse

### Definition of Done

- [ ] Navigate to /{dir}/plan shows Plan tab with chat on right
- [ ] Navigate to /{dir}/kanban shows Kanban tab with chat on right
- [ ] Agents and Context tabs removed from navigation
- [ ] Session tab continues working as before
- [ ] Chat in Plan/Kanban can send messages and shows responses

### Must Have

- Working tab navigation (Plan, Kanban, Session)
- Right-side chat panel in Plan and Kanban tabs
- Chat can send messages and receive AI responses
- Responsive layout (chat panel collapses/hides on mobile)

### Must NOT Have

- Full Session complexity (no file tabs, review panel, terminal)
- Session history management
- File tree integration in chat panel
- Drag/drop for tabs
- Perfect styling - keep it functional

## Execution Strategy

### Wave 1: Tab Navigation Update (15 min)

Update project-tabs.tsx to show only Plan, Kanban, Session.

### Wave 2: Shared ChatPanel Component (20 min)

Create simplified chat panel component that can be reused across Plan and Kanban.

### Wave 3: Plan Page (25 min)

Create Plan page with planning content on left, chat on right.

### Wave 4: Kanban Page (25 min)

Create Kanban page with kanban board on left, chat on right.

### Wave 5: Router & Integration (15 min)

Update routing and verify all tabs work.

## TODOs

- [x] 1. Update tab definitions in project-tabs.tsx

  **What to do**:
  - Change tabs array to: Plan, Kanban, Session
  - Update href() logic for new routes
  - Remove Agents and Context tab entries

  **Must NOT do**:
  - Don't change Session tab routing logic
  - Don't add complex active state logic

  **Recommended Agent Profile**:
  - Category: `quick`
  - Skills: []
  - Omitted: git-master (no commits needed yet)

  **Parallelization**: Wave 1 | Blocks: 2, 3, 4 | Blocked By: none

  **References**:
  - Pattern: `packages/app/src/components/project-tabs.tsx:4-10` - tabs array definition
  - Pattern: `packages/app/src/components/project-tabs.tsx:16-28` - href and active logic

  **Acceptance Criteria**:
  - [ ] Tabs show: Plan, Kanban, Session
  - [ ] Clicking each navigates to correct route
  - [ ] No Agents or Context tabs visible

  **QA Scenarios**:

  ```
  Scenario: Tab navigation works
    Tool: interactive_bash
    Steps:
      1. Start dev server
      2. Navigate to project page
      3. Click Plan tab
      4. Click Kanban tab
      5. Click Session tab
    Expected: Each tab navigates to correct route without errors
    Evidence: .sisyphus/evidence/task-1-tabs-navigation.png
  ```

  **Commit**: NO

- [x] 2. Create ChatPanel shared component

  **What to do**:
  - Create `packages/app/src/components/chat-panel.tsx`
  - Implement simplified chat interface
  - Use SessionComposerRegion for input
  - Show message list (simplified MessageTimeline)
  - Add resize handle for width adjustment
  - Support mobile responsive (hide on small screens)

  **Must NOT do**:
  - Don't implement full session history
  - Don't add file tabs or review panel
  - Don't add terminal integration

  **Recommended Agent Profile**:
  - Category: `unspecified-high`
  - Skills: []
  - Omitted: git-master

  **Parallelization**: Wave 2 | Blocks: 3, 4 | Blocked By: none

  **References**:
  - Pattern: `packages/app/src/pages/session/session-side-panel.tsx:30-50` - side panel structure
  - Pattern: `packages/app/src/pages/session/composer/session-composer-region.tsx` - composer input
  - Pattern: `packages/app/src/pages/session/message-timeline.tsx` - message display
  - Component: ResizeHandle from @opencode-ai/ui

  **Acceptance Criteria**:
  - [ ] Component renders chat interface
  - [ ] Can type and send messages
  - [ ] Shows AI responses
  - [ ] Has resize handle for width
  - [ ] Hidden on mobile (< 768px)

  **QA Scenarios**:

  ```
  Scenario: Chat panel works
    Tool: interactive_bash
    Steps:
      1. Render ChatPanel in isolation
      2. Type "hello" and submit
      3. Verify message appears in list
    Expected: Message sent successfully
    Evidence: .sisyphus/evidence/task-2-chat-panel.png
  ```

  **Commit**: NO

- [x] 3. Create Plan page component

  **What to do**:
  - Create `packages/app/src/pages/plan.tsx`
  - Use 2-column layout: left = planning content, right = ChatPanel
  - Add ProjectTabs at top
  - Left side: markdown editor or simple planning interface
  - Right side: ChatPanel instance
  - Handle responsive layout

  **Must NOT do**:
  - Don't build full markdown editor (use textarea or simple div)
  - Don't implement complex planning features
  - Don't add file operations

  **Recommended Agent Profile**:
  - Category: `unspecified-high`
  - Skills: []
  - Omitted: git-master

  **Parallelization**: Wave 3 | Blocks: 5 | Blocked By: 1, 2

  **References**:
  - Pattern: `packages/app/src/pages/session.tsx:1245-1375` - main layout structure
  - Pattern: `packages/app/src/pages/project.tsx:81-138` - Workspace component as reference
  - Layout: flex row with sessionPanelWidth style calculation

  **Acceptance Criteria**:
  - [ ] Page loads at /{dir}/plan
  - [ ] Shows ProjectTabs
  - [ ] Left side has planning content area
  - [ ] Right side has working chat panel
  - [ ] Layout is responsive

  **QA Scenarios**:

  ```
  Scenario: Plan page loads
    Tool: interactive_bash
    Steps:
      1. Navigate to /{dir}/plan
      2. Verify page loads without errors
      3. Send test message in chat
    Expected: Page renders, chat works
    Evidence: .sisyphus/evidence/task-3-plan-page.png
  ```

  **Commit**: NO

- [x] 4. Create Kanban page component

  **What to do**:
  - Create `packages/app/src/pages/kanban.tsx`
  - Use 2-column layout: left = kanban board, right = ChatPanel
  - Add ProjectTabs at top
  - Left side: kanban columns with cards (reuse Tasks pattern)
  - Right side: ChatPanel instance
  - Handle responsive layout

  **Must NOT do**:
  - Don't implement drag/drop (static cards OK for now)
  - Don't add complex kanban features
  - Don't persist kanban state

  **Recommended Agent Profile**:
  - Category: `unspecified-high`
  - Skills: []
  - Omitted: git-master

  **Parallelization**: Wave 4 | Blocks: 5 | Blocked By: 1, 2

  **References**:
  - Pattern: `packages/app/src/pages/project.tsx:140-177` - Tasks component (kanban board)
  - Pattern: `packages/app/src/pages/session.tsx:1245-1375` - layout structure
  - Data: Use static board data from project.tsx:31-36

  **Acceptance Criteria**:
  - [ ] Page loads at /{dir}/kanban
  - [ ] Shows ProjectTabs
  - [ ] Left side shows kanban columns (To do, In progress, Review, Done)
  - [ ] Right side has working chat panel
  - [ ] Layout is responsive

  **QA Scenarios**:

  ```
  Scenario: Kanban page loads
    Tool: interactive_bash
    Steps:
      1. Navigate to /{dir}/kanban
      2. Verify kanban columns visible
      3. Send test message in chat
    Expected: Kanban renders, chat works
    Evidence: .sisyphus/evidence/task-4-kanban-page.png
  ```

  **Commit**: NO

- [x] 5. Update routing and integration

  **What to do**:
  - Update router config to add /plan and /kanban routes
  - Remove /workspace, /tasks, /agents, /context routes
  - Update default redirect to /plan
  - Update project.tsx Switch to remove old tab content
  - Test all navigation flows

  **Must NOT do**:
  - Don't delete old components yet (keep for reference)
  - Don't change Session routes

  **Recommended Agent Profile**:
  - Category: `quick`
  - Skills: []
  - Omitted: git-master

  **Parallelization**: Wave 5 | Blocks: F1-F4 | Blocked By: 1, 3, 4

  **References**:
  - Pattern: Router config in `packages/app/src/app.tsx` or similar
  - Pattern: `packages/app/src/pages/project.tsx:302-316` - Switch/Match structure

  **Acceptance Criteria**:
  - [ ] /{dir} redirects to /{dir}/plan
  - [ ] /{dir}/plan shows Plan page
  - [ ] /{dir}/kanban shows Kanban page
  - [ ] /{dir}/session shows Session page
  - [ ] Old routes (/workspace, /tasks, /agents, /context) don't break (404 or redirect)

  **QA Scenarios**:

  ```
  Scenario: All routes work
    Tool: interactive_bash
    Steps:
      1. Test /{dir} redirects to /{dir}/plan
      2. Test /{dir}/plan
      3. Test /{dir}/kanban
      4. Test /{dir}/session
    Expected: All routes load correct pages
    Evidence: .sisyphus/evidence/task-5-routes.png
  ```

  **Commit**: YES | Message: `feat(tabs): add Plan and Kanban tabs with integrated chat` | Files: project-tabs.tsx, plan.tsx, kanban.tsx, chat-panel.tsx, router config

## Final Verification Wave (ALL must APPROVE)

- [ ] F1. Tab navigation audit - Check all 3 tabs work, no broken routes
- [ ] F2. Chat functionality test - Send messages in both Plan and Kanban
- [ ] F3. Responsive layout check - Verify mobile behavior
- [ ] F4. Code review - Check for obvious issues

## Success Criteria

1. User can navigate between Plan, Kanban, and Session tabs
2. Plan tab shows planning interface with chat on right
3. Kanban tab shows kanban board with chat on right
4. Chat in both tabs can send/receive messages
5. Agents and Context tabs no longer visible
6. Layout works on desktop and mobile

## Time Budget

- Tab navigation update: 15 min
- ChatPanel component: 20 min
- Plan page: 25 min
- Kanban page: 25 min
- Router & integration: 15 min
- **Total**: 1 hour 40 min (buffer for issues)

## Simplifications for Speed

1. **ChatPanel** - Don't implement full session store integration, use simple local state
2. **Plan content** - Use simple textarea or static content, not full editor
3. **Kanban** - Static cards, no drag/drop
4. **Styling** - Use existing Tailwind classes, minimal custom CSS
5. **Persistence** - No need to persist chat or kanban state for MVP

## Notes

- This is a hackathon-speed implementation - prioritize functionality over polish
- Session tab should remain untouched - it's the core AI experience
- If time runs short, Kanban can be even simpler (just columns with placeholder cards)
