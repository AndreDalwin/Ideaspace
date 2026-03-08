# Ideaspace Workspace System - Decisions

## Architectural Decisions

### Task Storage

- **Decision**: Use `.ideaspace/tasks.json` file instead of database
- **Reason**: Lightweight, no migrations needed, fits MVP scope

### Plan→Task Conversion

- **Decision**: One-time import, not live sync
- **Reason**: Avoids complexity of bidirectional sync, allows independent kanban evolution

### Auto-open Behavior

- **Decision**: Auto-select newest plan by default, auto-switch when new plan created
- **Reason**: Streamlines workflow from planner to Workspace

### Column Structure

- **Decision**: Fixed 4 columns: backlog, progress, review, done
- **Reason**: Standard kanban flow, no configuration needed for MVP

### Dependency Handling

- **Decision**: Parse from plan metadata, block movement until prerequisites done
- **Reason**: Simple visualization of blocked work without complex dependency editing UI

- Deferred backend token endpoint; TokenCounter uses placeholder data now and will consume real endpoint later when available.
