# Task Sync Implementation Learnings

## Approach

Implemented live task sync between DocumentPanel (left) and ContextPanel (right) using a polling-based approach.

## Key Implementation Details

### DocumentPanel Changes

- Added `useSDK` hook to communicate with backend
- Uses event delegation on the markdown container to handle checkbox clicks
- Event delegation is necessary because Markdown component re-renders content via morphdom
- When checkbox is clicked:
  1. Find index of clicked checkbox among all checkboxes
  2. Map index to task in board data
  3. Call PATCH /task-board to update task status
  4. Call optional onTaskCheck callback

### ContextPanel Changes

- Added 2-second polling interval to refresh task board data
- Uses `onCleanup` to clear interval when component unmounts
- This ensures context panel shows updated status when tasks change

## Sync Strategy

- **MVP approach**: Polling every 2 seconds
- **Future improvement**: WebSockets for real-time updates
- Status mapping: checked = "done", unchecked = "backlog"

## Technical Notes

- Used `createSignal` for `updating` state to track which task is being updated
- Used `createStore` for local component state (mode, content)
- Type-safe API calls using SDK client with proper type casting
- All typechecks pass

## Files Modified

1. packages/app/src/components/document-panel.tsx - Checkbox click handlers
2. packages/app/src/components/context-panel.tsx - Auto-refresh interval
