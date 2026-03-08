# Unified Workspace Component

## Overview

Created a 3-panel layout component for the Canvas Model that replaces tab-based navigation with side-by-side document + chat + context view.

## File Location

`packages/app/src/components/unified-workspace.tsx`

## Layout Structure

- **Document Panel (Left)**: 320px default, resizable 240-600px, collapsible
- **Conversation Panel (Center)**: Flexible width (fills remaining space)
- **Context Panel (Right)**: 240px default, resizable 200-480px, collapsible, hides on mobile

## Key Features

- Resizable panels using ResizeHandle from @opencode-ai/ui
- Collapsible panels with icon buttons
- Responsive: Context panel hides on screens < 1024px
- Clean minimal chrome with panel headers

## Props Interface

```typescript
interface UnifiedWorkspaceProps {
  document: JSX.Element // Left panel content
  conversation: JSX.Element // Center panel content
  context: JSX.Element // Right panel content
}
```

## Implementation Notes

- Uses createStore pattern with createSignal for panel state
- ResizeHandle uses pixel values (min/max), not percentages
- IconButton requires `icon` prop with icon name string
- Size prop values: "small" | "normal" | "large" (not "sm")
- Uses calc() for flexible center panel width

## Icons Used

- `layout-left`: For document panel toggle
- `layout-right`: For context panel toggle

## Responsive Behavior

- Context panel hidden when `isDesktop()` returns false (< 1024px)
- Show/hide buttons appear when panels are collapsed

---

# Unified Workspace Page Integration

## Page File Location

`packages/app/src/pages/unified-workspace.tsx`

## Integration Points

### Document Panel Integration

- Uses `createWorkspaceState()` from `@/pages/workspace/state`
- Passes `selectedPlan()` as `planPath` prop to DocumentPanel
- Automatically loads and displays the most recent plan from `.ideaspace/plans`

### Conversation Panel Integration

- Uses session ID from URL search params (`searchParams.id`)
- Handles array type from search params by using `createMemo` to extract first element
- Passes `clearTask` callback to handle task dismissal from URL

### Context Panel Integration

- Currently passes empty `attachedFiles` array as starter implementation
- Task board data is loaded internally by ContextPanel via SDK

## Provider Structure

The unified workspace wraps all three panels with required providers:

- `TerminalProvider` - Terminal/shell integration
- `PromptProvider` - Prompt/composer state
- `CommentsProvider` - File comments functionality

## Routing Changes

Main routes now use UnifiedWorkspaceRoute:

- `/` (root directory route)
- `/workspace`
- `/tasks`
- `/session/:id?`

Kept as ProjectRoute (legacy tab-based):

- `/agents`
- `/context`

## Type Safety Pattern for Search Params

```typescript
const sessionId = createMemo(() => {
  const id = searchParams.id
  return Array.isArray(id) ? id[0] : id
})
```

SolidJS router can return `string | string[] | undefined` for search params, so we normalize to `string | undefined`.
