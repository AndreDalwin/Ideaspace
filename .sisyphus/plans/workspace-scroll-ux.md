# Workspace Scrolling Fix & UX Improvements

## Context

### Original Request

Fix session content scrolling in the workspace and improve UX. Specifically:

- Scrolling with mouse/trackpad doesn't work in workspace panels
- Improve file list styling in plans list
- Better empty states when no plan is selected
- Loading feedback during "Convert to Tasks" action

### Interview Summary

**Key Discussions:**

- User confirmed scrolling issue is with mouse/trackpad interaction
- UX improvements limited to 3 specific areas: file list styling, empty states, loading feedback
- Manual verification sufficient (no automated tests needed)
- Keep minimal design style, polish existing elements only

**Technical Decisions:**

- **Testing**: Manual verification only
- **QA Approach**: Browser-based verification with actual content
- **Design**: Keep current minimal style, improve visual hierarchy

### Metis Review

**Identified Gaps (Addressed):**

- Locked down "general UX improvements" to 3 specific items
- Set hard boundaries: no new features, no redesign, no refactoring
- Explicit exclusions: no scroll-to-top buttons, no sticky headers, no mobile optimization
- Defined viewport constraint: desktop-only (per AGENTS.md)

---

## Work Objectives

### Core Objective

Fix scrolling behavior in workspace panels and polish three specific UX areas while maintaining existing design patterns.

### Concrete Deliverables

1. Fixed scrolling in `workspace.tsx` plan list and preview panels
2. Fixed scrolling in `DocumentPanel`, `ContextPanel`, `ConversationPanel`
3. Improved file list styling with better visual hierarchy
4. Enhanced empty states with helpful CTAs
5. Added loading feedback for async actions

### Definition of Done

- [ ] All workspace panels scroll correctly with mouse/trackpad
- [ ] Plans list has improved visual styling
- [ ] Empty state shows helpful CTA to start planner
- [ ] "Convert to Tasks" shows loading state
- [ ] No layout regressions or broken functionality

### Must Have

- Scrolling works in all three panels (Document, Conversation, Context)
- Scroll position preserved when switching tabs
- File list items have clear visual separation
- Empty state guides user to create first plan
- Loading feedback prevents double-submission

### Must NOT Have (Guardrails)

- NO new panels or tabs
- NO changes to tab behavior
- NO scroll-to-top buttons or sticky headers
- NO animation/transition effects
- NO mobile/responsive optimization (desktop-only)
- NO changes to ScrollView component API

---

## Verification Strategy

### Test Decision

- **Infrastructure exists**: NO (no existing workspace-specific tests)
- **User wants tests**: NO (manual verification only)
- **QA approach**: Manual verification with browser devtools

### Manual Execution Verification

**For Frontend/UI Changes:**

**Task 1-2 (Scrolling Fix):**

- [ ] Navigate to: `http://localhost:4444/{project}/workspace`
- [ ] Create a plan with 5000+ characters of content
- [ ] Verify Document panel scrolls with mouse wheel
- [ ] Verify plan list scrolls when many plans exist
- [ ] Switch to Session tab, verify conversation scrolls
- [ ] Switch to Context tab, verify context panel scrolls
- [ ] Screenshot evidence: `.sisyphus/evidence/scroll-fix.png`

**Task 3 (File List Styling):**

- [ ] Navigate to workspace
- [ ] Verify plans have clear visual separation (borders/padding)
- [ ] Verify selected state is visually distinct
- [ ] Screenshot: `.sisyphus/evidence/file-list-styling.png`

**Task 4 (Empty States):**

- [ ] Clear all plans or view empty state
- [ ] Verify empty state shows helpful message + "Start planner" CTA
- [ ] Screenshot: `.sisyphus/evidence/empty-state.png`

**Task 5 (Loading Feedback):**

- [ ] Select a plan
- [ ] Click "Convert to Tasks"
- [ ] Verify button shows spinner/disabled state
- [ ] Verify no double-submission possible
- [ ] Screenshot: `.sisyphus/evidence/loading-feedback.png`

---

## Task Flow

```
Task 1 (Scroll Fix - workspace.tsx)
       ↓
Task 2 (Scroll Fix - panels)
       ↓
Task 3 (File List Styling) - Can be done in parallel after Task 1
       ↓
Task 4 (Empty States) - Can be done in parallel after Task 1
       ↓
Task 5 (Loading Feedback) - Can be done in parallel after Task 1
       ↓
Verification (All tasks complete)
```

---

## TODOs

### Task 1: Fix Scrolling in workspace.tsx

**What to do:**

- Add proper flexbox constraints to parent containers of ScrollView components
- Left panel (plan list): Parent needs `h-full flex flex-col` and `min-h-0`
- Right panel (preview): Parent needs `h-full flex flex-col` and `min-h-0`

**Must NOT do:**

- Don't change ScrollView component itself
- Don't modify overflow settings on unrelated containers
- Don't add new styles, only fix layout structure

**Parallelizable**: NO (foundational fix)

**References:**

- `packages/app/src/pages/workspace/workspace.tsx:85` - Plan list ScrollView
- `packages/app/src/pages/workspace/workspace.tsx:146` - Preview ScrollView
- Pattern: Look at how `unified-workspace.tsx` handles panel heights

**Acceptance Criteria:**

- [ ] Plan list scrolls when content exceeds viewport
- [ ] Preview panel scrolls when markdown content is long
- [ ] Scroll with mouse wheel works in both panels
- [ ] No horizontal scrollbars appear
- [ ] Layout doesn't break when switching between tabs

**Commands to Run:**

```bash
cd packages/app
bun run typecheck  # Must pass
bun run build      # Must succeed
```

**Commit**: YES

- Message: `fix(workspace): enable scrolling in plan list and preview panels`
- Files: `packages/app/src/pages/workspace/workspace.tsx`

---

### Task 2: Fix Scrolling in Unified Workspace Panels

**What to do:**

- Fix DocumentPanel, ContextPanel scroll containers
- Ensure parent containers have proper height constraints
- Check unified-workspace.tsx panel wrappers

**Must NOT do:**

- Don't modify panel content structure
- Don't change ConversationPanel scroll behavior (it uses different mechanism)
- Don't add new ScrollView wrappers if they don't exist

**Parallelizable**: NO (depends on understanding Task 1 pattern)

**References:**

- `packages/app/src/components/document-panel.tsx:183` - ScrollView
- `packages/app/src/components/context-panel.tsx:156` - ScrollView
- `packages/app/src/components/unified-workspace.tsx:78,152` - Panel wrappers

**Acceptance Criteria:**

- [ ] DocumentPanel scrolls with long markdown content
- [ ] ContextPanel scrolls when many tasks exist
- [ ] Mouse wheel scrolling works in both panels
- [ ] Panels maintain their widths during scroll

**Commands:**

```bash
cd packages/app
bun run typecheck
```

**Commit**: YES

- Message: `fix(workspace): enable scrolling in unified workspace panels`
- Files: `packages/app/src/components/document-panel.tsx`, `packages/app/src/components/context-panel.tsx`, `packages/app/src/components/unified-workspace.tsx`

---

### Task 3: Improve File List Styling

**What to do:**

- Improve visual separation between plan items in workspace.tsx
- Add subtle borders, better padding, or background colors
- Make selected state more visually distinct
- Improve timestamp/date display styling

**Must NOT do:**

- Don't change the layout structure (already fixed in Task 1)
- Don't add icons or images
- Don't change font sizes significantly

**Parallelizable**: YES (with Task 4, 5 after Task 1 complete)

**References:**

- `packages/app/src/pages/workspace/workspace.tsx:93-107` - Plan item rendering
- Pattern: Look at sidebar styling for list item patterns

**Acceptance Criteria:**

- [ ] Plan items have clear visual separation (border or background)
- [ ] Selected plan is visually distinct (background color change)
- [ ] Timestamp has appropriate opacity/color
- [ ] Hover state provides visual feedback
- [ ] Still fits in original panel width (no overflow)

**Screenshot Verification:**

- [ ] Capture: Plan list with multiple items showing visual separation
- [ ] Capture: Selected state clearly visible
- [ ] Save to: `.sisyphus/evidence/file-list-styling.png`

**Commit**: YES

- Message: `style(workspace): improve plan list visual hierarchy`
- Files: `packages/app/src/pages/workspace/workspace.tsx`

---

### Task 4: Enhance Empty States

**What to do:**

- Improve "Select a plan to preview" empty state in preview panel
- Add helpful CTA: "Start planner session" button
- Improve "No plans yet" empty state in plan list
- Add icon or illustration placeholder for visual interest

**Must NOT do:**

- Don't add actual image files (use icon fonts only)
- Don't change the workflow significantly
- Don't add complex conditional logic

**Parallelizable**: YES (with Task 3, 5 after Task 1 complete)

**References:**

- `packages/app/src/pages/workspace/workspace.tsx:87-90` - No plans message
- `packages/app/src/pages/workspace/workspace.tsx:148-153` - Preview fallback

**Acceptance Criteria:**

- [ ] "No plans" message includes CTA button to start planner
- [ ] Preview empty state shows helpful text + "Start planner session" button
- [ ] Buttons use existing Button component with proper variants
- [ ] Empty state is vertically centered in panel

**Screenshot Verification:**

- [ ] Capture: Empty plan list with CTA
- [ ] Capture: Empty preview panel with CTA
- [ ] Save to: `.sisyphus/evidence/empty-states.png`

**Commit**: YES

- Message: `feat(workspace): add helpful CTAs to empty states`
- Files: `packages/app/src/pages/workspace/workspace.tsx`

---

### Task 5: Add Loading Feedback for Async Actions

**What to do:**

- Add loading state to "Convert to Tasks" button
- Show spinner or "Converting..." text during operation
- Disable button during loading to prevent double-submit
- Consider adding to "Start planner" button as well

**Must NOT do:**

- Don't add loading states to navigation links
- Don't add complex state management
- Don't change the API calls themselves

**Parallelizable**: YES (with Task 3, 4 after Task 1 complete)

**References:**

- `packages/app/src/pages/workspace/workspace.tsx:21-44` - handleConvert function
- `packages/app/src/pages/workspace/workspace.tsx:124-132` - Convert button
- Pattern: Look at other async buttons in the app for spinner implementation

**Acceptance Criteria:**

- [ ] Button shows spinner or "Converting..." text during operation
- [ ] Button is disabled during loading
- [ ] Button returns to normal state after completion
- [ ] Last result text still displays below button

**Screenshot Verification:**

- [ ] Capture: Button in loading state
- [ ] Save to: `.sisyphus/evidence/loading-feedback.png`

**Commit**: YES

- Message: `feat(workspace): add loading feedback to convert action`
- Files: `packages/app/src/pages/workspace/workspace.tsx`

---

## Commit Strategy

| After Task | Message                                                            | Files                                                        | Verification                   |
| ---------- | ------------------------------------------------------------------ | ------------------------------------------------------------ | ------------------------------ |
| 1          | `fix(workspace): enable scrolling in plan list and preview panels` | workspace.tsx                                                | typecheck passes, scroll works |
| 2          | `fix(workspace): enable scrolling in unified workspace panels`     | document-panel.tsx, context-panel.tsx, unified-workspace.tsx | typecheck passes               |
| 3          | `style(workspace): improve plan list visual hierarchy`             | workspace.tsx                                                | visual review                  |
| 4          | `feat(workspace): add helpful CTAs to empty states`                | workspace.tsx                                                | visual review                  |
| 5          | `feat(workspace): add loading feedback to convert action`          | workspace.tsx                                                | visual review                  |

---

## Success Criteria

### Verification Commands

```bash
cd packages/app
bun run typecheck    # Expected: No errors
bun run build        # Expected: Build succeeds
```

### Manual Verification Checklist

- [ ] Open workspace page with a project
- [ ] Create or view a plan with long content
- [ ] Verify all panels scroll with mouse wheel
- [ ] Verify file list has improved styling
- [ ] Clear plans to see empty state, verify CTAs present
- [ ] Click "Convert to Tasks", verify loading state

### Final Checklist

- [ ] All scrolling issues resolved
- [ ] No layout regressions
- [ ] TypeScript typecheck passes
- [ ] Build succeeds
- [ ] All acceptance criteria met
