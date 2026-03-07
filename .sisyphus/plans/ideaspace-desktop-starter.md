# Ideaspace desktop starter

## Goal

Turn the current desktop app into an Ideaspace-branded starter shell for project-based work while keeping the existing AI session experience available.

## Scope

- Desktop-first changes only
- Keep current session/chat UI intact as one project tab
- Add starter project tabs for Workspace, Tasks, Agents, and Context
- Make Ideaspace the primary desktop/runtime brand and config folder name
- Do not clean up TUI or unrelated packages in this pass

## Files to change

- `packages/app/src/app.tsx`
- `packages/app/src/pages/home.tsx`
- `packages/app/src/pages/layout.tsx`
- `packages/app/src/pages/session.tsx`
- `packages/app/src/i18n/en.ts`
- `packages/app/src/pages/layout/deep-links.ts`
- `packages/desktop/src/index.tsx`
- `packages/desktop/src/menu.ts`
- `packages/desktop/src/i18n/en.ts`
- `packages/desktop/src/i18n/index.ts`
- `packages/desktop/src-tauri/tauri.conf.json`
- `packages/desktop/src-tauri/tauri.prod.conf.json`
- `packages/desktop/src-tauri/tauri.beta.conf.json`
- `packages/opencode/src/global/index.ts`
- `packages/opencode/src/config/paths.ts`
- `packages/opencode/src/config/config.ts`
- `packages/opencode/src/project/project.ts`
- `packages/opencode/src/session/index.ts`
- `packages/opencode/src/agent/agent.ts`

## Planned changes

1. Add project routes and a shared project tab shell for Workspace, Tasks, Agents, Context, and Session.
2. Make project navigation land on Workspace by default while preserving direct session routes.
3. Add starter placeholder pages so teammates can branch off cleanly.
4. Rebrand desktop-facing English copy from OpenCode to Ideaspace.
5. Switch deep links and Tauri product naming from opencode to ideaspace.
6. Make runtime config/data discovery Ideaspace-first by writing to `ideaspace` / `.ideaspace` while still reading legacy `.opencode` locations where practical.
7. Run diagnostics, tests, typecheck, and build for the touched packages.

## Verification

- `lsp_diagnostics` clean on modified TS/TSX files
- `bun test --preload ./happydom.ts ./src` in `packages/app`
- `bun run typecheck` in `packages/app`
- `bun run build` in `packages/app`
- `bun run build` in `packages/desktop` if config changes require it
