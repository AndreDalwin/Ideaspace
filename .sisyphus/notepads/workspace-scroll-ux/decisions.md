# Workspace Scroll UX - Decisions

## Architectural Decisions

### Scroll Fix Strategy

- Add `h-full flex flex-col min-h-0` pattern to parent containers
- Keep ScrollView with `flex-1` as-is
- Don't modify ScrollView component itself

### UX Improvements Scope

1. File list styling - visual separation, selected state
2. Empty states - helpful CTAs when no plan selected
3. Loading feedback - spinner on Convert to Tasks button

### Design Approach

- Keep minimal/current style
- Polish existing elements only
- No new features or redesign
