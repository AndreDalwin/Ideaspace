# Desktop Electron package notes

## Ideaspace Scope Note

- `packages/desktop-electron` is not part of the current hackathon implementation scope.
- Leave this package alone unless the user explicitly asks for Electron-specific work.
- If it must be touched, keep its guidance aligned with Ideaspace naming/direction without expanding the feature scope.

- Renderer process should only call `window.api` from `src/preload`.
- Main process should register IPC handlers in `src/main/ipc.ts`.
