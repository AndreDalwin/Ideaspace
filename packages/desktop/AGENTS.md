# Desktop package notes

## Ideaspace Desktop Direction

- `packages/desktop` is the primary product surface for the current hackathon pass.
- Prefer Ideaspace branding, Ideaspace deep links, and project-based navigation where it touches the desktop shell.
- Desktop work should support the starter tabs (`Workspace`, `Tasks`, `Agents`, `Context`, `Session`) without removing the underlying AI/session flow.
- If desktop config, menu, or Tauri metadata changes, run the desktop build before finishing.

- Never call `invoke` manually in this package.
- Use the generated bindings in `packages/desktop/src/bindings.ts` for core commands/events.
